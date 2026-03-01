import { useStore } from "./useStore.js";
import { mkTrade } from "../data/models.js";
import { findById, upsert, removeById } from "../data/store.js";

export function useTrades() {
  const [trades, setTrades] = useStore("ib_trades", []);

  return {
    trades,
    find: (id) => findById(trades, id),
    create: (overrides) => {
      const t = mkTrade(overrides);
      setTrades(prev => [...prev, t]);
      return t;
    },
    update: (id, fn) => {
      setTrades(prev => prev.map(t => {
        if (t.id !== id) return t;
        const copy = JSON.parse(JSON.stringify(t));
        const result = fn(copy);
        return result || copy;
      }));
    },
    upsert: (trade) => setTrades(prev => upsert(prev, trade)),
    remove: (id) => setTrades(prev => removeById(prev, id)),
    setTrades,
  };
}
