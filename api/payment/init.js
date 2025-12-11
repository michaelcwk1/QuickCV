import { snap } from "../midtrans";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const { orderId, amount, email, phone, name, itemDetails } = req.body;

    const parameter = {
      transaction_details: {
        order_id: `${orderId}-${Date.now()}`,
        gross_amount: parseInt(amount),
      },
      customer_details: {
        email,
        phone: phone || "",
        first_name: name,
      },
      item_details: itemDetails,
    };

    const transaction = await snap.createTransaction(parameter);

    return res.status(200).json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
