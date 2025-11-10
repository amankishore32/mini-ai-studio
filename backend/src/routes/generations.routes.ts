import { Router } from "express";
import { createGeneration, listGenerations } from "../controllers/generations.controller";

export const generationsRoutes = Router();

// Mounted at `${ENV.API_VERSION_1}${ROUTES.GENERATIONS}` in routes/index.ts
generationsRoutes.post("/", createGeneration);
generationsRoutes.get("/", listGenerations);
