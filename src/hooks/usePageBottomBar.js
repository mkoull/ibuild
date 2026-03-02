import { useEffect } from "react";

/**
 * Sets per-page bottom bar height so main padding can account for it.
 * Height is written to --page-bottom-bar-h and reset on unmount.
 */
export function usePageBottomBar(heightPx = 0) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--page-bottom-bar-h", `${Math.max(0, Number(heightPx) || 0)}px`);
    return () => {
      root.style.setProperty("--page-bottom-bar-h", "0px");
    };
  }, [heightPx]);
}

