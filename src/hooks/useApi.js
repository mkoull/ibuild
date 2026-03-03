import { useMemo } from "react";

const BASE = import.meta.env.VITE_API_URL || "/api";
export const INTEGRATION_MODE_KEY = "ib_integration_mode";
export const AUTH_TOKEN_KEY = "ib_auth_token";

function makeCorrelationId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function request(method, path, body) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-correlation-id": makeCorrelationId(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

export function useApi() {
  const api = useMemo(() => ({
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, body),
    put: (path, body) => request("PUT", path, body),
    del: (path) => request("DELETE", path),
    getIntegrationMode: () => localStorage.getItem(INTEGRATION_MODE_KEY) || "local",
    setIntegrationMode: (mode) => localStorage.setItem(INTEGRATION_MODE_KEY, mode || "local"),
  }), []);

  return api;
}
