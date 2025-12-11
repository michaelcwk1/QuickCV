import Midtrans from "../midtrans";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const midtrans = new Midtrans();
    const transaction = await midtrans.createTransaction(req.body);

    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
