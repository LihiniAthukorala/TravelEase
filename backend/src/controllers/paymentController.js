import prisma from "../lib/prismaClient.js";

export const processPayment = async (req, res) => {
  try {
    const { method, cardDetails, receiptId, receiptUrl } = req.body;

    let payment;
    if (method === "card") {
      if (
        !cardDetails ||
        !cardDetails.name ||
        !cardDetails.number ||
        !cardDetails.expiry ||
        !cardDetails.cvv
      ) {
        return res.status(400).json({ error: "Incomplete card details" });
      }

      payment = await prisma.payment.create({
        data: {
          method: "card",
          cardName: cardDetails.name,
          cardNumber: cardDetails.number,
          cardExpiry: cardDetails.expiry,
          cardCVV: cardDetails.cvv,
          status: "success", // In real-world applications, integrate with a payment gateway
        },
      });
    } else if (method === "cash_on_delivery") {
      payment = await prisma.payment.create({
        data: {
          method: "cash_on_delivery",
          cardName: "",
          cardNumber: "",
          cardExpiry: "",
          cardCVV: "",
          status: "success", // In real-world applications, integrate with a payment gateway
        },
      });
    } else {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    res.status(201).json(payment);
  } catch (error) {
    console.error("Payment processing error:", error);
    res
      .status(500)
      .json({ error: "Error processing payment: " + error.message });
  }
};
