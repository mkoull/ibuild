/**
 * JSDoc entity typedefs for iBuild.
 * Import this file for IDE autocompletion; it exports nothing at runtime.
 */

/**
 * @typedef {Object} Contact
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} role
 * @property {string} address
 * @property {string} suburb
 * @property {string} state
 * @property {string} postcode
 */

/**
 * @typedef {Object} Client
 * @property {string} id
 * @property {string} displayName
 * @property {string} companyName
 * @property {string} status - "active" | "archived"
 * @property {Contact[]} contacts
 * @property {string} notes
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Trade
 * @property {string} id
 * @property {string} businessName
 * @property {string} category
 * @property {string} status - "active" | "archived"
 * @property {Contact[]} contacts
 * @property {string[]} regions
 * @property {string[]} tags
 * @property {string[]} defaultRateIds
 * @property {string} licenceInfo
 * @property {string} insuranceInfo
 * @property {string} notes
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} BudgetLine
 * @property {string} id
 * @property {string} tradeId
 * @property {string} costCode
 * @property {string} label
 * @property {number} budgetAmount
 * @property {number} actualAmount
 * @property {number} sellPrice
 * @property {number} costAllowance
 * @property {string} source - "quote_import" | "manual" | "variation"
 * @property {string} date
 * @property {string} linkedBudgetLineId
 * @property {Allocation[]} allocations
 */

/**
 * @typedef {Object} Allocation
 * @property {string} tradeId
 * @property {string} tradeLabel
 * @property {number} amount
 */

/**
 * @typedef {Object} Commitment
 * @property {string} id
 * @property {string} tradeId
 * @property {string} description
 * @property {string} vendorName
 * @property {number} amount
 * @property {string} status - "Committed" | "approved"
 * @property {string} date
 * @property {string} linkedBudgetLineId
 */

/**
 * @typedef {Object} Actual
 * @property {string} id
 * @property {string} tradeId
 * @property {string} costCode
 * @property {string} description
 * @property {number} amount
 * @property {string} date
 * @property {string} source - "Manual" | "bill"
 * @property {string} linkedBudgetLineId
 */

/**
 * @typedef {Object} Variation
 * @property {string} id
 * @property {string} desc
 * @property {number} amount
 * @property {string} status - "draft" | "sent" | "approved" | "rejected"
 * @property {string} date
 * @property {string} reason
 * @property {VariationLineItem[]} [lineItems]
 */

/**
 * @typedef {Object} VariationLineItem
 * @property {string} id
 * @property {string} description
 * @property {number} qty
 * @property {string} unit
 * @property {number} rate
 * @property {number} amount
 */

/**
 * @typedef {Object} Invoice
 * @property {string} id
 * @property {string} title
 * @property {number} amount
 * @property {string} type - "Progress" | "Final" | "Retention"
 * @property {string} status - "draft" | "sent" | "paid" | "void"
 * @property {string} date
 * @property {string} issuedAt
 * @property {string} dueAt
 * @property {InvoiceLineItem[]} lineItems
 */

/**
 * @typedef {Object} InvoiceLineItem
 * @property {string} id
 * @property {string} description
 * @property {number} amount
 */

/**
 * @typedef {Object} Milestone
 * @property {string} id
 * @property {string} label
 * @property {number} wk
 * @property {number} durationDays
 * @property {number} offsetDays
 * @property {string[]} dependsOn
 * @property {string|null} tradeId
 * @property {string} freeTextTrade
 * @property {string} status - "not_started" | "in_progress" | "complete"
 * @property {number} percentComplete
 * @property {string} plannedStart
 * @property {string} plannedFinish
 * @property {string} actualStart
 * @property {string} actualFinish
 * @property {string} pinnedStart
 * @property {string} pinnedFinish
 * @property {string} constraintMode - "finish-to-start"
 * @property {boolean} manuallyPinned
 * @property {boolean} done
 * @property {string} date
 * @property {number} order
 */

