"use client";

import { useState, useEffect } from "react";

interface Notification {
  id: string;
  subject: string;
  content: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
        }
      } catch { /* API inaccessible */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
  }

  const hasUnread = notifications.some((n) => !n.read);

  if (loading) {
    return <div className="max-w-container-max mx-auto w-full animate-pulse space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-surface-variant" />)}</div>;
  }

  return (
    <div className="max-w-container-max mx-auto w-full">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="font-headline-md text-primary mb-2">Notifications</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Consultez vos notifications et alertes.</p>
        </div>
        {hasUnread && (
          <button onClick={markAllAsRead} className="font-label-caps text-label-caps text-primary hover:text-secondary transition-colors underline">
            Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-center text-on-surface-variant py-20">Aucune notification.</p>
      ) : (
        <div className="flex flex-col border border-outline-variant bg-surface-container-lowest">
          {notifications.map((notif, idx) => (
            <div key={notif.id} className={`px-6 py-5 flex items-start gap-4 ${idx < notifications.length - 1 ? "border-b border-outline-variant/50" : ""} ${!notif.read ? "bg-surface-container-low" : ""}`}>
              <span className={`material-symbols-outlined mt-0.5 ${notif.type === "PAYMENT" ? "text-secondary" : notif.type === "VALIDATION" ? "text-primary" : "text-on-surface-variant"}`}>
                {notif.type === "PAYMENT" ? "payments" : notif.type === "VALIDATION" ? "verified" : "info"}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-body-md text-primary font-medium">{notif.subject}</h4>
                  {!notif.read && <span className="w-2 h-2 bg-secondary rounded-full" />}
                </div>
                <p className="font-body-sm text-on-surface-variant mt-1">{notif.content}</p>
                <span className="font-label-caps text-label-caps text-outline mt-2 block">{new Date(notif.createdAt).toLocaleDateString("fr")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
