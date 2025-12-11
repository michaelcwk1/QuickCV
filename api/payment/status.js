import axios from 'axios';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { orderId } = req.query;

  if (!orderId) {
    return res.status(400).json({ success: false, message: "Order ID required" });
  }

  try {
    if (!process.env.MIDTRANS_SERVER_KEY) {
      return res.status(500).json({ success: false, message: "Server configuration error" });
    }

    const serverKeyBase64 = Buffer.from(process.env.MIDTRANS_SERVER_KEY + ":").toString("base64");

    const response = await axios.get(
      `https://app.sandbox.midtrans.com/snap/v1/transactions/${orderId}/status`,
      {
        headers: {
          "Authorization": `Basic ${serverKeyBase64}`,
          "Accept": "application/json",
        },
      }
    );

    return res.status(200).json({ 
      success: true, 
      data: response.data 
    });

  } catch (error) {
    console.error("❌ Error checking status:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to check transaction status" 
    });
  }
}