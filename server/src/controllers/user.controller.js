// server/src/controllers/user.controller.js
const { prisma } = require('../utils/prisma.util');

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

module.exports = {
  listUsers,
};
