// server/src/routes/user.routes.js
const { Router } = require('express');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const { prisma } = require('../utils/prisma.util');

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all non-deleted users (optionally filter by role)
 * @access  Admin, Internal
 * @query   ?role=portal  (optional)
 */
router.get('/', verifyToken, checkRole('admin', 'internal'), async (req, res) => {
  try {
    const { role } = req.query;

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(role && { role }),
      },
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
      data: users,
      message: 'Users retrieved successfully.',
    });
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
