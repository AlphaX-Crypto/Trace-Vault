const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const auditRepository = require('../repositories/auditRepository');
const ApiResponse = require('../utils/apiResponse');

const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const ip = req.ip || req.connection?.remoteAddress;
    const result = await authService.login(identifier, password, { ip });
    return ApiResponse.success(res, result, 200, { message: 'Authentication successful.' });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      authService.revokeToken(token);
    }

    if (req.user) {
      await auditRepository.logAction({
        userId: req.user.id,
        action: 'LOGOUT',
        resourceType: 'AUTH',
        resourceId: String(req.user.id),
        metadata: { username: req.user.username, ip: req.ip }
      });
    }
    return ApiResponse.success(res, { logged_out: true }, 200, { message: 'Signed out successfully.' });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const profile = await authService.getUserProfile(req.user.id);
    return ApiResponse.success(res, profile, 200);
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const users = await userRepository.getAllUsers();
    return ApiResponse.success(res, users, 200, { count: users.length });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getMe,
  listUsers
};
