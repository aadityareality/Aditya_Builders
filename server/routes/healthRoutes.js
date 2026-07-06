import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// GET /api/health
router.get("/", (req, res) => {
  const dbState = mongoose.connection.readyState;
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const isConnected = dbState === 1;

  const statusInfo = {
    status: isConnected ? "ok" : "error",
    db: isConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  };

  if (isConnected) {
    res.status(200).json(statusInfo);
  } else {
    res.status(503).json(statusInfo);
  }
});

export default router;
