export default async function handler(req, res) {
  const { order_id, transaction_status } = req.query;

  const redirectUrl = `${process.env.FRONTEND_URL}?payment_status=${transaction_status}&order_id=${order_id}`;
  
  return res.redirect(redirectUrl);
}
