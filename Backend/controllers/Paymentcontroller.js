
import asyncHandler from 'express-async-handler';


export const createOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // ₹ → paise
    currency: 'INR',
    receipt: `rcpt_${Date.now()}`,
    payment_capture: 1,
  };

  const order = await razorpay.orders.create(options);
  res.json(order);
});