/**
 * @typedef {Object} PurchaseOrder
 * @property {string} id
 * @property {string} tradeId
 * @property {Array<{description: string, qty: number, unit: string, unitPrice: number, amount: number}>} items
 * @property {string} status - "draft" | "sent" | "accepted" | "received"
 * @property {number} totalAmount
 * @property {string} issueDate
 * @property {string} expectedDelivery
 * @property {string|null} linkedBudgetLineId
 * @property {string} notes
 */

/**
 * @typedef {Object} WorkOrder
 * @property {string} id
 * @property {string} tradeId
 * @property {string} description
 * @property {string} scheduledDate
 * @property {string} completedDate
 * @property {string} status - "draft" | "issued" | "in_progress" | "complete"
 * @property {number} amount
 * @property {string|null} milestoneId
 * @property {string} notes
 */

/**
 * @typedef {Object} RFQ
 * @property {string} id
 * @property {string[]} tradeIds
 * @property {Array<{category: string, item: string}>} scopeItems
 * @property {string} dueDate
 * @property {string} status - "draft" | "sent" | "closed"
 * @property {Array<{tradeId: string, amount: number, notes: string, receivedAt: string}>} responses
 * @property {string} notes
 * @property {string} createdAt
 */

/**
 * @typedef {Object} DiaryEntry
 * @property {string} id
 * @property {string} date
 * @property {string} weather
 * @property {string} notes
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Defect
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} location
 * @property {string} status - "open" | "assigned" | "in_progress" | "resolved"
 * @property {string} [priority] - "low" | "medium" | "high" | "critical"
 * @property {string|null} [tradeId]
 * @property {string} [dueDate]
 * @property {string} createdAt
 * @property {string} resolvedAt
 */

/**
 * @typedef {Object} CostAllowanceEntry
 * @property {number} pct
 * @property {number} amount
 * @property {boolean} locked
 */

/**
 * @typedef {Object} CostAllowances
 * @property {CostAllowanceEntry} margin
 * @property {CostAllowanceEntry} contingency
 * @property {CostAllowanceEntry} siteOverhead
 * @property {CostAllowanceEntry} officeOverhead
 */

/**
 * @typedef {Object} BudgetBaseline
 * @property {string} id
 * @property {string} createdAt
 * @property {number} version
 * @property {BudgetLine[]} lines
 * @property {number} total
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {string} client
 * @property {string} clientId
 * @property {string} clientContactId
 * @property {string} address
 * @property {string} suburb
 * @property {string} buildType
 * @property {string} storeys
 * @property {string} floorArea
 * @property {string} stage - "Lead" | "Quoted" | "Approved" | "Active" | "Invoiced" | "Complete"
 * @property {number} marginPct
 * @property {number} contingencyPct
 * @property {Object<string, Array<{_id: string, item: string, unit: string, rate: number, qty: number, on: boolean, actual: number}>>} scope
 * @property {Milestone[]} schedule
 * @property {Variation[]} variations
 * @property {Invoice[]} invoices
 * @property {BudgetLine[]} budget
 * @property {BudgetLine[]} workingBudget
 * @property {Commitment[]} commitments
 * @property {Actual[]} actuals
 * @property {DiaryEntry[]} diary
 * @property {Defect[]} defects
 * @property {PurchaseOrder[]} purchaseOrders
 * @property {WorkOrder[]} workOrders
 * @property {RFQ[]} rfqs
 * @property {Array} documents
 * @property {Array} proposals
 * @property {Array} activity
 * @property {CostAllowances} costAllowances
 * @property {BudgetBaseline|null} budgetBaseline
 * @property {Object|null} quoteSnapshotBudget
 * @property {Array} variationLedger
 * @property {Array} supplierBills
 * @property {Array} billUploads
 * @property {Array} paymentSchedule
 * @property {string[]} assignedTradeIds
 * @property {boolean} autoCascade
 * @property {boolean} lockedQuote
 * @property {boolean} jobUnlocked
 * @property {string} createdAt
 * @property {string} updatedAt
 */
