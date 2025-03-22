import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cartRoutes from "./src/routes/cartRoutes.js";
import rentalRoutes from "./src/routes/rentalRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import userRoutes from "./src/routes/userRoute.js";
import loginRoutes from "./src/routes/loginRoutes.js";
import travelPackageRoutes from "./src/routes/TravelPackageRoutes.js";
import paymentRoutes from "./src/routes/paymentsRouts.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", loginRoutes);
app.use("/api/travel-packages",travelPackageRoutes);
app.use("/api/payments", paymentRoutes);
app.use('/api/booking', bookingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
