import express from 'express';
import cors from 'cors';
import campingEquipmentRoutes from "./routes/campingEquipmentRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/camping-equipment", campingEquipmentRoutes);
app.use("/api/suppliers", supplierRoutes);

export default app; 