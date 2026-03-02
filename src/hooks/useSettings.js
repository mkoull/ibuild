import { useState, useCallback } from "react";

const DEFAULTS = {
  companyName: "",
  abn: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  logo: "",
  defaultMargin: 18,
  defaultContingency: 5,
  defaultValidDays: 30,
  defaultPaymentTermsDays: 14,
};

function load() {
  try {
    const raw = localStorage.getItem("ib_settings");
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch { return { ...DEFAULTS }; }
}

export function useSettings() {
  const [settings, setSettings] = useState(load);

  const save = useCallback((next) => {
    const merged = typeof next === "function" ? next(load()) : { ...load(), ...next };
    localStorage.setItem("ib_settings", JSON.stringify(merged));
    setSettings(merged);
  }, []);

  const refresh = useCallback(() => setSettings(load()), []);

  return { settings, save, refresh };
}
