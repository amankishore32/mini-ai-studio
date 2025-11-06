import { Router } from "express";
import { login, signUp } from "../controllers/auth.controller";
import {
  createGeneration,
  getGenerations,
} from "../controllers/generations.controller";

export const generationsRoutes = Router();

// Define your authentication routes here
generationsRoutes.post("/create", createGeneration);
generationsRoutes.get("/", getGenerations);
