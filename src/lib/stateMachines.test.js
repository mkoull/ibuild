import { describe, it, expect } from "vitest";
import { getValidTransitions, canTransition, transition, getEntityTypes } from "./stateMachines.js";

describe("stateMachines", () => {
  it("lists all entity types", () => {
    const types = getEntityTypes();
    expect(types).toContain("project");
    expect(types).toContain("variation");
    expect(types).toContain("invoice");
    expect(types).toContain("purchaseOrder");
    expect(types).toContain("workOrder");
    expect(types).toContain("defect");
  });

  describe("project", () => {
    it("allows Lead → Quoted", () => {
      expect(canTransition("project", "Lead", "Quoted")).toBe(true);
    });
    it("allows full lifecycle", () => {
      const chain = ["Lead", "Quoted", "Approved", "Active", "Invoiced", "Complete"];
      for (let i = 0; i < chain.length - 1; i++) {
        expect(canTransition("project", chain[i], chain[i + 1])).toBe(true);
      }
    });
    it("rejects skipping stages", () => {
      expect(canTransition("project", "Lead", "Active")).toBe(false);
    });
    it("rejects backward transition", () => {
      expect(canTransition("project", "Active", "Lead")).toBe(false);
    });
    it("Complete has no transitions", () => {
      expect(getValidTransitions("project", "Complete")).toEqual([]);
    });
  });

  describe("variation", () => {
    it("draft → sent", () => expect(canTransition("variation", "draft", "sent")).toBe(true));
    it("sent → approved", () => expect(canTransition("variation", "sent", "approved")).toBe(true));
    it("sent → rejected", () => expect(canTransition("variation", "sent", "rejected")).toBe(true));
    it("rejects draft → approved", () => expect(canTransition("variation", "draft", "approved")).toBe(false));
  });

  describe("invoice", () => {
    it("draft → sent → paid", () => {
      expect(canTransition("invoice", "draft", "sent")).toBe(true);
      expect(canTransition("invoice", "sent", "paid")).toBe(true);
    });
    it("sent → void", () => expect(canTransition("invoice", "sent", "void")).toBe(true));
    it("rejects draft → paid", () => expect(canTransition("invoice", "draft", "paid")).toBe(false));
  });

  describe("purchaseOrder", () => {
    it("follows draft → sent → accepted → received", () => {
      expect(canTransition("purchaseOrder", "draft", "sent")).toBe(true);
      expect(canTransition("purchaseOrder", "sent", "accepted")).toBe(true);
      expect(canTransition("purchaseOrder", "accepted", "received")).toBe(true);
    });
    it("rejects skipping", () => {
      expect(canTransition("purchaseOrder", "draft", "accepted")).toBe(false);
    });
  });

  describe("workOrder", () => {
    it("follows draft → issued → in_progress → complete", () => {
      expect(canTransition("workOrder", "draft", "issued")).toBe(true);
      expect(canTransition("workOrder", "issued", "in_progress")).toBe(true);
      expect(canTransition("workOrder", "in_progress", "complete")).toBe(true);
    });
  });

  describe("defect", () => {
    it("follows open → assigned → in_progress → resolved", () => {
      expect(canTransition("defect", "open", "assigned")).toBe(true);
      expect(canTransition("defect", "assigned", "in_progress")).toBe(true);
      expect(canTransition("defect", "in_progress", "resolved")).toBe(true);
    });
    it("rejects open → resolved directly", () => {
      expect(canTransition("defect", "open", "resolved")).toBe(false);
    });
  });

  describe("transition()", () => {
    it("returns new object with updated status", () => {
      const vo = { id: "v1", status: "draft", amount: 100 };
      const result = transition("variation", vo, "sent");
      expect(result.status).toBe("sent");
      expect(result.id).toBe("v1");
      expect(result.amount).toBe(100);
      // Original unchanged
      expect(vo.status).toBe("draft");
    });

    it("updates stage and status for projects", () => {
      const p = { id: "p1", stage: "Lead", status: "Lead" };
      const result = transition("project", p, "Quoted");
      expect(result.stage).toBe("Quoted");
      expect(result.status).toBe("Quoted");
    });

    it("throws on invalid transition", () => {
      const vo = { id: "v1", status: "draft" };
      expect(() => transition("variation", vo, "approved")).toThrow("Invalid variation transition");
    });

    it("returns [] for unknown type", () => {
      expect(getValidTransitions("unknown", "foo")).toEqual([]);
    });
  });
});
