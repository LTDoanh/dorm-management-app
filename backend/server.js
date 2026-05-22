import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import billsRouter from "./routes/bills.js";
import roomsRouter from "./routes/rooms.js";
import usersRouter from "./routes/users.js";
import buildingsRouter from "./routes/buildings.js";
import tenantsRouter from "./routes/tenants.js";
import paymentsRouter from "./routes/payments.js";
import notificationsRouter from "./routes/notifications.js";
import plateDetectionRouter from "./routes/plate-detection.js";
import { testConnection } from "./db.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "*", // Cho phép tất cả origin trong development
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get("/health", async (req, res) => {
  const dbStatus = await testConnection();
  res.status(dbStatus ? 200 : 503).json({
    status: dbStatus ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    database: dbStatus ? "connected" : "disconnected",
  });
});

// Config endpoint - trả về URL go2rtc từ biến môi trường
app.get("/api/config/go2rtc", (req, res) => {
  const go2rtcUrl = process.env.GO2RTC_URL;
  if (!go2rtcUrl) {
    return res.status(404).json({ error: "GO2RTC_URL chưa được cấu hình" });
  }
  res.json({ url: go2rtcUrl });
});

// API Routes
app.use("/api/bills", billsRouter);
app.use("/api/users", usersRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/buildings", buildingsRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/plate-detection", plateDetectionRouter);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Rental Management API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      users: "/api/users",
      buildings: "/api/buildings",
      rooms: "/api/rooms",
      tenants: "/api/tenants",
      bills: "/api/bills",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// Start server
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, async () => {
  console.log(`Server đang chạy ở http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

  // Test database connection
  await testConnection();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
