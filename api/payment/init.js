import axios from 'axios';

// Enable CORS
const setCorsHeaders = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { orderId, amount, email, phone, name, itemDetails } = req.body;

    // Validasi input
    if (!orderId || !amount || !email || !name) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: orderId, amount, email, name" 
      });
    }

    // Periksa server key
    if (!process.env.MIDTRANS_SERVER_KEY) {
      console.error("❌ MIDTRANS_SERVER_KEY tidak ditemukan!");
      return res.status(500).json({
        success: false,
        message: "Server configuration error: Missing MIDTRANS_SERVER_KEY"
      });
    }

    const parameter = {
      transaction_details: {
        order_id: `${orderId}`,
        gross_amount: parseInt(amount),
      },
      customer_details: {
        email: email,
        phone: phone || "08123456789",
        first_name: name,
      },
      item_details: itemDetails || [
        {
          id: "cv-export",
          price: parseInt(amount),
          quantity: 1,
          name: "CV Export & Print License",
        },
      ],
    };

    console.log("📝 Creating transaction:", orderId);

    // Buat base64 dari server key
    const serverKeyBase64 = Buffer.from(process.env.MIDTRANS_SERVER_KEY + ":").toString("base64");

    // Call Midtrans API langsung
    const response = await axios.post(
      "https://app.sandbox.midtrans.com/snap/v1/transactions",
      parameter,
      {
        headers: {
          "Authorization": `Basic ${serverKeyBase64}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      }
    );

    console.log("✅ Transaction created:", response.data.token);

    return res.status(200).json({
      success: true,
      token: response.data.token,
      redirect_url: response.data.redirect_url,
    });

  } catch (error) {
    console.error("❌ Error creating transaction:", error.message);
    console.error("Response:", error.response?.data);

    return res.status(500).json({ 
      success: false, 
      message: error.response?.data?.error_message || error.message || "Failed to create transaction",
    });
  }
}