import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // E-Sched Connect uses Firebase Firestore for all data operations
  // All API interactions are handled directly through Firebase SDK
  // on the frontend and admin SDK on the backend (if needed)
  
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "E-Sched Connect API is running" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
