import { Router } from "express";
import { ENV, ROUTES } from "../config/constants";
import { authRoutes } from "./auth.routes";
import { generationsRoutes } from "./generations.routes";
import { authenticateRequest } from "../middlewares/auth.middleware";

export const routes = Router();

routes.use(`${ENV.API_VERSION_1}${ROUTES.AUTH}`, authRoutes);
routes.use(`${ENV.API_VERSION_1}${ROUTES.GENERATIONS}`, authenticateRequest, generationsRoutes);

// routes.use(`/v1/auth`, authRoutes);

//  Health Check Endpoint
routes.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timeStamp: new Date().toISOString(),
    message: "Server is up and running",
  });
});
