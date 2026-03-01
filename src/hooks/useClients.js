import { useStore } from "./useStore.js";
import { mkClient } from "../data/models.js";
import { findById, upsert, removeById } from "../data/store.js";

export function useClients() {
  const [clients, setClients] = useStore("ib_clients", []);

  return {
    clients,
    find: (id) => findById(clients, id),
    create: (overrides) => {
      const c = mkClient(overrides);
      setClients(prev => [...prev, c]);
      return c;
    },
    update: (id, fn) => {
      setClients(prev => prev.map(c => {
        if (c.id !== id) return c;
        const copy = JSON.parse(JSON.stringify(c));
        const result = fn(copy);
        return result || copy;
      }));
    },
    upsert: (client) => setClients(prev => upsert(prev, client)),
    remove: (id) => setClients(prev => removeById(prev, id)),
    setClients,
  };
}
