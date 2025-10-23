import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createDocumentsService } from "./Documents.ts";
import { registerDocumentsRoutes } from "./Documents/Http.ts";
import { deduplicateRequests } from "./middleware/deduplication.ts";
import { loggingMiddleware } from "./middleware/logging.ts";
import { createSettingsService } from "./Settings.ts";
import { registerSettingsRoutes } from "./Settings/Http.ts";
import { createUsersService } from "./Users.ts";
import { registerUsersRoutes } from "./Users/Http.ts";

const app = express();

// Security headers middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);

// CORS middleware
const nodeEnv = process.env.NODE_ENV || "development";
const corsOrigin = nodeEnv === "development"
  ? [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://localhost:4173", // Added Vite preview port
  ]
  : process.env.CORS_ORIGIN?.split(",") || ["https://fidudoc.app"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigin.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// JSON parsing middleware
app.use(express.json());

// Deduplication middleware (must be before routes)
app.use(deduplicateRequests);

// Simple logging middleware
app.use(loggingMiddleware);

app.use("/health", (_req, res) => {
  res.send("OK");
});

app.use("/test", (_req, res) => {
  res.json({ message: "Test endpoint is working!" });
});

// ============================================================================
// Initialize Business Services
// ============================================================================
const settingsService = createSettingsService();
const documentsService = createDocumentsService();
const usersService = createUsersService();

// ============================================================================
// Register Routes - HTTP adapters for bounded contexts
// ============================================================================
registerSettingsRoutes(app, settingsService);
registerDocumentsRoutes(app, documentsService);
registerUsersRoutes(app, usersService);

const startServer = async () => {
  // Load Port and Host from environment variables
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const host = process.env.HOST || "localhost";

  console.log(`🚀 Starting server on ${host}:${port}...`);
  app.listen(port, host, (error) => {
    if (error) {
      console.error("Error starting server:", error);
      process.exit(1);
    }
    console.info(
      `backend listening on http://${host}:${port}`,
    );
    console.info(`Health check: http://${host}:${port}/health`);
  });
};

// Graceful shutdown
const gracefulShutdown = () => {
  console.log("🛑 Server is shutting down...");
  process.exit();
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
