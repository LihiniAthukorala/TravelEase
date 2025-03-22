import express from "express";
import {
  addToCart,
  getCartItems,
  removeCartItem,
  completeOrder,
  getAllCartItems,
  deleteCartItem,
} from "../controllers/cartController.js";

const router = express.Router();

router.post("/cart", addToCart);
router.get("/cart/:userId", getCartItems);
router.delete("/cart/:id", removeCartItem);
router.put("/cart/complete-order/:userId", completeOrder);
router.get("/getallitems", getAllCartItems);
router.post("/deleteitems/:id", deleteCartItem);

export default router;
