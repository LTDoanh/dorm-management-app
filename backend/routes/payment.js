import express from "express";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

router.post("/create-order", async (req, res) => {
  const { userId, amount } = req.body;

  const orderId = uuidv4();
  const description = `Thanh toán hóa đơn cho user ${userId}`;

  res.json({
    orderId,
    amount,
    description,
  });
});

export default router;
