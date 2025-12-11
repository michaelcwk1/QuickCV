import { snap } from "../midtrans";

export default async function handler(req, res) {
  const { orderId } = req.query;

  try {
    const status = await snap.transaction.status(orderId);
    return res.status(200).json({ success: true, data: status });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
