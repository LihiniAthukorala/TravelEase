import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

router.post("/create", createProduct);
router.get("/", getAllProducts);
router.get("/:productId", getProductById);
router.put("/update/:productId", updateProduct);
router.post("/delete/:productId", deleteProduct);

export default router;
