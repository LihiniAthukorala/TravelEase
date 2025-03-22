import prisma from "../lib/prismaClient.js";

export const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const user = await prisma.user.create({
      data: { firstName, lastName, email, password },
    });
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating user" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching users" });
  }
};

export const getUserById = async (req, res) => {
  console.log(req.params);
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
    });
    console.log(user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching user" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { firstName, lastName, email },
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating user" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.cart.deleteMany({
      where: { userId: id },
    });

    await prisma.rental.deleteMany({
      where: { userId: id },
    });

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting user" });
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { password },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating user password" });
  }
};

export const verifyUserPassword = async (req, res) => {
  const { password } = req.body;
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user || user.password !== password) {
    return res.status(400).json({ isValid: false });
  }

  res.json({ isValid: true });
};
