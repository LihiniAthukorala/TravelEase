import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserPassword,
  verifyUserPassword,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/create", createUser);
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.post("/delete/:id", deleteUser);
router.put("/users/password/:id", updateUserPassword);
router.post("/users/verify-password/:id", verifyUserPassword);

export default router;
