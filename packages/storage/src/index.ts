import express from "express";
import { loggingMiddleware } from "./middleware/logging.ts";

const app = express();

// JSON parsing middleware
app.use(express.json());

// Simple logging middleware
app.use(loggingMiddleware);

app.use("/health", (_req, res) => {
  res.send("OK");
});

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
