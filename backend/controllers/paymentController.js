const snap = require('../config/midtrans');
const crypto = require('crypto');

// Inisialisasi transaksi
exports.initPayment = async (req, res) => {
  try {
    const { orderId, amount, email, phone, name, itemDetails } = req.body;

    // Validasi input
    if (!orderId || !amount || !email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, amount, email, name'
      });
    }

    // Parameter untuk Midtrans
    const parameter = {
      transaction_details: {
        order_id: `${orderId}-${Date.now()}`, // Pastikan unik
        gross_amount: parseInt(amount) // Harus berupa integer
      },
      customer_details: {
        email: email,
        phone: phone || '',
        first_name: name,
        last_name: ''
      },
      item_details: itemDetails || [
        {
          id: orderId,
          price: parseInt(amount),
          quantity: 1,
          name: 'Service Payment'
        }
      ],
      // Jangan gunakan callbacks di snap.pay (untuk popup mode)
      // Callbacks hanya digunakan jika menggunakan redirect mode
      // Untuk popup mode, gunakan onSuccess/onError/onClose di frontend
    };

    console.log('Creating transaction with params:', JSON.stringify(parameter, null, 2));

    // Create transaction
    const transaction = await snap.createTransaction(parameter);
    
    console.log('Transaction created successfully:', transaction);

    res.status(200).json({
      success: true,
      message: 'Payment initialized successfully',
      token: transaction.token,
      redirect_url: transaction.redirect_url
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.message
    });
  }
};

// Handle webhook notification dari Midtrans
exports.handleNotification = async (req, res) => {
  try {
    const notification = req.body;
    
    // Verifikasi signature
    const signatureKey = notification.signature_key;
    const orderId = notification.order_id;
    const statusCode = notification.status_code;
    const grossAmount = notification.gross_amount;

    const hash = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${process.env.MIDTRANS_SERVER_KEY}`)
      .digest('hex');

    if (hash !== signatureKey) {
      return res.status(403).json({ success: false, message: 'Invalid signature' });
    }

    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    console.log(`Transaction notification: ${orderId} - Status: ${transactionStatus}`);

    // Handle berdasarkan status
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        // TODO: set transaction status on your database to 'challenge'
      } else if (fraudStatus === 'accept') {
        // TODO: set transaction status on your database to 'success'
      }
    } else if (transactionStatus === 'settlement') {
      // TODO: set transaction status on your database to 'success'
    } else if (transactionStatus === 'pending') {
      // TODO: set transaction status on your database to 'pending'
    } else if (transactionStatus === 'deny') {
      // TODO: set transaction status on your database to 'failed'
    } else if (transactionStatus === 'expire') {
      // TODO: set transaction status on your database to 'expired'
    } else if (transactionStatus === 'cancel') {
      // TODO: set transaction status on your database to 'cancelled'
    }

    res.status(200).json({ success: true, message: 'Notification handled' });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

// Get transaction status
exports.getTransactionStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const transaction = await snap.transaction.status(orderId);

    res.status(200).json({
      success: true,
      data: transaction
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction status',
      error: error.message
    });
  }
};

// Handle redirect dari Midtrans (jika ada)
exports.paymentCallback = async (req, res) => {
  try {
    const { order_id, status_code, transaction_status } = req.query;
    
    console.log('Payment callback received:', {
      order_id,
      status_code,
      transaction_status
    });

    // Cek status di Midtrans
    const transaction = await snap.transaction.status(order_id);
    
    // Redirect ke frontend dengan info payment
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}?payment_status=${transaction_status}&order_id=${order_id}`;
    
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?payment_status=error`);
  }
};