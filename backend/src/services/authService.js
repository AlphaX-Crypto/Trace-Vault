const crypto = require('crypto');
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

// In-memory token revocation registry: identifier (jti or token) -> expiryTimestampMs
const revokedTokens = new Map();

/**
 * Prunes expired tokens from the revocation blocklist
 */
function pruneRevokedTokens() {
  const now = Date.now();
  for (const [id, expTime] of revokedTokens.entries()) {
    if (expTime <= now) {
      revokedTokens.delete(id);
    }
  }
}

class AuthService {
  /**
   * Registers a token as revoked upon logout
   * @param {string} token
   */
  revokeToken(token) {
    if (!token || typeof token !== 'string') return;
    try {
      const decoded = jwt.decode(token);
      const expTime = decoded?.exp ? decoded.exp * 1000 : Date.now() + (2 * 60 * 60 * 1000);
      if (decoded?.jti) {
        revokedTokens.set(decoded.jti, expTime);
      }
      revokedTokens.set(token, expTime);
      pruneRevokedTokens();
    } catch (_) {
      revokedTokens.set(token, Date.now() + (2 * 60 * 60 * 1000));
    }
  }

  /**
   * Checks whether a token or jti has been revoked
   * @param {string} id Token string or jti
   * @returns {boolean}
   */
  isTokenRevoked(id) {
    if (!id) return false;
    return revokedTokens.has(id);
  }

  /**
   * Clears the revocation list (test helper)
   */
  clearRevokedTokens() {
    revokedTokens.clear();
  }

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
   * Generates a signed, verifiable JSON Web Token with unique jti claim
   * @param {Object} user
   * @returns {string} Signed JWT
   */
  generateToken(user) {
    const payload = {
      jti: crypto.randomUUID(),
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
   * Verifies and decodes a signed JWT, validating signature, expiry, and revocation status
   * @param {string} token
   * @returns {Object} Decoded payload
   */
  verifyToken(token) {
    if (this.isTokenRevoked(token)) {
      throw new AppError('Token has been revoked. Please log in again.', 401, 'TOKEN_REVOKED');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Session expired. Please log in again.', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN');
    }

    if (decoded.jti && this.isTokenRevoked(decoded.jti)) {
      throw new AppError('Token has been revoked. Please log in again.', 401, 'TOKEN_REVOKED');
    }

    return decoded;
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
        action: 'LOGIN_FAILED',
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
        action: 'LOGIN_FAILED',
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
