import { createContext, useContext, useMemo } from "react";
import { useApp } from "./AppContext.jsx";
import { calc } from "../lib/calc.js";
import { ts, ds } from "../theme/styles.js";

const ProjectCtx = createContext(null);

export function ProjectProvider({ project, children }) {
  const { update, clients, clientsHook, notify } = useApp();

  const T = useMemo(() => calc(project), [project]);

  const client = useMemo(() => {
    if (project.clientId) return clientsHook.find(project.clientId);
    return null;
  }, [project.clientId, clientsHook]);

  const up = (fn) => update(project.id, fn);

  const log = (action) => up(pr => {
    pr.activity.unshift({ action, time: ts(), date: ds() });
    if (pr.activity.length > 30) pr.activity = pr.activity.slice(0, 30);
    return pr;
  });

  const transitionStage = (newStage) => {
    up(pr => { pr.stage = newStage; return pr; });
    log(`Stage → ${newStage}`);
    notify(`Stage → ${newStage}`);
  };

  const value = { project, update: up, T, client, log, transitionStage };

  return <ProjectCtx.Provider value={value}>{children}</ProjectCtx.Provider>;
}

export function useProject() {
  const ctx = useContext(ProjectCtx);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
