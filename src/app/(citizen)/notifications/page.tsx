"use client";

import React, { useEffect, useState } from "react";
import { Bell, CheckCircle2, AlertTriangle, Info, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        );
      }
    } catch (err) {
      toast.error("Failed to mark as read");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Notifications</h1>
              <p className="text-xs text-slate-500 font-medium">Real-time updates on your application status</p>
            </div>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No notifications yet</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              We'll notify you here as soon as there's an update on your application progress.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const isRead = !!n.read_at;
              const severityIcon =
                n.severity === "SUCCESS" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                n.severity === "ACTION_REQUIRED" ? <AlertTriangle className="w-4 h-4 text-amber-600" /> :
                n.severity === "ERROR" ? <AlertTriangle className="w-4 h-4 text-rose-600" /> :
                <Info className="w-4 h-4 text-blue-600" />;

              return (
                <div
                  key={n.id}
                  className={`group relative bg-white p-4 sm:p-5 rounded-2xl border transition-all ${
                    isRead ? "border-slate-100 opacity-75" : "border-indigo-100 shadow-sm ring-1 ring-indigo-50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-1">{severityIcon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-bold truncate ${isRead ? "text-slate-700" : "text-slate-900"}`}>
                          {n.title}
                        </h4>
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(n.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {n.body}
                      </p>
                      <div className="flex items-center justify-between">
                        {!isRead && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
                          >
                            Mark as Read
                          </button>
                        )}
                        {n.action_url && (
                          <a
                            href={n.action_url}
                            className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                          >
                            View Application <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    {!isRead && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-600 rounded-full" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
