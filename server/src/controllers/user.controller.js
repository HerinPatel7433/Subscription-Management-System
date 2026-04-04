// server/src/controllers/user.controller.js
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma.util');

const SALT_ROUNDS = 12;

function formatUser(user) {
  const { passwordHash, passwordResetToken, passwordResetExpiry, ...safe } = user;
  return safe;
}

/**
 * @route   GET /api/users
 * @desc    Get all users (admin and portal customers)
 * @access  Admin, Internal
 */
async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully.',
      data: users,
    });
  } catch (error) {
    console.error('listUsers error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}


// ─── POST /api/users ─────────────────────────────────────────────────────────

/**
 * @route   POST /api/users
 * @desc    Admin manually creates a user with explicit role
 * @access  Admin
 */
async function createUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: formatUser(user),
    });
  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = {
  listUsers,
  createUser,
};
