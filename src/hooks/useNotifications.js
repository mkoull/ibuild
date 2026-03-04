import { useCallback, useEffect, useState } from "react";
import { loadVersioned, saveVersioned } from "../data/store.js";

const STORAGE_KEY = "ib_notifications";
const STORE_VERSION = 1;

function loadNotifications() {
  const { data } = loadVersioned(STORAGE_KEY, {
    fallback: [],
    version: STORE_VERSION,
    migrate: (value) => (Array.isArray(value) ? value : []),
  });
  return Array.isArray(data) ? data : [];
}

export function useNotifications() {
  const [notifications, setNotifications] = useState(loadNotifications);

  useEffect(() => {
    saveVersioned(STORAGE_KEY, notifications, STORE_VERSION);
  }, [notifications]);

  const addNotification = useCallback((payload) => {
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message: String(payload?.message || "").trim(),
      type: String(payload?.type || "info"),
      link: String(payload?.link || "/dashboard"),
      createdAt: payload?.createdAt || new Date().toISOString(),
      read: false,
    };
    if (!item.message) return;
    setNotifications((prev) => [item, ...prev].slice(0, 200));
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.reduce((sum, n) => sum + (n.read ? 0 : 1), 0);

  return { notifications, unreadCount, addNotification, markRead, markAllRead };
}

