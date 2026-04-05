// server/src/routes/razorpay.routes.js
const { Router } = require('express');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const { createOrder, verifyPayment } = require('../controllers/razorpay.controller');

const router = Router();

// Create a Razorpay order for an invoice
router.post('/create-order', verifyToken, checkRole('admin', 'internal'), createOrder);

// Verify payment signature and record payment
router.post('/verify', verifyToken, checkRole('admin', 'internal'), verifyPayment);

module.exports = router;
