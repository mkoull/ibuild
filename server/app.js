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
import authRouter from "./auth.js";
import { authenticate } from "./middleware/authenticate.js";
import { bxLimiter, pcLimiter } from "./middleware/rateLimit.js";
import buildxactProjectsRouter from "./api/buildxact/projects.js";
import buildxactEstimatesRouter from "./api/buildxact/estimates.js";
import buildxactInvoicesRouter from "./api/buildxact/invoices.js";
import buildxactDocumentsRouter from "./api/buildxact/documents.js";
import procoreProjectsRouter from "./api/procore/projects.js";
import procoreObservationsRouter from "./api/procore/observations.js";
import procoreInvoicesRouter from "./api/procore/invoices.js";
import procoreBillsRouter from "./api/procore/bills.js";

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
  app.use("/api", authRouter);
  app.use("/api/buildxact", bxLimiter, authenticate);
  app.use("/api/procore", pcLimiter, authenticate);
  app.use("/api/buildxact", buildxactProjectsRouter);
  app.use("/api/buildxact", buildxactEstimatesRouter);
  app.use("/api/buildxact", buildxactInvoicesRouter);
  app.use("/api/buildxact", buildxactDocumentsRouter);
  app.use("/api/procore", procoreProjectsRouter);
  app.use("/api/procore", procoreObservationsRouter);
  app.use("/api/procore", procoreInvoicesRouter);
  app.use("/api/procore", procoreBillsRouter);

  // Nested project routes — mergeParams ensures :projectId propagates to sub-routers
  app.use("/api/projects/:projectId/purchase-orders", purchaseOrdersRouter);
  app.use("/api/projects/:projectId/work-orders", workOrdersRouter);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
