import { createContext, useContext, useMemo } from "react";
import { useProjects } from "../hooks/useProjects.js";
import { useClients } from "../hooks/useClients.js";
import { useTrades } from "../hooks/useTrades.js";
import { useRateLibrary } from "../hooks/useRateLibrary.js";
import { useToast } from "../hooks/useToast.js";
import { useMobile } from "../hooks/useMobile.js";
import { useSettings } from "../hooks/useSettings.js";

const ProjectsCtx = createContext(null);
const SettingsCtx = createContext(null);
const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const projectsHook = useProjects();
  const clientsHook = useClients();
  const tradesHook = useTrades();
  const rateLibrary = useRateLibrary();
  const { toast, notify, dismiss } = useToast();
  const mobile = useMobile();
  const settingsHook = useSettings();

  const projectsValue = useMemo(() => ({
    ...projectsHook,
    clients: clientsHook.clients,
    clientsHook,
    trades: tradesHook.trades,
    tradesHook,
    rateLibrary,
  }), [projectsHook, clientsHook, tradesHook, rateLibrary]);

  const settingsValue = useMemo(() => ({
    settings: settingsHook.settings,
    settingsHook,
  }), [settingsHook]);

  const appValue = useMemo(() => ({
    ...projectsValue,
    ...settingsValue,
    toast,
    notify,
    dismiss,
    mobile,
  }), [projectsValue, settingsValue, toast, notify, dismiss, mobile]);

  return (
    <ProjectsCtx.Provider value={projectsValue}>
      <SettingsCtx.Provider value={settingsValue}>
        <AppCtx.Provider value={appValue}>
          {children}
        </AppCtx.Provider>
      </SettingsCtx.Provider>
    </ProjectsCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function useProjectsCtx() {
  const ctx = useContext(ProjectsCtx);
  if (!ctx) throw new Error("useProjectsCtx must be used within AppProvider");
  return ctx;
}

export function useSettingsCtx() {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error("useSettingsCtx must be used within AppProvider");
  return ctx;
}
