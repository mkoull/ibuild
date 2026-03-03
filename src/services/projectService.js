/**
 * Project Service — extracts business logic from pages into testable functions.
 * Each function takes a scoped `up(fn)` updater (from ProjectContext) that
 * applies a mutator function to the current project.
 */

import { uid, ds } from "../theme/styles.js";
import { canTransition } from "../lib/stateMachines.js";
import { createVariationBudgetLine, createVariationLedgerEntry } from "../lib/budgetEngine.js";

// ── Variations ──────────────────────────────────────────────────────────────

/**
 * Create a new variation on a project.
 * @param {Function} up - Scoped updater: up(pr => { mutate pr })
 * @param {{ title: string, description?: string, amount: number }} data
 */
export function createVariation(up, data) {
  up(pr => {
    if (!Array.isArray(pr.variations)) pr.variations = [];
    pr.variations.push({
      id: `VO-${uid()}`,
      title: data.title || "",
      desc: data.title || "",
      description: data.description || "",
      amount: data.amount || 0,
      status: "draft",
      createdAt: ds(),
      lineItems: [],
    });
    return pr;
  });
}

/**
 * Approve a variation and feed through to budget.
 * @param {Function} up
 * @param {number} variationIndex
 */
export function approveVariation(up, variationIndex) {
  up(pr => {
    const v = pr.variations[variationIndex];
    if (!v) return pr;
    if (!canTransition("variation", v.status, "approved")) return pr;

    v.status = "approved";
    v.approvedAt = ds();

    // Feed-through: create budget line + ledger entry
    if (!Array.isArray(pr.budget)) pr.budget = [];
    if (!Array.isArray(pr.variationLedger)) pr.variationLedger = [];
    const alreadyLinked = pr.budget.some(b => b.linkedVariationId === v.id);
    if (!alreadyLinked) {
      const budgetLine = createVariationBudgetLine(v, pr.marginPct);
      pr.budget.push(budgetLine);
      pr.variationLedger.push(createVariationLedgerEntry(v, budgetLine.id));
    }
    return pr;
  });
}

/**
 * Advance a variation's status.
 * @param {Function} up
 * @param {number} variationIndex
 * @param {string} newStatus
 */
export function advanceVariationStatus(up, variationIndex, newStatus) {
  up(pr => {
    const v = pr.variations[variationIndex];
    if (!v) return pr;
    if (newStatus === "approved") {
      // Delegate to approveVariation for budget feed-through
      return pr;
    }
    if (!canTransition("variation", v.status, newStatus)) return pr;
    v.status = newStatus;
    return pr;
  });
}

// ── Purchase Orders ─────────────────────────────────────────────────────────

/**
 * Create a new purchase order.
 * @param {Function} up
 * @param {Object} data
 */
export function createPurchaseOrder(up, data) {
  up(pr => {
    if (!Array.isArray(pr.purchaseOrders)) pr.purchaseOrders = [];
    pr.purchaseOrders.push({
      id: uid(),
      tradeId: data.tradeId || "",
      items: data.items || [],
      status: "draft",
      totalAmount: data.totalAmount || 0,
      issueDate: data.issueDate || new Date().toISOString().split("T")[0],
      expectedDelivery: data.expectedDelivery || "",
      linkedBudgetLineId: data.linkedBudgetLineId || null,
      notes: data.notes || "",
    });
    return pr;
  });
}

/**
 * Advance a PO's status and create commitment on accept.
 * @param {Function} up
 * @param {number} poIndex
 * @param {string} newStatus
 */
export function advancePOStatus(up, poIndex, newStatus) {
  up(pr => {
    const po = pr.purchaseOrders[poIndex];
    if (!po) return pr;
    if (!canTransition("purchaseOrder", po.status, newStatus)) return pr;
    po.status = newStatus;

    if (newStatus === "accepted") {
      if (!Array.isArray(pr.commitments)) pr.commitments = [];
      pr.commitments.push({
        id: uid(),
        tradeId: po.tradeId,
        description: `PO ${po.id}`,
        vendorName: "",
        amount: po.totalAmount,
        status: "Committed",
        date: ds(),
        linkedBudgetLineId: po.linkedBudgetLineId,
      });
    }
    return pr;
  });
}

// ── Work Orders ─────────────────────────────────────────────────────────────

/**
 * Create a new work order.
 * @param {Function} up
 * @param {Object} data
 */
export function createWorkOrder(up, data) {
  up(pr => {
    if (!Array.isArray(pr.workOrders)) pr.workOrders = [];
    pr.workOrders.push({
      id: uid(),
      tradeId: data.tradeId || "",
      description: data.description || "",
      scheduledDate: data.scheduledDate || "",
      completedDate: "",
      status: "draft",
      amount: data.amount || 0,
      milestoneId: data.milestoneId || "",
      notes: data.notes || "",
    });
    return pr;
  });
}

/**
 * Advance a WO's status.
 * @param {Function} up
 * @param {number} woIndex
 * @param {string} newStatus
 */
export function advanceWOStatus(up, woIndex, newStatus) {
  up(pr => {
    const wo = pr.workOrders[woIndex];
    if (!wo) return pr;
    if (!canTransition("workOrder", wo.status, newStatus)) return pr;
    wo.status = newStatus;
    if (newStatus === "complete") {
      wo.completedDate = new Date().toISOString().split("T")[0];
    }
    return pr;
  });
}

// ── Defects ─────────────────────────────────────────────────────────────────

/**
 * Add a defect to a project.
 * @param {Function} up
 * @param {Object} data
 */
export function addDefect(up, data) {
  up(pr => {
    if (!Array.isArray(pr.defects)) pr.defects = [];
    pr.defects.push({
      id: uid(),
      title: data.title || "",
      description: data.description || "",
      location: data.location || "",
      status: "open",
      priority: data.priority || "medium",
      tradeId: data.tradeId || null,
      dueDate: data.dueDate || "",
      createdAt: new Date().toISOString(),
      resolvedAt: "",
    });
    return pr;
  });
}

/**
 * Advance a defect's status.
 * @param {Function} up
 * @param {number} defectIndex
 * @param {string} newStatus
 */
export function advanceDefectStatus(up, defectIndex, newStatus) {
  up(pr => {
    const d = pr.defects[defectIndex];
    if (!d) return pr;
    if (!canTransition("defect", d.status, newStatus)) return pr;
    d.status = newStatus;
    if (newStatus === "resolved") {
      d.resolvedAt = new Date().toISOString();
    }
    return pr;
  });
}

/**
 * Resolve a defect (convenience — allows resolving from any non-resolved status).
 * @param {Function} up
 * @param {number} defectIndex
 */
export function resolveDefect(up, defectIndex) {
  up(pr => {
    const d = pr.defects[defectIndex];
    if (!d) return pr;
    if (d.status !== "resolved") {
      d.status = "resolved";
      d.resolvedAt = new Date().toISOString();
    }
    return pr;
  });
}
