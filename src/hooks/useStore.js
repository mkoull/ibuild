import { useState, useEffect, useRef } from "react";
import { store } from "../data/store.js";

/**
 * useStore — localStorage-backed state with 300ms debounced autosave.
 * @param {string} key - localStorage key
 * @param {*} initialValue - default value if nothing in storage
 */
export function useStore(key, initialValue) {
  const [data, setData] = useState(() => {
    const stored = store.get(key);
    return stored !== null ? stored : initialValue;
  });
  const [saveStatus, setSaveStatus] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    setSaveStatus("saving");
    timer.current = setTimeout(() => {
      store.set(key, data);
      setSaveStatus(new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }));
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [data, key]);

  return [data, setData, saveStatus];
}
