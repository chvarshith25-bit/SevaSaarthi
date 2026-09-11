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
  ArrowRight,
  Bot,
  Check,
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
  const { stats, unreadNotificationsCount } = useSevaSaarthi();

  const navItems: NavItem[] = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Applications", href: "/applications", icon: FileCheck2, badge: 3, badgeColor: "bg-blue-100 text-blue-700" },
    { label: "Apply for a Service", href: "/checklist", icon: FilePlus2 },
    { label: "Discover Services", href: "/discover", icon: Compass },
    { label: "Documents", href: "/vault", icon: FolderOpen },
    { label: "My Profile", href: "/profile", icon: User },
    { label: "Tasks & Reminders", href: "/tasks", icon: ListTodo, badge: 5, badgeColor: "bg-rose-100 text-rose-700" },
    { label: "Notifications", href: "/notifications", icon: Bell, badge: 4, badgeColor: "bg-rose-100 text-rose-700" },
    { label: "Help & Support", href: "/help", icon: HelpCircle },
  ];

  return (
    <aside className="hidden md:flex md:w-64 bg-white border-r border-slate-100 flex-col justify-between h-screen sticky top-0 px-4 py-5 select-none z-30 shrink-0 overflow-y-auto">
      <div>
        {/* Brand Logo & Tagline */}
        <Link href="/dashboard" className="flex items-center gap-3 px-2 mb-6 group">
          <LotusLogo className="w-9 h-9 shrink-0 group-hover:scale-105 transition-transform" />
          <div className="min-w-0">
            <div className="text-lg font-black tracking-tight text-slate-900 leading-tight">
              Seva Saarthi
            </div>
            <div className="text-[11px] font-medium text-slate-400 leading-tight">
              One Form. A Smarter India.
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="space-y-1">
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
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-150",
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[11px] font-bold rounded-full shrink-0",
                      isActive
                        ? "bg-white/20 text-white"
                        : item.badgeColor || "bg-slate-100 text-slate-600"
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

      {/* Bottom Section: Ask Saarthi AI & Digital India Footer */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        {/* Ask Saarthi AI Card */}
        <div className="bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-sky-50/50 border border-blue-100/90 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Ask Saarthi AI</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Get instant guidance on forms, documents and application status.
          </p>
          <Link
            href="/help"
            className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 text-blue-700 font-bold text-[11px] rounded-xl border border-blue-200/80 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <span>Start Chatting</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Digital India Flag Footer */}
        <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">🇮🇳</span>
            <div className="leading-tight">
              <div className="font-bold text-slate-700">A Digital India Initiative</div>
              <div>For a Brighter Tomorrow</div>
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

  const navItems: NavItem[] = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Applications", href: "/applications", icon: FileCheck2, badge: 3, badgeColor: "bg-blue-100 text-blue-700" },
    { label: "Apply for a Service", href: "/checklist", icon: FilePlus2 },
    { label: "Discover Services", href: "/discover", icon: Compass },
    { label: "Documents", href: "/vault", icon: FolderOpen },
    { label: "My Profile", href: "/profile", icon: User },
    { label: "Tasks & Reminders", href: "/tasks", icon: ListTodo, badge: 5, badgeColor: "bg-rose-100 text-rose-700" },
    { label: "Notifications", href: "/notifications", icon: Bell, badge: 4, badgeColor: "bg-rose-100 text-rose-700" },
    { label: "Help & Support", href: "/help", icon: HelpCircle },
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
          "fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl z-[110] flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out md:hidden overflow-y-auto select-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div>
          <div className="flex items-center gap-3 px-2 mb-6">
            <LotusLogo className="w-8 h-8 shrink-0" />
            <div>
              <div className="text-base font-black tracking-tight text-slate-900">Seva Saarthi</div>
              <div className="text-[10px] font-medium text-slate-400">One Form. A Smarter India.</div>
            </div>
          </div>

          <nav className="space-y-1">
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
                    "flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition-all",
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full",
                        isActive ? "bg-white/20 text-white" : item.badgeColor || "bg-slate-100 text-slate-600"
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

        <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
          <span>🇮🇳 A Digital India Initiative</span>
          <span>v2.0.0</span>
        </div>
      </aside>
    </>
  );
}
