import { Router } from "express";
import { login, signUp } from "../controllers/auth.controller";

export const authRoutes = Router();

// Define your authentication routes here
authRoutes.post("/login", login);
authRoutes.post("/signup", signUp);
