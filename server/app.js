import express from "express";
import cors from "cors";
import { correlationId } from "./middleware/correlationId.js";
import { errorHandler } from "./middleware/errorHandler.js";
import floorplanRouter from "./routes/floorplan.js";
import estimateAssistantRouter from "./routes/estimateAssistant.js";
import projectsRouter from "./routes/projects.js";
import clientsRouter from "./routes/clients.js";
import tradesRouter from "./routes/trades.js";
import settingsRouter from "./routes/settings.js";
import purchaseOrdersRouter from "./routes/purchaseOrders.js";
import workOrdersRouter from "./routes/workOrders.js";
import authRouter from "./auth.js";
import { authenticate } from "./middleware/authenticate.js";
import { bxLimiter } from "./middleware/rateLimit.js";
// Unified v1 API routes
import v1ProjectsRouter from "./api/v1/projects.js";
import v1EstimatesRouter from "./api/v1/estimates.js";
import v1InvoicesRouter from "./api/v1/invoices.js";
import v1DocumentsRouter from "./api/v1/documents.js";
import v1ObservationsRouter from "./api/v1/observations.js";
import v1BillsRouter from "./api/v1/bills.js";

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

  // Public routes
  app.use("/api/floorplan", floorplanRouter);
  app.use("/api/estimate-assistant", estimateAssistantRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api/clients", clientsRouter);
  app.use("/api/trades", tradesRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api", authRouter);

  // Authenticated v1 API (rate-limited)
  app.use("/api/v1", bxLimiter, authenticate);
  app.use("/api/v1", v1ProjectsRouter);
  app.use("/api/v1", v1EstimatesRouter);
  app.use("/api/v1", v1InvoicesRouter);
  app.use("/api/v1", v1DocumentsRouter);
  app.use("/api/v1", v1ObservationsRouter);
  app.use("/api/v1", v1BillsRouter);

  // Nested project routes — mergeParams ensures :projectId propagates to sub-routers
  app.use("/api/projects/:projectId/purchase-orders", purchaseOrdersRouter);
  app.use("/api/projects/:projectId/work-orders", workOrdersRouter);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
