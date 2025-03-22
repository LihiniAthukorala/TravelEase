import prisma from "../lib/prismaClient.js";

export const createTravelPackage = async (req, res) => {
  try {
    const { name, destination, price, duration, description, imageUrl } =
      req.body;
    const travelpackage = await prisma.travelpackage.create({
      data: {
        name,
        destination,
        price: parseFloat(price),
        duration: parseInt(duration),
        description,
        imageUrl,
      },
    });
    res.status(201).json(travelpackage);
  } catch (error) {
    console.error("Error in createTravelPackage:", error);
    res.status(500).json({ error: "Error creating travel package" });
  }
};

// Get all travel packages
export const getAllTravelPackages = async (req, res) => {
  try {
    const travelpackage = await prisma.travelpackage.findMany();
    res.json(travelpackage);
  } catch (error) {
    console.error("Error fetching travel packages:", error);
    res.status(500).json({ error: "Error fetching travel packages" });
  }
};

// Get travel package by ID
export const getTravelPackageById = async (req, res) => {
  try {
    const { packageId } = req.params;
    console.log("Fetching travel package with ID:", packageId);

    if (!packageId) {
      return res.status(400).json({ error: "Package ID is required" });
    }

    const travelPackage = await prisma.travelpackage.findUnique({
      where: { id: packageId },
    });

    if (!travelPackage) {
      return res.status(404).json({ error: "Travel package not found" });
    }

    res.json(travelPackage);
  } catch (error) {
    console.error("Error fetching travel package:", error);
    res.status(500).json({ error: "Error fetching travel package" });
  }
};

// Update travel package
export const updateTravelPackage = async (req, res) => {
  try {
    const { packageId } = req.params;
    const { name, destination, price, duration, description, imageUrl } =
      req.body;
    const updatedPackage = await prisma.travelpackage.update({
      where: { id: packageId },
      data: { name, destination, price, duration, description, imageUrl },
    });
    res.json(updatedPackage);
  } catch (error) {
    res.status(500).json({ error: "Error updating travel package" });
  }
};

// Delete travel package
export const deleteTravelPackage = async (req, res) => {
  try {
    const { packageId } = req.params;

    // First, delete related bookings
    await prisma.booking.deleteMany({
      where: { packageId: packageId },
    });

    // Then, delete the package
    await prisma.travelpackage.delete({
      where: { id: packageId },
    });

    res.json({
      message: "Travel package and related bookings deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting travel package" });
  }
};
