import express from "express";
import cors from "cors";
import { correlationId } from "./middleware/correlationId.js";
import { errorHandler } from "./middleware/errorHandler.js";
import floorplanRouter from "./routes/floorplan.js";
import projectsRouter from "./routes/projects.js";
import clientsRouter from "./routes/clients.js";
import tradesRouter from "./routes/trades.js";
import settingsRouter from "./routes/settings.js";
import purchaseOrdersRouter from "./routes/purchaseOrders.js";
import workOrdersRouter from "./routes/workOrders.js";

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "20mb" }));
  app.use(correlationId);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Routes
  app.use("/api/floorplan", floorplanRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api/clients", clientsRouter);
  app.use("/api/trades", tradesRouter);
  app.use("/api/settings", settingsRouter);

  // Nested project routes — mergeParams ensures :projectId propagates to sub-routers
  app.use("/api/projects/:projectId/purchase-orders", purchaseOrdersRouter);
  app.use("/api/projects/:projectId/work-orders", workOrdersRouter);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
