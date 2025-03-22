import prisma from "../lib/prismaClient.js";

// Create a booking
export const createBooking = async (req, res) => {
  const { userId, packageId, travelDate, status } = req.body;

  try {
    // Ensure the travel package exists
    const travelPackage = await prisma.travelpackage.findUnique({
      where: { id: packageId },
    });

    if (!travelPackage) {
      return res.status(404).json({ error: "Travel package not found." });
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        packageId,
        travelDate,
        status,
      },
    });

    return res.status(201).json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    return res
      .status(500)
      .json({ error: "Something went wrong. Please try again." });
  }
};

// Get all bookings for a user
export const getUserBookings = async (req, res) => {
  const { userId } = req.params;

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        travelPackage: true, // Include travel package details
      },
    });

    if (!bookings || bookings.length === 0) {
      return res
        .status(404)
        .json({ error: "No bookings found for this user." });
    }

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res
      .status(500)
      .json({ error: "Something went wrong. Please try again." });
  }
};

// Get all bookings (admin or general use case)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        travelPackage: true,
        user: true,
      },
    });

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    return res
      .status(500)
      .json({ error: "Something went wrong. Please try again." });
  }
};

// Get bookings for a specific tour
export const getBookingsByTour = async (req, res) => {
  const { tourId } = req.params;

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        packageId: tourId
      },
      include: {
        user: true,
        travelPackage: true
      }
    });

    if (!bookings || bookings.length === 0) {
      return res.status(200).json([]); // Return empty array if no bookings found
    }

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching tour bookings:", error);
    return res.status(500).json({ 
      error: "Something went wrong while fetching tour bookings." 
    });
  }
};

export const deleteBooking = async (req, res) => {
  const { bookingId } = req.params;

  try {
    // Check if the booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    // Delete the booking
    await prisma.booking.delete({
      where: { id: bookingId },
    });

    return res.status(200).json({ message: "Booking deleted successfully." });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return res
      .status(500)
      .json({ error: "Something went wrong. Please try again." });
  }
};
