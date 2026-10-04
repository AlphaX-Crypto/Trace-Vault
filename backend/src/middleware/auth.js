const authService = require('../services/authService');
const caseService = require('../services/caseService');
const auditRepository = require('../repositories/auditRepository');
const { hasPermission, ROLES } = require('../config/permissions');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

/**
 * Authentication middleware that verifies JWT Bearer token
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Missing authorization token.', 401, 'UNAUTHENTICATED');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Authentication required. Missing authorization token.', 401, 'UNAUTHENTICATED');
    }

    const decoded = authService.verifyToken(token);
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-Based Access Control middleware
 * @param {...string} allowedRoles Allowed role names
 */
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHENTICATED');
      }

      if (!allowedRoles.map(r => r.toUpperCase()).includes(req.user.role?.toUpperCase())) {
        await auditRepository.logAction({
          userId: req.user.id,
          action: 'PERMISSION_DENIED',
          resourceType: 'ROLE_CHECK',
          resourceId: req.user.role,
          metadata: {
            required_roles: allowedRoles,
            endpoint: req.originalUrl,
            method: req.method
          }
        });

        logger.warn(`Permission denied for user ${req.user.username} [${req.user.role}] accessing ${req.method} ${req.originalUrl}`);
        throw new AppError('Access forbidden: Insufficient role permissions for this operation.', 403, 'FORBIDDEN');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Permission-Based Access Control middleware
 * @param {string} permission Specific permission string
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHENTICATED');
      }

      if (!hasPermission(req.user.role, permission)) {
        await auditRepository.logAction({
          userId: req.user.id,
          action: 'PERMISSION_DENIED',
          resourceType: 'PERMISSION_CHECK',
          resourceId: permission,
          metadata: {
            user_role: req.user.role,
            required_permission: permission,
            endpoint: req.originalUrl
          }
        });

        logger.warn(`Permission '${permission}' denied for user ${req.user.username} [${req.user.role}]`);
        throw new AppError('Access forbidden: Insufficient permissions for this operation.', 403, 'FORBIDDEN');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Case-level access authorization middleware
 * Investigators may only access assigned cases; Admins and Supervisors have full access.
 */
const requireCaseAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHENTICATED');
    }

    const caseId = req.params.id || req.body?.case_id;
    if (!caseId) {
      return next();
    }

    // Admins and Supervisors can access all investigation cases
    if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.SUPERVISOR) {
      return next();
    }

    // Investigators must be assigned in case_members
    const hasAccess = await caseService.canUserAccessCase(req.user, caseId);
    if (!hasAccess) {
      await auditRepository.logAction({
        userId: req.user.id,
        caseId,
        action: 'PERMISSION_DENIED',
        resourceType: 'CASE_ACCESS',
        resourceId: caseId,
        metadata: {
          reason: 'UNASSIGNED_INVESTIGATOR',
          username: req.user.username,
          endpoint: req.originalUrl
        }
      });

      logger.warn(`Case access denied: User ${req.user.username} is not assigned to Case ${caseId}`);
      throw new AppError('Access denied: You do not have permission to access this investigation case.', 403, 'FORBIDDEN');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireAuth,
  requireRole,
  requirePermission,
  requireCaseAccess
};
