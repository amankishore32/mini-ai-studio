import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ENV } from "./config/constants";
import { routes } from "./routes";

/**
 *    Load .env file.
 *    If not present throw error and exit the process.
 */
if (dotenv.config()?.error) {
  throw new Error("Couldn't load .env file 🚨");
}

const app: Application = express();

//  Middleware to parse JSON bodies
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    credentials: true,
  })
);

//  Registering all routes with API prefix
app.use(`${ENV.API}`, routes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server is online on http://localhost:${PORT}`);
});
