import { useStore } from "./useStore.js";
import { uid } from "../theme/styles.js";
import { mkRateCategory, mkRateItem } from "../data/models.js";

export function useRateLibrary() {
  const [lib, setLib] = useStore("ib_rate_library", { categories: [], items: [] });

  const categories = lib.categories || [];
  const items = lib.items || [];

  return {
    categories,
    items,
    getItemsByCategory: (catId) => items.filter(i => i.categoryId === catId),

    addCategory: (name) => {
      const cat = mkRateCategory({ name });
      setLib(prev => ({ ...prev, categories: [...prev.categories, cat] }));
      return cat;
    },
    updateCategory: (id, updates) => {
      setLib(prev => ({
        ...prev,
        categories: prev.categories.map(c => c.id === id ? { ...c, ...updates } : c),
      }));
    },
    removeCategory: (id) => {
      setLib(prev => ({
        categories: prev.categories.filter(c => c.id !== id),
        items: prev.items.filter(i => i.categoryId !== id),
      }));
    },

    addItem: (categoryId, overrides = {}) => {
      const item = mkRateItem({ categoryId, ...overrides });
      setLib(prev => ({ ...prev, items: [...prev.items, item] }));
      return item;
    },
    updateItem: (id, updates) => {
      setLib(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === id ? { ...i, ...updates } : i),
      }));
    },
    removeItem: (id) => {
      setLib(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
    },
  };
}
