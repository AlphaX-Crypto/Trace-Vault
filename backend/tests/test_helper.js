const authService = require('../src/services/authService');

const SEED_USERS = {
  INVESTIGATOR: {
    id: 1,
    username: 'investigator',
    email: 'investigator@tracevault.local',
    role: 'INVESTIGATOR',
    password: 'Investigator@123'
  },
  SUPERVISOR: {
    id: 2,
    username: 'supervisor',
    email: 'supervisor@tracevault.local',
    role: 'SUPERVISOR',
    password: 'Supervisor@123'
  },
  ADMIN: {
    id: 3,
    username: 'admin',
    email: 'admin@tracevault.local',
    role: 'ADMIN',
    password: 'Admin@123'
  }
};

/**
 * Generates an authentication token for a specified role
 * @param {string} role 'INVESTIGATOR' | 'SUPERVISOR' | 'ADMIN'
 * @returns {string} JWT Token
 */
function getAuthToken(role = 'INVESTIGATOR') {
  const user = SEED_USERS[role.toUpperCase()] || {
    id: 999,
    username: 'test_user',
    email: 'test@tracevault.local',
    role: role.toUpperCase()
  };
  return authService.generateToken({
    id: user.id,
    username: user.username,
    email: user.email,
    role_name: user.role
  });
}

/**
 * Returns Authorization header object
 * @param {string} role
 * @returns {Object} { Authorization: 'Bearer ...' }
 */
function getAuthHeaders(role = 'INVESTIGATOR') {
  const token = getAuthToken(role);
  return {
    Authorization: `Bearer ${token}`
  };
}

module.exports = {
  SEED_USERS,
  getAuthToken,
  getAuthHeaders
};
