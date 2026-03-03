import { useStore } from "./useStore.js";
import { mkTrade } from "../data/models.js";
import { findById, upsert, removeById } from "../data/store.js";
import { shadowWriter } from "../lib/shadowWrite.js";

export function useTrades() {
  const [trades, setTrades] = useStore("ib_trades", []);

  return {
    trades,
    find: (id) => findById(trades, id),
    create: (overrides) => {
      const t = mkTrade(overrides);
      setTrades(prev => [...prev, t]);
      shadowWriter.onTradeSave(t);
      return t;
    },
    update: (id, fn) => {
      setTrades(prev => prev.map(t => {
        if (t.id !== id) return t;
        const copy = JSON.parse(JSON.stringify(t));
        const result = fn(copy);
        const updated = result || copy;
        shadowWriter.onTradeSave(updated);
        return updated;
      }));
    },
    upsert: (trade) => {
      setTrades(prev => upsert(prev, trade));
      shadowWriter.onTradeSave(trade);
    },
    remove: (id) => setTrades(prev => removeById(prev, id)),
    setTrades,
  };
}
