/**
 * State machines — pure function status transitions for all entity types.
 * Each machine defines valid transitions; illegal transitions are rejected.
 */

const MACHINES = {
  project: {
    Lead: ["Quoted"],
    Quoted: ["Approved"],
    Approved: ["Active"],
    Active: ["Invoiced"],
    Invoiced: ["Complete"],
    Complete: [],
  },
  variation: {
    draft: ["sent"],
    sent: ["approved", "rejected"],
    approved: [],
    rejected: [],
  },
  invoice: {
    draft: ["sent"],
    sent: ["paid", "void"],
    paid: [],
    void: [],
  },
  purchaseOrder: {
    draft: ["sent"],
    sent: ["accepted"],
    accepted: ["received"],
    received: [],
  },
  workOrder: {
    draft: ["issued"],
    issued: ["in_progress"],
    in_progress: ["complete"],
    complete: [],
  },
  defect: {
    open: ["assigned"],
    assigned: ["in_progress"],
    in_progress: ["resolved"],
    resolved: [],
  },
};

/**
 * Get valid next statuses for a given entity type and current status.
 * @param {string} type - Entity type key (project, variation, invoice, purchaseOrder, workOrder, defect)
 * @param {string} status - Current status
 * @returns {string[]} Array of valid next statuses
 */
export function getValidTransitions(type, status) {
  const machine = MACHINES[type];
  if (!machine) return [];
  return machine[status] || [];
}

/**
 * Check if a transition is valid.
 * @param {string} type - Entity type key
 * @param {string} from - Current status
 * @param {string} to - Target status
 * @returns {boolean}
 */
export function canTransition(type, from, to) {
  return getValidTransitions(type, from).includes(to);
}

/**
 * Apply a status transition to an entity. Returns a new object with updated status.
 * Throws if the transition is invalid.
 * @param {string} type - Entity type key
 * @param {Object} entity - Entity with a `status` (or `stage` for projects) field
 * @param {string} newStatus - Target status
 * @returns {Object} New entity with updated status
 */
export function transition(type, entity, newStatus) {
  const currentStatus = type === "project" ? (entity.stage || entity.status) : entity.status;
  if (!canTransition(type, currentStatus, newStatus)) {
    throw new Error(`Invalid ${type} transition: ${currentStatus} → ${newStatus}`);
  }
  if (type === "project") {
    return { ...entity, stage: newStatus, status: newStatus, updatedAt: new Date().toISOString() };
  }
  return { ...entity, status: newStatus };
}

/**
 * Get all supported entity types.
 * @returns {string[]}
 */
export function getEntityTypes() {
  return Object.keys(MACHINES);
}

/**
 * Get the full machine definition for an entity type.
 * @param {string} type
 * @returns {Object<string, string[]>|null}
 */
export function getMachine(type) {
  return MACHINES[type] || null;
}
