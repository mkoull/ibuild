import { useState, useCallback } from "react";
import { getAllFlags, setFlag as rawSetFlag } from "../lib/featureFlags.js";

export function useFeatureFlags() {
  const [flags, setFlags] = useState(getAllFlags);

  const setFlag = useCallback((name, value) => {
    rawSetFlag(name, value);
    setFlags(getAllFlags());
  }, []);

  const refresh = useCallback(() => {
    setFlags(getAllFlags());
  }, []);

  return { flags, setFlag, refresh };
}
