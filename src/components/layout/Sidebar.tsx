"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck2,
  FilePlus2,
  Compass,
  FolderOpen,
  User,
  ListTodo,
  Bell,
  HelpCircle,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { LotusLogo } from "@/components/ui/LotusLogo";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const { stats, unreadNotificationsCount, easyMode, t } = useSevaSaarthi();

  const navItems: NavItem[] = [
    { label: t("home"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("apply_for_service"), href: "/checklist", icon: FilePlus2 },
    { label: t("discover_services"), href: "/discover", icon: Compass },
    { 
      label: t("my_applications"), 
      href: "/applications", 
      icon: FileCheck2, 
      badge: stats.activeApplications > 0 ? stats.activeApplications : undefined, 
      badgeColor: "bg-blue-100 text-blue-700" 
    },
    { label: t("documents"), href: "/vault", icon: FolderOpen },
    { 
      label: t("tasks_reminders"), 
      href: "/tasks", 
      icon: ListTodo, 
      badge: stats.pendingTasks > 0 ? stats.pendingTasks : undefined, 
      badgeColor: "bg-amber-100 text-amber-700" 
    },
    { 
      label: t("notifications"), 
      href: "/notifications", 
      icon: Bell, 
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined, 
      badgeColor: "bg-rose-100 text-rose-700" 
    },
    { label: t("my_profile"), href: "/profile", icon: User },
    { label: t("help_support"), href: "/help", icon: HelpCircle },
  ];

  return (
    <aside className={cn(
      "hidden md:flex bg-white border-r border-slate-200 flex-col justify-between h-screen sticky top-0 px-4 py-5 select-none z-30 shrink-0 overflow-y-auto",
      easyMode ? "w-72" : "w-64"
    )}>
      <div>
        {/* Brand Logo & Tagline */}
        <Link href="/dashboard" className="flex items-center gap-3 px-2 mb-6 group">
          <LotusLogo className={cn("shrink-0 group-hover:scale-105 transition-transform", easyMode ? "w-11 h-11" : "w-9 h-9")} />
          <div className="min-w-0">
            <div className={cn("font-black tracking-tight text-slate-900 leading-tight", easyMode ? "text-xl" : "text-lg")}>
              {t("app_title")}
            </div>
            <div className={cn("font-medium text-slate-500 leading-tight", easyMode ? "text-xs mt-0.5" : "text-[11px]")}>
              {t("app_subtitle")}
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === "/dashboard" && pathname === "/") ||
              (item.href === "/applications" && pathname.startsWith("/track")) ||
              (item.href === "/vault" && pathname === "/documents");

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-xl font-bold transition-all duration-150 min-h-[48px]",
                  easyMode ? "px-4 py-3 text-base" : "px-3.5 py-2.5 text-xs",
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon className={cn("shrink-0", easyMode ? "w-5 h-5" : "w-4 h-4", isActive ? "text-white" : "text-slate-500")} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "font-bold rounded-full shrink-0",
                      easyMode ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]",
                      isActive
                        ? "bg-white/25 text-white"
                        : item.badgeColor || "bg-slate-100 text-slate-700"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Digital India Footer */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">🇮🇳</span>
            <div className="leading-tight">
              <div className="font-bold text-slate-800">A Digital India Initiative</div>
              <div className="text-[10px] text-slate-500">For Every Indian Citizen</div>
            </div>
          </div>
          <span className="font-mono text-slate-400 text-[10px]">v2.0.0</span>
        </div>
      </div>
    </aside>
  );
}

export function MobileNavDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { stats, unreadNotificationsCount, easyMode, t } = useSevaSaarthi();

  const navItems: NavItem[] = [
    { label: t("home"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("apply_for_service"), href: "/checklist", icon: FilePlus2 },
    { label: t("discover_services"), href: "/discover", icon: Compass },
    { 
      label: t("my_applications"), 
      href: "/applications", 
      icon: FileCheck2, 
      badge: stats.activeApplications > 0 ? stats.activeApplications : undefined, 
      badgeColor: "bg-blue-100 text-blue-700" 
    },
    { label: t("documents"), href: "/vault", icon: FolderOpen },
    { 
      label: t("tasks_reminders"), 
      href: "/tasks", 
      icon: ListTodo, 
      badge: stats.pendingTasks > 0 ? stats.pendingTasks : undefined, 
      badgeColor: "bg-amber-100 text-amber-700" 
    },
    { 
      label: t("notifications"), 
      href: "/notifications", 
      icon: Bell, 
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined, 
      badgeColor: "bg-rose-100 text-rose-700" 
    },
    { label: t("my_profile"), href: "/profile", icon: User },
    { label: t("help_support"), href: "/help", icon: HelpCircle },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-80 max-w-[88vw] bg-white shadow-2xl z-[110] flex flex-col justify-between p-5 transition-transform duration-300 ease-in-out md:hidden overflow-y-auto select-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <LotusLogo className="w-9 h-9 shrink-0" />
              <div>
                <div className="text-base font-black tracking-tight text-slate-900">{t("app_title")}</div>
                <div className="text-[11px] font-medium text-slate-500">{t("app_subtitle")}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === "/dashboard" && pathname === "/") ||
                (item.href === "/applications" && pathname.startsWith("/track"));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all min-h-[50px]",
                    easyMode ? "text-base" : "text-sm",
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-500")} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        "px-2.5 py-0.5 font-bold rounded-full text-xs",
                        isActive ? "bg-white/25 text-white" : item.badgeColor || "bg-slate-100 text-slate-700"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🇮🇳</span>
            <span className="font-semibold text-slate-700">Digital India Initiative</span>
          </div>
          <span className="font-mono text-slate-400 text-[10px]">v2.0.0</span>
        </div>
      </aside>
    </>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { easyMode, t, stats } = useSevaSaarthi();

  const items = [
    { label: t("home"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("apply_for_service"), href: "/checklist", icon: FilePlus2 },
    { 
      label: t("my_applications"), 
      href: "/applications", 
      icon: FileCheck2,
      badge: stats.activeApplications > 0 ? stats.activeApplications : undefined,
    },
    { label: t("documents"), href: "/vault", icon: FolderOpen },
    { label: t("my_profile"), href: "/profile", icon: User },
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href === "/dashboard" && pathname === "/") ||
          (item.href === "/applications" && pathname.startsWith("/track")) ||
          (item.href === "/vault" && pathname === "/documents");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all min-h-[50px] relative",
              isActive ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <div className="relative">
              <Icon className={cn(easyMode ? "w-6 h-6" : "w-5 h-5", isActive ? "text-blue-600 stroke-[2.5]" : "text-slate-500")} />
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className={cn(
              "truncate max-w-[70px] text-center mt-0.5",
              easyMode ? "text-xs font-bold" : "text-[10px] font-medium",
              isActive ? "text-blue-600 font-bold" : "text-slate-600"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
