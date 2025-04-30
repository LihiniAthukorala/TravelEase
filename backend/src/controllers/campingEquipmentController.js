import prisma from "../lib/prismaClient.js";

// Create camping equipment
export const createCampingEquipment = async (req, res) => {
  try {
    const { name, description, price, quantity, category, isAvailable } = req.body;
    const image = req.file;

    // Validation
    const errors = {};

    // Name validation
    if (!name || name.trim().length === 0) {
      errors.name = 'Name is required';
    } else if (name.length < 3) {
      errors.name = 'Name must be at least 3 characters';
    }

    // Description validation
    if (!description || description.trim().length === 0) {
      errors.description = 'Description is required';
    } else if (description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    // Price validation
    if (!price) {
      errors.price = 'Price is required';
    } else if (isNaN(price) || price <= 0) {
      errors.price = 'Price must be a positive number';
    } else if (price.toString().length > 6) {
      errors.price = 'Price cannot exceed 6 digits';
    }

    // Quantity validation
    if (!quantity) {
      errors.quantity = 'Quantity is required';
    } else if (isNaN(quantity) || quantity < 0) {
      errors.quantity = 'Quantity must be a non-negative number';
    }

    // Category validation
    if (!category) {
      errors.category = 'Category is required';
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // Create the equipment
    const equipment = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(quantity),
        image: image ? image.path : null,
        category,
        isAvailable: isAvailable === 'true' || isAvailable === true
      }
    });

    res.status(201).json(equipment);
  } catch (error) {
    console.error('Error creating camping equipment:', error);
    res.status(500).json({ error: 'Error creating camping equipment' });
  }
};

// Update camping equipment
export const updateCampingEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, quantity, category, isAvailable } = req.body;
    const image = req.file;

    // Validation
    const errors = {};

    // Name validation
    if (!name || name.trim().length === 0) {
      errors.name = 'Name is required';
    } else if (name.length < 3) {
      errors.name = 'Name must be at least 3 characters';
    }

    // Description validation
    if (!description || description.trim().length === 0) {
      errors.description = 'Description is required';
    } else if (description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    // Price validation
    if (!price) {
      errors.price = 'Price is required';
    } else if (isNaN(price) || price <= 0) {
      errors.price = 'Price must be a positive number';
    } else if (price.toString().length > 6) {
      errors.price = 'Price cannot exceed 6 digits';
    }

    // Quantity validation
    if (!quantity) {
      errors.quantity = 'Quantity is required';
    } else if (isNaN(quantity) || quantity < 0) {
      errors.quantity = 'Quantity must be a non-negative number';
    }

    // Category validation
    if (!category) {
      errors.category = 'Category is required';
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // Update the equipment
    const equipment = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(quantity),
        image: image ? image.path : undefined,
        category,
        isAvailable: isAvailable === 'true' || isAvailable === true
      }
    });

    res.json(equipment);
  } catch (error) {
    console.error('Error updating camping equipment:', error);
    res.status(500).json({ error: 'Error updating camping equipment' });
  }
};

// Get all camping equipment
export const getAllCampingEquipment = async (req, res) => {
  try {
    const equipment = await prisma.product.findMany();
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching camping equipment:', error);
    res.status(500).json({ error: 'Error fetching camping equipment' });
  }
};

// Get camping equipment by ID
export const getCampingEquipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const equipment = await prisma.product.findUnique({
      where: { id }
    });

    if (!equipment) {
      return res.status(404).json({ error: 'Camping equipment not found' });
    }

    res.json(equipment);
  } catch (error) {
    console.error('Error fetching camping equipment:', error);
    res.status(500).json({ error: 'Error fetching camping equipment' });
  }
};

// Delete camping equipment
export const deleteCampingEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if equipment exists
    const equipment = await prisma.product.findUnique({
      where: { id }
    });

    if (!equipment) {
      return res.status(404).json({ error: 'Camping equipment not found' });
    }

    // Delete the equipment
    await prisma.product.delete({
      where: { id }
    });

    res.json({ message: 'Camping equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting camping equipment:', error);
    res.status(500).json({ error: 'Error deleting camping equipment' });
  }
}; 