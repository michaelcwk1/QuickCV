const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// POST: Inisialisasi pembayaran (untuk guest/download)
router.post('/init', paymentController.initPayment);

// POST: Handle webhook dari Midtrans
router.post('/notification', paymentController.handleNotification);

// GET: Cek status transaksi
router.get('/status/:orderId', paymentController.getTransactionStatus);

// GET: Handle callback dari Midtrans (optional redirect)
router.get('/callback', paymentController.paymentCallback);

module.exports = router;