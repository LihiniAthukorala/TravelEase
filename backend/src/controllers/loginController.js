import prisma from "../lib/prismaClient.js";

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid password" });
    }
    return res
      .status(200)
      .json({ message: "Login successful", userId: user.id });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error logging in" });
  }
};
