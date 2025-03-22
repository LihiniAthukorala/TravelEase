import prisma from "../lib/prismaClient.js";

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity, IsOrderProcessed } = req.body;
    let cart = await prisma.cart.findFirst({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId,
        IsOrderProcessed: IsOrderProcessed,
      },
    });

    if (existingCartItem) {
      const updatedCartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + quantity,
        },
      });
      return res.status(200).json(updatedCartItem);
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        IsOrderProcessed,
      },
    });

    res.status(201).json(cartItem);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error adding item to cart" });
  }
};

// Get cart items
export const getCartItems = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        products: {
          where: { IsOrderProcessed: true },
          include: {
            Product: true,
          },
        },
      },
    });

    console.log(cart);
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    res.json(cart.products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching cart" });
  }
};

// Remove item from cart
export const removeCartItem = async (req, res) => {
  try {
    const { id } = req.params;

    const cartItem = await prisma.cartItem.findUnique({ where: { id } });

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    if (cartItem.quantity > 1) {
      await prisma.cartItem.update({
        where: { id },
        data: { quantity: cartItem.quantity - 1 },
      });
      res.json({ message: "Item quantity reduced by 1" });
    } else {
      await prisma.cartItem.delete({ where: { id } });
      res.json({ message: "Item removed from cart" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error removing item from cart" });
  }
};

export const completeOrder = async (req, res) => {
  try {
    const { userId } = req.params; // Get user ID from request parameters

    // Find the cart for the user
    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        products: true, // Include cart items
      },
    });

    if (!cart || cart.products.length === 0) {
      return res.status(404).json({ error: "No items in the cart to process" });
    }

    // Update all cart items to mark them as processed
    await prisma.CartItem.updateMany({
      where: {
        cartId: cart.id,
        IsOrderProcessed: true,
      },
      data: {
        IsOrderProcessed: false,
      },
    });

    res.json({ message: "Order completed successfully" });
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({ error: "Error processing order" });
  }
};

export const getAllCartItems = async (req, res) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      include: {
        Product: true,
        Cart: {
          include: {
            User: true,
          },
        },
      },
    });

    const formattedCartItems = cartItems.map((item) => ({
      id: item.id,
      userId: item.Cart ? item.Cart.userId : null,
      productId: item.productId,
      quantity: item.quantity,
      productName: item.Product.name,
    }));

    res.json(formattedCartItems);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching cart items" });
  }
};

export const deleteCartItem = async (req, res) => {
  try {
    const { id } = req.params;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
    });

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    await prisma.cartItem.delete({
      where: { id },
    });

    res.json({ message: "Cart item deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error deleting cart item" });
  }
};
