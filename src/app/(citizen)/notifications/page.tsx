"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  UserCheck,
  CheckCheck,
  Sparkles,
  Inbox,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "unread" | "action";

export default function NotificationsPage() {
  const {
    notifications: storeNotifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    clearAllNotifications,
    t,
  } = useSevaSaarthi();

  const [filter, setFilter] = useState<FilterTab>("all");
  const [apiNotifications, setApiNotifications] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchApiNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.notifications) && isMounted) {
            setApiNotifications(data.notifications);
          }
        }
      } catch (e) {
        // Fallback to store
      }
    };

    fetchApiNotifications();
    return () => {
      isMounted = false;
    };
  }, []);

  const allNotifications = React.useMemo(() => {
    const list = [...storeNotifications];

    apiNotifications.forEach((apiN) => {
      const exists = list.some((n) => n.id === apiN.id);
      if (!exists) {
        list.push({
          id: apiN.id,
          title: apiN.title,
          desc: apiN.body || apiN.desc || "",
          time: apiN.created_at
            ? new Date(apiN.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Recent",
          category:
            apiN.severity === "ACTION_REQUIRED"
              ? "PROFILE"
              : apiN.severity === "SUCCESS"
              ? "DOCUMENT"
              : "SECURITY",
          href: apiN.action_url || "/dashboard",
          read: !!apiN.read_at,
        });
      }
    });

    return list;
  }, [storeNotifications, apiNotifications]);

  const filteredNotifications = React.useMemo(() => {
    if (filter === "unread") {
      return allNotifications.filter((n) => !n.read);
    }
    if (filter === "action") {
      return allNotifications.filter(
        (n) =>
          n.category === "PROFILE" ||
          n.category === "READINESS" ||
          n.title.toLowerCase().includes("action") ||
          n.title.toLowerCase().includes("incomplete")
      );
    }
    return allNotifications;
  }, [allNotifications, filter]);

  const handleMarkAllRead = () => {
    clearAllNotifications();
    toast.success("All notifications marked as read");
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "DOCUMENT":
        return {
          label: "Document Vault",
          icon: FileText,
          badgeStyle: "bg-blue-50 text-blue-700 border-blue-200/80",
          iconBg: "bg-blue-100 text-blue-600",
        };
      case "PROFILE":
        return {
          label: "Profile Update",
          icon: UserCheck,
          badgeStyle: "bg-amber-50 text-amber-700 border-amber-200/80",
          iconBg: "bg-amber-100 text-amber-600",
        };
      case "READINESS":
        return {
          label: "Scheme Readiness",
          icon: Sparkles,
          badgeStyle: "bg-purple-50 text-purple-700 border-purple-200/80",
          iconBg: "bg-purple-100 text-purple-600",
        };
      case "SECURITY":
        return {
          label: "Account & Security",
          icon: ShieldCheck,
          badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
          iconBg: "bg-emerald-100 text-emerald-600",
        };
      default:
        return {
          label: "System Alert",
          icon: Info,
          badgeStyle: "bg-slate-50 text-slate-700 border-slate-200/80",
          iconBg: "bg-slate-100 text-slate-600",
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t("notifications_center", "Notifications Center")}</h1>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-100 text-rose-700 rounded-full">
                    {unreadNotificationsCount} unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {t("notifications_desc", "Real-time updates on application status changes, officer actions, and system verification results.")}
              </p>
            </div>
          </div>

          {unreadNotificationsCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              filter === "all"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            )}
          >
            All ({allNotifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              filter === "unread"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            )}
          >
            <span>Unread</span>
            {unreadNotificationsCount > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.2 text-[10px] font-bold rounded-full",
                  filter === "unread" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
                )}
              >
                {unreadNotificationsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("action")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              filter === "action"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            )}
          >
            Action Required
          </button>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3 shadow-2xs">
            <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {filter === "unread" ? "All caught up!" : "No notifications found"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filter === "unread"
                ? "You have no unread notifications. New scheme and document status alerts will appear here."
                : "We'll notify you here as soon as there are updates on your application progress or document extractions."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((n) => {
              const meta = getCategoryBadge(n.category);
              const CategoryIcon = meta.icon;

              return (
                <div
                  key={n.id}
                  className={cn(
                    "group relative bg-white p-4 sm:p-5 rounded-2xl border transition-all duration-150 shadow-2xs",
                    n.read
                      ? "border-slate-200/60 opacity-85 hover:opacity-100"
                      : "border-blue-200/90 ring-1 ring-blue-100/70 shadow-xs"
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Category Icon */}
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        meta.iconBg
                      )}
                    >
                      <CategoryIcon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              "px-2 py-0.5 text-[10px] font-bold rounded-md border",
                              meta.badgeStyle
                            )}
                          >
                            {meta.label}
                          </span>
                          <h4
                            className={cn(
                              "text-xs font-bold truncate",
                              n.read ? "text-slate-800" : "text-slate-900 font-extrabold"
                            )}
                          >
                            {n.title}
                          </h4>
                        </div>

                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {n.time}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {n.desc}
                      </p>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
                        {n.href && (
                          <Link
                            href={n.href}
                            onClick={() => {
                              if (!n.read) markNotificationAsRead(n.id);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <span>Open Details</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        )}

                        {!n.read && (
                          <button
                            onClick={() => markNotificationAsRead(n.id)}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Unread indicator dot */}
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" />
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
