const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const userRepository = require('../repositories/userRepository');
const auditRepository = require('../repositories/auditRepository');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

const BCRYPT_ROUNDS = 10;
const JWT_ISSUER = 'tracevault-engine';
const JWT_AUDIENCE = 'tracevault-client';

class AuthService {
  /**
   * Hashes a plaintext password with bcrypt
   * @param {string} plaintext
   * @returns {Promise<string>}
   */
  async hashPassword(plaintext) {
    if (!plaintext || typeof plaintext !== 'string' || plaintext.length < 8) {
      throw new AppError('Password must be at least 8 characters long.', 400, 'WEAK_PASSWORD');
    }
    return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
  }

  /**
   * Compares plaintext password against bcrypt hash
   * @param {string} plaintext
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  async comparePassword(plaintext, hash) {
    if (!plaintext || !hash) return false;
    return bcrypt.compare(plaintext, hash);
  }

  /**
   * Generates a signed, verifiable JSON Web Token
   * @param {Object} user
   * @returns {string} Signed JWT
   */
  generateToken(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role_name || user.role || 'INVESTIGATOR'
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });
  }

  /**
   * Verifies and decodes a signed JWT
   * @param {string} token
   * @returns {Object} Decoded payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Session expired. Please log in again.', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN');
    }
  }

  /**
   * Authenticates user credentials
   * @param {string} identifier (username or email)
   * @param {string} password
   * @param {Object} [meta] Request metadata for audit logging
   * @returns {Promise<Object>} { token, user }
   */
  async login(identifier, password, meta = {}) {
    if (!identifier || !password) {
      throw new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
    }

    const user = await userRepository.getUserByUsernameOrEmail(identifier);

    if (!user) {
      await auditRepository.logAction({
        action: 'LOGIN_FAILURE',
        resourceType: 'AUTH',
        resourceId: identifier,
        metadata: { reason: 'USER_NOT_FOUND', ip: meta.ip }
      });
      // Generic error response - do not reveal user existence
      throw new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await this.comparePassword(password, user.password_hash);
    if (!isMatch) {
      await auditRepository.logAction({
        userId: user.id,
        action: 'LOGIN_FAILURE',
        resourceType: 'AUTH',
        resourceId: String(user.id),
        metadata: { reason: 'BAD_PASSWORD', ip: meta.ip }
      });
      // Generic error response
      throw new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      await auditRepository.logAction({
        userId: user.id,
        action: 'LOGIN_BLOCKED',
        resourceType: 'AUTH',
        resourceId: String(user.id),
        metadata: { reason: 'ACCOUNT_INACTIVE', ip: meta.ip }
      });
      throw new AppError('Account is inactive. Contact system administrator.', 403, 'ACCOUNT_INACTIVE');
    }

    // Update last login timestamp
    await userRepository.updateLastLogin(user.id);

    const token = this.generateToken(user);

    await auditRepository.logAction({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resourceType: 'AUTH',
      resourceId: String(user.id),
      metadata: { username: user.username, role: user.role_name, ip: meta.ip }
    });

    logger.info(`User authenticated: ${user.username} [${user.role_name}]`);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role_name,
        is_active: user.is_active,
        last_login_at: new Date().toISOString()
      }
    };
  }

  /**
   * Retrieves clean profile for authenticated user
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  async getUserProfile(userId) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new AppError('User account not found.', 404, 'USER_NOT_FOUND');
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role_name,
      is_active: user.is_active,
      created_at: user.created_at,
      last_login_at: user.last_login_at
    };
  }
}

module.exports = new AuthService();
