"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Shared portal tab hook that synchronizes tab state cleanly with:
 * - URL `?tab=...` query parameter
 * - Legacy `#hash` anchors
 * - Sidebar / navbar `campusflow_tab_change` custom events
 * - Browser back/forward (`popstate`)
 */
export function usePortalTab<T extends string>(
  validTabs: readonly T[],
  defaultTab: T
): [T, (tab: T) => void] {
  const [activeTab, setActiveTab] = useState<T>(defaultTab);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isValid = (val: string | null | undefined): val is T =>
      Boolean(val && (validTabs as readonly string[]).includes(val));

    const syncTab = (e?: Event) => {
      if (e && "detail" in e) {
        const detail = (e as CustomEvent<{ tab?: string; tabKey?: string }>)
          .detail;
        const eventTab = detail?.tab || detail?.tabKey;
        if (isValid(eventTab)) {
          setActiveTab(eventTab);
          return;
        }
      }

      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      if (isValid(urlTab)) {
        setActiveTab(urlTab);
        return;
      }

      if (window.location.hash) {
        const hashTab = window.location.hash.replace("#", "");
        if (isValid(hashTab)) {
          setActiveTab(hashTab);
          return;
        }
      }

      setActiveTab(defaultTab);
    };

    syncTab();
    window.addEventListener("popstate", syncTab);
    window.addEventListener("campusflow_tab_change", syncTab);
    return () => {
      window.removeEventListener("popstate", syncTab);
      window.removeEventListener("campusflow_tab_change", syncTab);
    };
  }, [validTabs, defaultTab]);

  const switchTab = useCallback((tab: T) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
      window.dispatchEvent(
        new CustomEvent("campusflow_tab_change", {
          detail: { tab, tabKey: tab },
        })
      );
    }
  }, []);

  return [activeTab, switchTab];
}
