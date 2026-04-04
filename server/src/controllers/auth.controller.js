// server/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma.util');
const { signToken } = require('../utils/jwt.util');
const { sendPasswordResetEmail } = require('../utils/email.util');

const SALT_ROUNDS = 12;

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Formats a User row for API responses (strips passwordHash and reset token fields).
 */
function formatUser(user) {
  const { passwordHash, passwordResetToken, passwordResetExpiry, ...safe } = user;
  return safe;
}

/**
 * Validates password strength:
 *  - Minimum 8 characters
 *  - At least one uppercase letter
 *  - At least one lowercase letter
 *  - At least one special character
 */
function validatePasswordStrength(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return 'Password must contain at least one special character.';
  }
  return null; // null = valid
}

// ─── POST /api/auth/signup ────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user (role defaults to 'portal')
 * @access  Public
 *
 * Body: { name, email, password }
 * Returns: { success, token, user }
 */
async function signup(req, res) {
  // express-validator errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password } = req.body;

  // Manual password strength check (belt-and-suspenders)
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return res.status(422).json({ success: false, message: passwordError });
  }

  try {
    // Check for existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'portal', // default role for self-signup
      },
    });

    // Sign JWT
    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT
 * @access  Public
 *
 * Body: { email, password }
 * Returns: { success, token, user }
 */
async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Find user (including soft-deleted guard)
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.deletedAt) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Sign JWT — payload: { id, email, role }
    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/auth/reset-password/request ───────────────────────────────────

/**
 * @route   POST /api/auth/reset-password/request
 * @desc    Generate a reset token and send password-reset email
 * @access  Public
 *
 * Body: { email }
 * Returns: { success, message }  (always 200 to prevent email enumeration)
 */
async function requestPasswordReset(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email } = req.body;

  // Always respond 200 regardless of whether the email exists (prevent enumeration)
  const genericResponse = {
    success: true,
    message: 'If that email is registered, a reset link has been sent.',
  };

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.deletedAt) {
      return res.status(200).json(genericResponse);
    }

    // Generate plain-text token (sent in email) and hashed token (stored in DB)
    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: expiry,
      },
    });

    // Send email (fire-and-forget style — errors logged but don't crash the request)
    try {
      await sendPasswordResetEmail(user.email, plainToken);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Still respond with generic message — don't leak email send failure
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/auth/reset-password/confirm ───────────────────────────────────

/**
 * @route   POST /api/auth/reset-password/confirm
 * @desc    Validate reset token and update password
 * @access  Public
 *
 * Body: { token, password }
 * Returns: { success, message }
 */
async function confirmPasswordReset(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { token, password } = req.body;

  // Check password strength
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return res.status(422).json({ success: false, message: passwordError });
  }

  try {
    // Hash the incoming plain token to compare against stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: { gt: new Date() }, // token not expired
        deletedAt: null,
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is invalid or has expired.',
      });
    }

    // Hash new password and clear the reset token
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = {
  signup,
  login,
  requestPasswordReset,
  confirmPasswordReset,
};
