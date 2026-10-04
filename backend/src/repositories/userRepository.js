const db = require('../db/connection');

class UserRepository {
  /**
   * Retrieves a user by their numeric ID with role name
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async getUserById(id) {
    const sql = `
      SELECT u.id, u.username, u.email, u.password_hash, u.role_id, u.is_active,
             u.created_at, u.updated_at, u.last_login_at,
             r.name AS role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1;
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Retrieves a user by username or email with role name
   * @param {string} identifier (username or email)
   * @returns {Promise<Object|null>}
   */
  async getUserByUsernameOrEmail(identifier) {
    const clean = (identifier || '').trim().toLowerCase();
    const sql = `
      SELECT u.id, u.username, u.email, u.password_hash, u.role_id, u.is_active,
             u.created_at, u.updated_at, u.last_login_at,
             r.name AS role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE LOWER(u.username) = $1 OR LOWER(u.email) = $1;
    `;
    const result = await db.query(sql, [clean]);
    return result.rows[0] || null;
  }

  /**
   * Retrieves all users (excluding password hashes)
   * @returns {Promise<Array<Object>>}
   */
  async getAllUsers() {
    const sql = `
      SELECT u.id, u.username, u.email, u.role_id, u.is_active,
             u.created_at, u.updated_at, u.last_login_at,
             r.name AS role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id ASC;
    `;
    const result = await db.query(sql);
    return result.rows;
  }

  /**
   * Creates a new user record
   */
  async createUser({ username, email, password_hash, role_id, is_active = true }) {
    const sql = `
      INSERT INTO users (username, email, password_hash, role_id, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, role_id, is_active, created_at, updated_at;
    `;
    const result = await db.query(sql, [
      username.trim(),
      email.trim().toLowerCase(),
      password_hash,
      role_id,
      is_active
    ]);
    return result.rows[0];
  }

  /**
   * Updates last_login_at timestamp
   */
  async updateLastLogin(userId) {
    const sql = `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = $1;
    `;
    await db.query(sql, [userId]);
  }

  /**
   * Retrieves role by name
   */
  async getRoleByName(roleName) {
    const sql = `SELECT * FROM roles WHERE UPPER(name) = $1;`;
    const result = await db.query(sql, [roleName.toUpperCase()]);
    return result.rows[0] || null;
  }

  /**
   * Updates user role
   */
  async updateUserRole(userId, roleId) {
    const sql = `
      UPDATE users
      SET role_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, email, role_id, updated_at;
    `;
    const result = await db.query(sql, [roleId, userId]);
    return result.rows[0] || null;
  }

  /**
   * Updates user active status
   */
  async updateUserStatus(userId, isActive) {
    const sql = `
      UPDATE users
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, email, is_active, updated_at;
    `;
    const result = await db.query(sql, [isActive, userId]);
    return result.rows[0] || null;
  }
}

module.exports = new UserRepository();
