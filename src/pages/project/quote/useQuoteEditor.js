import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { uid } from "../../../theme/styles.js";
import { toPositiveNumber } from "../../../lib/validation.js";
import { UNDO_TIMEOUT_MS } from "./constants.js";

export default function useQuoteEditor({ project, up, margin, rateLibrary, notify }) {
  const [selectedCat, setSelectedCat] = useState("");
  const [newCat, setNewCat] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [drawerItem, setDrawerItem] = useState(null); // { cat, idx }
  const [deletedItem, setDeletedItem] = useState(null); // { cat, idx, item }
  const [pendingFocusKey, setPendingFocusKey] = useState("");
  const [delCat, setDelCat] = useState(null);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const descInputRefs = useRef({});
  const tableScrollMemoryRef = useRef({});

  const scopeCategories = Object.keys(project.scope || {});

  // Auto-select first category
  useEffect(() => {
    if (!scopeCategories.length) {
      if (selectedCat) setSelectedCat("");
      return;
    }
    if (!selectedCat || !project.scope[selectedCat]) {
      setSelectedCat(scopeCategories[0]);
    }
  }, [scopeCategories, selectedCat, project.scope]);

  // Focus management
  useEffect(() => {
    if (!pendingFocusKey) return;
    const el = descInputRefs.current[pendingFocusKey];
    if (el && typeof el.focus === "function") {
      el.focus();
      el.select?.();
      setPendingFocusKey("");
      return;
    }
    const t = setTimeout(() => {
      const next = descInputRefs.current[pendingFocusKey];
      if (next && typeof next.focus === "function") {
        next.focus();
        next.select?.();
      }
      setPendingFocusKey("");
    }, 0);
    return () => clearTimeout(t);
  }, [pendingFocusKey, project.scope]);

  // Auto-clear undo buffer
  useEffect(() => {
    if (!deletedItem) return;
    const t = setTimeout(() => setDeletedItem(null), UNDO_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [deletedItem]);

  // ─── Mutations (moved verbatim from QuotePage) ───

  const uI = useCallback((cat, idx, k, v) => up(pr => {
    if (k === "qty" || k === "rate") {
      pr.scope[cat][idx][k] = toPositiveNumber(v, 0);
    } else {
      pr.scope[cat][idx][k] = v;
    }
    if (k === "on" && v && !pr.scope[cat][idx].qty) pr.scope[cat][idx].qty = 1;
    return pr;
  }), [up]);

  const addLineItem = useCallback((cat, seed = {}) => {
    let insertedIdx = -1;
    up((pr) => {
      if (!pr.scope[cat]) pr.scope[cat] = [];
      const row = {
        item: seed.item || "",
        type: seed.type || "Labour",
        unit: seed.unit || "ea",
        rate: toPositiveNumber(seed.rate, 0),
        qty: toPositiveNumber(seed.qty, 1),
        on: true,
        actual: 0,
        custom: true,
        _id: uid(),
        notes: seed.notes || "",
        supplier: seed.supplier || "",
        labourCost: toPositiveNumber(seed.labourCost, 0),
        materialCost: toPositiveNumber(seed.materialCost, 0),
        attachments: Array.isArray(seed.attachments) ? seed.attachments : [],
      };
      pr.scope[cat].push(row);
      insertedIdx = pr.scope[cat].length - 1;
      return pr;
    });
    if (insertedIdx >= 0) {
      setPendingFocusKey(`${cat}:${insertedIdx}`);
    }
    return insertedIdx;
  }, [up]);

  const delI = useCallback((cat, idx) => {
    // Store for undo
    const item = project.scope?.[cat]?.[idx];
    if (item) {
      setDeletedItem({ cat, idx, item: JSON.parse(JSON.stringify(item)) });
    }
    up(pr => {
      pr.scope[cat].splice(idx, 1);
      return pr;
    });
    notify("Item deleted — tap Undo to restore");
  }, [up, project.scope, notify]);

  const undoDelete = useCallback(() => {
    if (!deletedItem) return;
    const { cat, idx, item } = deletedItem;
    up(pr => {
      if (!pr.scope[cat]) pr.scope[cat] = [];
      pr.scope[cat].splice(idx, 0, item);
      return pr;
    });
    setDeletedItem(null);
    notify("Item restored");
  }, [deletedItem, up, notify]);

  const getRowMargin = useCallback((item) => Number(item.marginPct ?? margin) || 0, [margin]);

  const getRowSell = useCallback((item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    return qty * rate * (1 + (getRowMargin(item) / 100));
  }, [getRowMargin]);

  // ─── New mutations ───

  const duplicateItem = useCallback((cat, idx) => {
    up(pr => {
      const src = pr.scope[cat]?.[idx];
      if (!src) return pr;
      const copy = { ...JSON.parse(JSON.stringify(src)), _id: uid() };
      pr.scope[cat].splice(idx + 1, 0, copy);
      return pr;
    });
    notify("Item duplicated");
  }, [up, notify]);

  const addCategory = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) { notify("Enter a category name", "error"); return; }
    if (project.scope[trimmed]) { notify("Category already exists", "error"); return; }
    up(pr => { pr.scope[trimmed] = []; return pr; });
    setSelectedCat(trimmed);
    setNewCat("");
  }, [up, project.scope, notify]);

  const deleteCategory = useCallback((cat) => {
    up(pr => { delete pr.scope[cat]; return pr; });
    setDelCat(null);
  }, [up]);

  // ─── Library search ───

  const libraryMatches = useMemo(() => {
    if (!selectedCat || !librarySearch.trim()) return [];
    const q = librarySearch.toLowerCase().trim();
    return (rateLibrary.items || [])
      .filter((item) => {
        const name = String(item.name || "").toLowerCase();
        const categoryName = String(rateLibrary.categories.find((c) => c.id === item.categoryId)?.name || "").toLowerCase();
        return name.includes(q) || categoryName.includes(q);
      })
      .slice(0, 8);
  }, [librarySearch, rateLibrary.items, rateLibrary.categories, selectedCat]);

  const addFromLibrary = useCallback((item) => {
    if (!selectedCat) return;
    const insertedIdx = addLineItem(selectedCat, {
      item: item.name,
      unit: item.unit || "ea",
      rate: Number(item.unitRate) || 0,
      qty: Number(item.defaultQty) || 1,
      labourCost: Number(item.labourCost) || 0,
      materialCost: Number(item.materialCost) || 0,
    });
    if (insertedIdx >= 0) {
      notify(`Added: ${item.name}`);
      setLibrarySearch("");
    }
  }, [selectedCat, addLineItem, notify]);

  const filesToDataUrls = useCallback(async (fileList) => {
    const files = Array.from(fileList || []);
    const mapped = files.map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: String(reader.result || "") });
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    }));
    return Promise.all(mapped);
  }, []);

  return {
    // State
    selectedCat, setSelectedCat,
    newCat, setNewCat,
    librarySearch, setLibrarySearch,
    drawerItem, setDrawerItem,
    deletedItem,
    delCat, setDelCat,
    mobileSidebar, setMobileSidebar,
    descInputRefs,
    tableScrollMemoryRef,
    scopeCategories,
    // Mutations
    uI, addLineItem, delI, undoDelete,
    getRowMargin, getRowSell,
    duplicateItem,
    addCategory, deleteCategory,
    // Library
    libraryMatches, addFromLibrary,
    filesToDataUrls,
  };
}
