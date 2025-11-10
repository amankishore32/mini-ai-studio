import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const PRISMA = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await PRISMA.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    //  If vaild data generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        updatedAt: user.updatedAt,
        token: token,
      },
    });
  } catch {
    // Error logged by Express error handler
    res.status(500).json({ message: "Internal server error" });
  }
};

export const signUp = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  try {
    //    Check existing user
    const existingUser = await PRISMA.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await PRISMA.user.create({
      data: { name, email, password: hashedPassword },
    });
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch {
    // Error logged by Express error handler
    res.status(500).json({ message: "Internal server error" });
  }
};
