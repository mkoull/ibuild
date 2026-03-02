import { createContext, useContext, useMemo } from "react";
import { useProjectsCtx } from "./AppContext.jsx";
import { useApp } from "./AppContext.jsx";
import { calc } from "../lib/calc.js";
import { ts, ds } from "../theme/styles.js";
import { canTransition, applyJobConversion } from "../lib/lifecycle.js";

const ProjectCtx = createContext(null);

export function ProjectProvider({ project, children }) {
  const { update, clientsHook } = useProjectsCtx();
  const { notify } = useApp();

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
    const currentStage = project.stage || "Lead";
    if (!canTransition(currentStage, newStage)) return;
    up(pr => {
      pr.stage = newStage;
      pr.updatedAt = new Date().toISOString();
      if (!Array.isArray(pr.activity)) pr.activity = [];
      pr.activity.unshift({ type: "stage_change", action: `Stage changed to ${newStage}`, time: ts(), date: ds(), at: Date.now() });
      if (pr.activity.length > 30) pr.activity = pr.activity.slice(0, 30);
      return pr;
    });
    notify(`Stage → ${newStage}`);
  };

  const convertToJob = (opts = {}) => {
    up(pr => applyJobConversion(pr, opts));
  };

  const value = { project, update: up, T, client, log, transitionStage, convertToJob };

  return <ProjectCtx.Provider value={value}>{children}</ProjectCtx.Provider>;
}

export function useProject() {
  const ctx = useContext(ProjectCtx);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
