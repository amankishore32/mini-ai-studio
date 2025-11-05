import { Router } from "express";
import { ENV, ROUTES } from "../config/constants";

export const routes = Router();

//  Health Check Endpoint
routes.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timeStamp: new Date().toISOString(),
    message: "Server is up and running",
  });
});
