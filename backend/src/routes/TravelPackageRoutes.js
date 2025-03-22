import express from "express";
import {
  createTravelPackage,
  getAllTravelPackages,
  getTravelPackageById,
  updateTravelPackage,
  deleteTravelPackage,
} from "../controllers/TravelPackageController.js";

const router = express.Router();

router.post("/create", createTravelPackage);
router.get("/", getAllTravelPackages);
router.get("/:packageId", getTravelPackageById);
router.put("/update/:packageId", updateTravelPackage);
router.post("/delete/:packageId", deleteTravelPackage);

export default router;
