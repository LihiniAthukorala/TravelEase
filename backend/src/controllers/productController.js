import prisma from "../lib/prismaClient.js";

// Create Product
export const createProduct = async (req, res) => {
  try {
    const { name, price, stock, image } = req.body;
    const product = await prisma.product.create({
      data: { name, price: parseInt(price), stock: parseInt(stock), image },
    });
    res.status(201).json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error creating product" });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error fetching products" });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Error fetching product" });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, price, stock } = req.body;
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { name, price, stock },
    });
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: "Error updating product" });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // First, delete related CartItems
    await prisma.cartItem.deleteMany({
      where: { productId: productId },
    });

    // Then, delete related RentalItems
    await prisma.rentalItem.deleteMany({
      where: { productId: productId },
    });

    // Finally, delete the product
    await prisma.product.delete({
      where: { id: productId },
    });

    res.json({ message: "Product and related items deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error deleting product" });
  }
};
