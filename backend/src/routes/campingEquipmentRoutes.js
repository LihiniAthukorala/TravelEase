import express from "express";
import {
  createCampingEquipment,
  getAllCampingEquipment,
  getCampingEquipmentById,
  updateCampingEquipment,
  deleteCampingEquipment,
} from "../controllers/campingEquipmentController.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Routes
router.post("/", upload.single('image'), createCampingEquipment);
router.get("/", getAllCampingEquipment);
router.get("/:id", getCampingEquipmentById);
router.put("/:id", upload.single('image'), updateCampingEquipment);
router.delete("/:id", deleteCampingEquipment);

export default router; 