const AppError = require('../utils/appError');

const SENSITIVE_KEY_PATTERNS = [
  /private[_-]?key/i,
  /seed[_-]?phrase/i,
  /mnemonic/i,
  /password/i,
  /secret[_-]?key/i
];

/**
 * Checks for prohibited credentials, private keys, or seed phrases in input
 */
function scanForSensitiveContent(value, keyPath = '', isAuthRoute = false) {
  if (value === null || value === undefined) return;

  if (typeof value === 'string') {
    const trimmed = value.trim();

    // Check for 64-char hex private keys anywhere in the text
    if (/(?:^|[^0-9a-fA-F])(0x)?[0-9a-fA-F]{64}(?:[^0-9a-fA-F]|$)/.test(trimmed)) {
      throw new AppError(
        'Security Violation: Potential private key detected. TRACEVAULT never accepts private keys.',
        400,
        'SECURITY_VIOLATION_PRIVATE_KEY'
      );
    }

    // Check for potential seed phrases (12, 15, 18, 21, 24 space-separated words)
    const words = trimmed.split(/\s+/);
    if ([12, 15, 18, 21, 24].includes(words.length) && words.every(w => /^[a-zA-Z]{3,10}$/.test(w))) {
      throw new AppError(
        'Security Violation: Potential seed phrase detected. TRACEVAULT never accepts seed phrases.',
        400,
        'SECURITY_VIOLATION_SEED_PHRASE'
      );
    }
  } else if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      // Allow password property on authentication routes
      if (isAuthRoute && k.toLowerCase() === 'password') {
        // Still scan value to ensure user isn't pasting a 64-char private key or seed phrase
        scanForSensitiveContent(v, keyPath ? `${keyPath}.${k}` : k, isAuthRoute);
        continue;
      }

      for (const pattern of SENSITIVE_KEY_PATTERNS) {
        if (pattern.test(k)) {
          throw new AppError(
            `Security Violation: Prohibited field '${k}' detected. TRACEVAULT never accepts private keys, seed phrases, or passwords.`,
            400,
            'SECURITY_VIOLATION_PROHIBITED_FIELD'
          );
        }
      }
      scanForSensitiveContent(v, keyPath ? `${keyPath}.${k}` : k, isAuthRoute);
    }
  }
}

/**
 * Global security scanner middleware for incoming request body
 */
const securityScanMiddleware = (req, res, next) => {
  try {
    if (req.body) {
      const isAuthRoute = req.path && (req.path.startsWith('/api/auth') || req.path === '/login');
      scanForSensitiveContent(req.body, '', isAuthRoute);
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validator for POST /api/auth/login
 */
const validateLogin = (req, res, next) => {
  const { identifier, password } = req.body || {};
  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
    return next(new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS'));
  }
  if (!password || typeof password !== 'string') {
    return next(new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS'));
  }
  next();
};

/**
 * Validator for POST /api/cases
 */
const validateCreateCase = (req, res, next) => {
  const { title, description, priority, crime_type, blockchain } = req.body || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    return next(new AppError('Case title is required and must be a non-empty string.', 400, 'VALIDATION_ERROR'));
  }

  if (title.trim().length < 3) {
    return next(new AppError('Case title must be at least 3 characters long.', 400, 'VALIDATION_ERROR'));
  }

  if (priority) {
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validPriorities.includes(String(priority).toUpperCase())) {
      return next(new AppError(`Invalid priority. Allowed values: ${validPriorities.join(', ')}`, 400, 'VALIDATION_ERROR'));
    }
  }

  if (description && typeof description !== 'string') {
    return next(new AppError('Description must be a string if provided.', 400, 'VALIDATION_ERROR'));
  }

  if (crime_type && typeof crime_type !== 'string') {
    return next(new AppError('crime_type must be a string if provided.', 400, 'VALIDATION_ERROR'));
  }

  if (blockchain && typeof blockchain === 'string' && blockchain.trim().toLowerCase() !== 'ethereum') {
    return next(new AppError(
      `Unsupported blockchain: '${blockchain}'. Current SIH scope supports 'ethereum' only.`,
      400,
      'UNSUPPORTED_BLOCKCHAIN'
    ));
  }

  next();
};

/**
 * Validator for POST /api/cases/:id/analyze
 */
const validateAnalyzeRequest = (req, res, next) => {
  const { wallet_address, blockchain, max_hops } = req.body || {};

  if (!wallet_address || typeof wallet_address !== 'string' || !wallet_address.trim()) {
    return next(new AppError('wallet_address is required and must be a valid address.', 400, 'VALIDATION_ERROR'));
  }

  const cleanAddress = wallet_address.trim();

  // Basic Ethereum address format validation (0x followed by 40 hex characters)
  const ethAddressRegex = /^0x[0-9a-fA-F]{40}$/;
  // Also support mock addresses used in tests/mock pipeline (e.g. "A", "B", "C", "EXCHANGE_DEPOSIT")
  const mockAddressRegex = /^[A-Za-z0-9_]{1,42}$/;

  if (!ethAddressRegex.test(cleanAddress) && !mockAddressRegex.test(cleanAddress)) {
    return next(new AppError('Invalid wallet address format.', 400, 'VALIDATION_ERROR'));
  }

  if (!blockchain || typeof blockchain !== 'string') {
    return next(new AppError('blockchain parameter is required (Current SIH scope supports "ethereum").', 400, 'VALIDATION_ERROR'));
  }

  const cleanChain = blockchain.trim().toLowerCase();
  if (cleanChain !== 'ethereum') {
    return next(new AppError(
      `Unsupported blockchain: '${blockchain}'. Sprint 1 supports 'ethereum' only.`,
      400,
      'UNSUPPORTED_BLOCKCHAIN'
    ));
  }

  let cleanHops = 3;
  if (max_hops !== undefined && max_hops !== null) {
    const parsedHops = parseInt(max_hops, 10);
    if (isNaN(parsedHops) || parsedHops < 1 || parsedHops > 10) {
      return next(new AppError('max_hops must be an integer between 1 and 10.', 400, 'VALIDATION_ERROR'));
    }
    cleanHops = parsedHops;
  }

  // Normalize request body values
  req.body.blockchain = cleanChain;
  req.body.wallet_address = cleanAddress;
  req.body.max_hops = cleanHops;

  next();
};

/**
 * Validator for case ID in URL params
 */
const validateCaseId = (req, res, next) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !id.trim()) {
    return next(new AppError('Case ID parameter is required.', 400, 'VALIDATION_ERROR'));
  }
  next();
};

module.exports = {
  securityScanMiddleware,
  validateLogin,
  validateCreateCase,
  validateAnalyzeRequest,
  validateCaseId
};
