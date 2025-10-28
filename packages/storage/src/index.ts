import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createDocumentsService } from "./Documents.ts";
import { registerDocumentsRoutes } from "./Documents/Http.ts";
import { authMiddleware } from "./middleware/auth.ts";
import { deduplicateRequests } from "./middleware/deduplication.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { loggingMiddleware } from "./middleware/logging.ts";
import { createRuntime } from "./Runtime.ts";
import { createSettingsService } from "./Settings.ts";
import { registerSettingsRoutes } from "./Settings/Http.ts";
import { createUsersService } from "./Users.ts";
import { registerUsersRoutes } from "./Users/Http.ts";

const app = express();

// ============================================================================
// Initialize Effect Runtime
// ============================================================================
const runtime = createRuntime();

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
  : process.env.CORS_ORIGIN?.split(",") || ["https://fidudoc.eu"];

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

// ============================================================================
// Public Routes (no authentication required)
// ============================================================================
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
// Protected Routes (authentication required)
// ============================================================================
const protectedRouter = express.Router();

// Apply authentication middleware to all protected routes
protectedRouter.use(authMiddleware(runtime));

// Register business routes on the protected router
registerSettingsRoutes(protectedRouter, settingsService);
registerDocumentsRoutes(protectedRouter, documentsService);
registerUsersRoutes(protectedRouter, usersService, runtime);

// Mount the protected router
app.use(protectedRouter);

// ============================================================================
// Error Handler Middleware - MUST be registered LAST
// ============================================================================
app.use(errorHandler);

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
      `${
        process.env.NODE_ENV || "development"
      } backend listening on http://${host}:${port}`,
    );
    console.info(`Health check: http://${host}:${port}/health`);
  });
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("🛑 Server is shutting down...");
  // Dispose of the Effect runtime (closes DB connections, etc.)
  await runtime.dispose();
  process.exit();
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
