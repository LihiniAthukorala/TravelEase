import prisma from "../lib/prismaClient.js";

// Create supplier
export const createSupplier = async (req, res) => {
  try {
    const { name, email, phone, address, contactPerson, notes, products } = req.body;

    // Validation
    const errors = {};

    // Name validation
    if (!name || name.trim().length === 0) {
      errors.name = 'Name is required';
    } else if (name.length < 3) {
      errors.name = 'Name must be at least 3 characters';
    }

    // Email validation
    if (!email || email.trim().length === 0) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (phone && !/^[0-9+\-\s()]{10,15}$/.test(phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Address validation
    if (address && address.length < 5) {
      errors.address = 'Address must be at least 5 characters';
    }

    // Contact Person validation
    if (contactPerson && contactPerson.length < 3) {
      errors.contactPerson = 'Contact person name must be at least 3 characters';
    }

    // Products validation
    if (products && !Array.isArray(products)) {
      errors.products = 'Products must be an array';
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // Create the supplier
    const supplier = await prisma.supplier.create({
      data: {
        name,
        email,
        phone,
        address,
        contactPerson,
        notes,
        products: products || [],
        active: true
      }
    });

    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Error creating supplier' });
  }
};

// Update supplier
export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, contactPerson, notes, products, active } = req.body;

    // Validation
    const errors = {};

    // Name validation
    if (!name || name.trim().length === 0) {
      errors.name = 'Name is required';
    } else if (name.length < 3) {
      errors.name = 'Name must be at least 3 characters';
    }

    // Email validation
    if (!email || email.trim().length === 0) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (phone && !/^[0-9+\-\s()]{10,15}$/.test(phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Address validation
    if (address && address.length < 5) {
      errors.address = 'Address must be at least 5 characters';
    }

    // Contact Person validation
    if (contactPerson && contactPerson.length < 3) {
      errors.contactPerson = 'Contact person name must be at least 3 characters';
    }

    // Products validation
    if (products && !Array.isArray(products)) {
      errors.products = 'Products must be an array';
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // Update the supplier
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        address,
        contactPerson,
        notes,
        products: products || [],
        active: active !== undefined ? active : true
      }
    });

    res.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Error updating supplier' });
  }
};

// Get all suppliers
export const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany();
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Error fetching suppliers' });
  }
};

// Get supplier by ID
export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Error fetching supplier' });
  }
};

// Delete supplier
export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Delete the supplier
    await prisma.supplier.delete({
      where: { id }
    });

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Error deleting supplier' });
  }
}; 