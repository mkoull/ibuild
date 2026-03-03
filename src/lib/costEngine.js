function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function round2(n) {
  return Math.round(toNum(n) * 100) / 100;
}

export function deepCopy(value) {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

export function normalizeCategories(categories) {
  const list = Array.isArray(categories) ? categories : [];
  return list.map((cat) => ({
    id: cat.id,
    name: cat.name || "Category",
    items: (Array.isArray(cat.items) ? cat.items : []).map((item) => {
      const quantity = toNum(item.quantity);
      const unitRate = toNum(item.unitRate);
      const marginPercent = toNum(item.marginPercent);
      const costTotal = round2(quantity * unitRate);
      const sellTotal = round2(costTotal + (costTotal * (marginPercent / 100)));
      return {
        ...item,
        quantity,
        unitRate,
        marginPercent,
        costTotal,
        sellTotal,
      };
    }),
  }));
}

export function calculateTotals(categories) {
  const list = normalizeCategories(categories);
  let totalCost = 0;
  let totalSell = 0;
  list.forEach((cat) => {
    (cat.items || []).forEach((item) => {
      totalCost += toNum(item.costTotal);
      totalSell += toNum(item.sellTotal);
    });
  });
  totalCost = round2(totalCost);
  totalSell = round2(totalSell);
  const marginValue = round2(totalSell - totalCost);
  const marginPercent = totalSell > 0 ? (marginValue / totalSell) : 0;
  return {
    totalCost,
    totalSell,
    marginValue,
    marginPercent,
  };
}

export function applyConvertToJobBaseline(pr) {
  const stage = String(pr.stage || pr.status || "").toLowerCase();
  const alreadyConverted = stage === "active" && !!pr.job?.baseline;
  if (alreadyConverted) return false;

  const now = new Date().toISOString();
  const estimateCategories = normalizeCategories(
    (pr.estimate && pr.estimate.categories) || pr.costCategories || [],
  );
  const estimateTotals = calculateTotals(estimateCategories);
  pr.estimate = {
    categories: deepCopy(estimateCategories),
    totals: { ...estimateTotals },
  };
  pr.costCategories = deepCopy(estimateCategories);

  if (!pr.job || !pr.job.baseline) {
    const baselineCategories = deepCopy(estimateCategories);
    const baselineTotals = calculateTotals(baselineCategories);
    pr.job = {
      baseline: {
        createdAt: now,
        categories: deepCopy(baselineCategories),
        totals: { ...baselineTotals },
      },
      budget: {
        categories: deepCopy(baselineCategories),
        totals: { ...baselineTotals },
      },
      contract: {
        baseContractValue: baselineTotals.totalSell,
        approvedVariationsValue: 0,
        currentContractValue: baselineTotals.totalSell,
      },
    };
  }

  pr.stage = "Active";
  pr.status = "Active";
  pr.convertedAt = now;
  pr.updatedAt = now;
  if (!Array.isArray(pr.activity)) pr.activity = [];
  pr.activity.unshift({
    action: "Converted to Job",
    date: new Date().toLocaleDateString("en-AU"),
    time: new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }),
  });
  if (pr.activity.length > 30) pr.activity = pr.activity.slice(0, 30);
  return true;
}

export function applyApprovedVariation(pr, variation) {
  if (!pr?.job?.contract || !pr?.job?.budget) return;
  if (variation?._appliedToJob) return;

  const costImpact = toNum(variation.costImpact);
  const sellImpact = toNum(variation.sellImpact);

  if (!pr.job.contract) {
    const base = toNum(pr.job?.baseline?.totals?.totalSell);
    pr.job.contract = {
      baseContractValue: base,
      approvedVariationsValue: 0,
      currentContractValue: base,
    };
  }

  pr.job.contract.approvedVariationsValue = round2(
    toNum(pr.job.contract.approvedVariationsValue) + sellImpact,
  );
  pr.job.contract.currentContractValue = round2(
    toNum(pr.job.contract.baseContractValue) + toNum(pr.job.contract.approvedVariationsValue),
  );

  const budgetCategories = normalizeCategories(pr.job.budget.categories || []);
  const variationCategoryName = "Variations";
  let category = budgetCategories.find((c) => c.name === variationCategoryName);
  if (!category) {
    category = { id: `VAR-${Date.now()}`, name: variationCategoryName, items: [] };
    budgetCategories.push(category);
  }
  category.items.push({
    id: variation.id,
    description: variation.title || variation.description || variation.number || "Variation",
    quantity: 1,
    unit: "sum",
    unitRate: costImpact,
    costTotal: round2(costImpact),
    marginPercent: 0,
    sellTotal: round2(sellImpact),
    source: "variation",
    variationId: variation.id,
  });

  const budgetTotals = calculateTotals(budgetCategories);
  budgetTotals.totalCost = round2(toNum(budgetTotals.totalCost));
  budgetTotals.totalSell = round2(toNum(budgetTotals.totalSell));
  budgetTotals.marginValue = round2(toNum(budgetTotals.totalSell) - toNum(budgetTotals.totalCost));
  budgetTotals.marginPercent = budgetTotals.totalSell > 0 ? budgetTotals.marginValue / budgetTotals.totalSell : 0;

  pr.job.budget = {
    categories: deepCopy(budgetCategories),
    totals: budgetTotals,
  };

  variation._appliedToJob = true;
  variation.approvedAt = variation.approvedAt || new Date().toISOString();
}
