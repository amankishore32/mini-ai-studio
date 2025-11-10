import { Response } from "express";
import { z } from "zod";
import { PrismaClient, Generation } from "@prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";

const prisma = new PrismaClient();

const createSchema = z.object({
  prompt: z.string().min(1),
  style: z.string().optional(),
  imageUpload: z.string().optional(),
});

export const createGeneration = async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const { prompt, style, imageUpload } = parsed.data;
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  // TODO: Move Business Logic to Service Layer
  try {
    const gen = await prisma.generation.create({
      data: { prompt, style, status: "PENDING", userId },
    });

    // Simulate 1-2s delay
    const delay = 1000 + Math.floor(Math.random() * 1000);
    await new Promise((r) => setTimeout(r, delay));

    // 20% overloaded
    if (Math.random() < 0.2) {
      await prisma.generation.update({
        where: { id: gen.id },
        data: { status: "FAILED" },
      });
      return res.status(503).json({ message: "Model overloaded" });
    }

    const imageUrl = imageUpload || `https://picsum.photos/seed/${gen.id}/512`;
    const updated = await prisma.generation.update({
      where: { id: gen.id },
      data: { status: "COMPLETED", imageUrl },
    });

    return res.status(201).json({
      id: updated.id,
      imageUrl: updated.imageUrl,
      prompt: updated.prompt,
      style: updated.style,
      createdAt: updated.createdAt,
      status: updated.status,
    });
  } catch {
    // Error is logged by Prisma
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listGenerations = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  // TODO: Move Business Logic to Service Layer
  const limitParam = (req.query.limit as string) || "5";
  const limit = Math.min(Math.max(parseInt(limitParam, 10) || 5, 1), 50);
  try {
    const gens = await prisma.generation.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return res.status(200).json(
      gens.map((g: Generation) => ({
        id: g.id,
        imageUrl: g.imageUrl,
        prompt: g.prompt,
        style: g.style ?? null,
        createdAt: g.createdAt,
        status: g.status,
      }))
    );
  } catch {
    // Error is logged by Prisma
    return res.status(500).json({ message: "Internal server error" });
  }
};
