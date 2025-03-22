import prisma from "../lib/prismaClient.js";

export const checkoutRental = async (req, res) => {
  try {
    const { userId, productId, startDate, endDate, quantity } = req.body;

    const existingRental = await prisma.rentalItem.findFirst({
      where: {
        productId: productId,
        Rental: {
          AND: [
            { startDate: { lte: new Date(endDate) } },
            { endDate: { gte: new Date(startDate) } },
          ],
        },
      },
    });

    if (existingRental) {
      return res
        .status(400)
        .json({ error: "Product is already rented for this period" });
    }

    const rental = await prisma.rental.create({
      data: {
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        products: {
          create: {
            productId,
            quantity,
          },
        },
      },
      include: {
        products: true,
      },
    });

    res.status(201).json(rental);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error processing rental" });
  }
};

// Get all rentals (Admin)
export const getAllRentals = async (req, res) => {
  console.log("Fetching all rentals...");
  try {
    const rentals = await prisma.rental.findMany({
      // include: {
      //   User: true,
      //   products: {
      //     include: {
      //       Product: true,
      //     },
      //   },
      // },
    });
    res.status(200).json(rentals);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching rentals" });
  }
};

// Get rental by ID
export const getRentalById = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        User: true, // Corrected relation name
        products: {
          include: {
            Product: true, // Ensure nested product details are fetched
          },
        },
      },
    });

    if (!rental) {
      return res.status(404).json({ error: "Rental not found" });
    }

    res.json(rental);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching rental details" });
  }
};

// Get user rental history
export const getUserRentals = async (req, res) => {
  try {
    const { userId } = req.params;
    const rentals = await prisma.rental.findMany({
      where: { userId },
      include: {
        products: {
          include: {
            Product: true, // Fetch related product details
          },
        },
      },
    });

    res.json(rentals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching user rentals" });
  }
};

// Update rental dates
export const updateRentalDates = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const { startDate, endDate } = req.body;

    // Validate input dates
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    res.json({ message: "Rental dates updated", updatedRental });
  } catch (error) {
    console.error("Error updating rental:", error);
    res.status(500).json({ error: "Error updating rental" });
  }
};

// Delete rental (Cancel rental)
export const deleteRental = async (req, res) => {
  try {
    const { rentalId } = req.params;

    // Check if rental exists
    const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
    if (!rental) {
      return res.status(404).json({ error: "Rental not found" });
    }

    // Delete rental
    await prisma.rental.delete({ where: { id: rentalId } });

    res.json({ message: "Rental canceled successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error canceling rental" });
  }
};

// Apply late return penalty
export const applyLateReturnPenalty = async (req, res) => {
  try {
    const { rentalId } = req.params;

    // Check if the rental exists
    const rentalExists = await prisma.rental.findUnique({
      where: { id: rentalId },
    });
    if (!rentalExists) {
      return res.status(404).json({ error: "Rental not found" });
    }

    // Apply the penalty by updating status
    const rental = await prisma.rental.update({
      where: { id: rentalId },
      data: { status: "late" },
    });

    res.json({ message: "Penalty applied", rental });
  } catch (error) {
    console.error("Error applying penalty:", error);
    res.status(500).json({ error: "Error applying penalty" });
  }
};

// Rent items to a user
export const rentItemToUser = async (req, res) => {
  try {
    const { userId, productId, startDate, endDate, quantity } = req.body;
    console.log(req.body);
    // Validate input data
    if (!userId || !productId || !startDate || !endDate || !quantity) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the product is already rented for the requested period
    const existingRental = await prisma.rentalItem.findFirst({
      where: {
        productId: productId,
        Rental: {
          AND: [
            { startDate: { lte: new Date(endDate) } },
            { endDate: { gte: new Date(startDate) } },
          ],
        },
      },
    });

    if (existingRental) {
      return res.status(400).json({
        error: "This product is already rented during the selected period",
      });
    }

    // Create a new rental for the user
    const rental = await prisma.rental.create({
      data: {
        userId, // Linking user
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        products: {
          create: {
            productId, // Linking the rented product
            quantity,
          },
        },
      },
      include: {
        products: true,
      },
    });

    // Respond with the rental details
    res.status(201).json(rental);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error renting the item" });
  }
};
