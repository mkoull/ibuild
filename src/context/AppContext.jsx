import { createContext, useContext } from "react";
import { useProjects } from "../hooks/useProjects.js";
import { useClients } from "../hooks/useClients.js";
import { useTrades } from "../hooks/useTrades.js";
import { useRateLibrary } from "../hooks/useRateLibrary.js";
import { useToast } from "../hooks/useToast.js";
import { useMobile } from "../hooks/useMobile.js";

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const projectsHook = useProjects();
  const clientsHook = useClients();
  const tradesHook = useTrades();
  const rateLibrary = useRateLibrary();
  const { toast, notify, dismiss } = useToast();
  const mobile = useMobile();

  const value = {
    ...projectsHook,
    clients: clientsHook.clients,
    clientsHook,
    trades: tradesHook.trades,
    tradesHook,
    rateLibrary,
    toast,
    notify,
    dismiss,
    mobile,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
