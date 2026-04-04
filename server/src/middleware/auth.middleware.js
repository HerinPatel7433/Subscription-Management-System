// server/src/middleware/auth.middleware.js
const { verifyToken } = require('../utils/jwt.util');

/**
 * Middleware: verifyToken
 * Validates the JWT in the Authorization header.
 * Attaches { id, email, role } to req.user on success.
 *
 * @example Authorization: Bearer <token>
 */
function verifyTokenMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
}

/**
 * Middleware factory: checkRole
 * Returns a middleware that allows access only to users with one of the specified roles.
 * Must be used AFTER verifyTokenMiddleware.
 *
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'internal', 'portal')
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/users', verifyToken, checkRole('admin'), createUserController);
 */
function checkRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
}

module.exports = {
  verifyToken: verifyTokenMiddleware,
  checkRole,
};
