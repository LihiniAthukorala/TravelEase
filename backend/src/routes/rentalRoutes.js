import express from "express";
import {
  checkoutRental,
  getAllRentals,
  getRentalById,
  getUserRentals,
  updateRentalDates,
  deleteRental,
  applyLateReturnPenalty,
  rentItemToUser,
} from "../controllers/rentalController.js";

const router = express.Router();

router.post("/checkout", checkoutRental);
router.get("/getallrentals", getAllRentals);
router.get("/:rentalId", getRentalById);
router.get("/user/:userId", getUserRentals);
router.post("/update/:rentalId", updateRentalDates);
router.post("/delete/:rentalId", deleteRental);
router.post("/penalty/:rentalId", applyLateReturnPenalty);
router.post("/addrental", rentItemToUser);

export default router;
