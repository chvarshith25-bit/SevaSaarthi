"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  CheckSquare,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  Radio,
  GitPullRequest,
  Workflow,
  History,
  BarChart3,
  Clock,
  FolderGit2,
  Settings,
  Headphones,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  LogOut,
  User,
  Shield,
  ExternalLink,
  Building,
} from "lucide-react";
import { useGov } from "@/lib/store/gov-store";
import { toast } from "sonner";
import { StateEmblem } from "@/components/ui/StateEmblem";

interface GovernmentShellProps {
  children: React.ReactNode;
}

export function GovernmentShell({ children }: GovernmentShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/login" || pathname === "/government/login" || pathname === "/gov/login";

  if (isLoginPage) {
    return <div className="min-h-screen bg-[#0A1128]">{children}</div>;
  }

  const { currentUser, stats, applications } = useGov();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut for search: Ctrl + K or Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/gov/auth/logout", { method: "POST" });
      toast.info("Signed out from Government Operations Console");
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Application Queue", href: "/applications", icon: Layers, badge: stats.newApps, badgeColor: "bg-blue-600 text-white" },
    { label: "My Assignments", href: "/my-queue", icon: CheckSquare, badge: stats.officerReview, badgeColor: "bg-blue-600 text-white" },
    { label: "Review & Approve", href: "/applications?tab=officer_review", icon: ShieldCheck },
    { label: "Returned Applications", href: "/applications?tab=returned", icon: RotateCcw, badge: stats.returned, badgeColor: "bg-slate-800 text-slate-300" },
    { label: "Exceptions & Conflicts", href: "/exceptions", icon: AlertTriangle, badge: stats.exceptions, badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/30" },
    { label: "Interoperability Hub", href: "/interoperability", icon: Radio },
    { label: "Data Mapper", href: "/data-mapper", icon: GitPullRequest },
    { label: "Workflows", href: "/workflows", icon: Workflow },
    { label: "Audit Logs", href: "/audit", icon: History },
    { label: "Reports & Analytics", href: "/monitoring", icon: BarChart3 },
    { label: "SLA Monitoring", href: "/monitoring?tab=sla", icon: Clock },
    { label: "Department Resources", href: "/settings?tab=resources", icon: FolderGit2 },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  // Quick search filter for matching applications
  const searchResults = searchQuery.trim()
    ? applications.filter(
        (a) =>
          a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.applicantPhone.includes(searchQuery)
      )
    : [];

  const SidebarContent = (
    <div className="flex flex-col justify-between h-full p-4 select-none">
      {/* Top Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2 py-1">
          {/* Ashoka Lion / State Emblem of India */}
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
            <StateEmblem size={24} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white leading-tight">
                FORM<span className="text-amber-400">ly</span>
              </span>
            </div>
            <div className="text-[11px] font-medium text-slate-400 leading-none mt-0.5">
              Government Platform
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard" || pathname === "/" || pathname === "/gov" || pathname === "/government"
                : pathname === item.href.split("?")[0] ||
                  pathname === item.href ||
                  (item.href === "/applications" && (pathname.startsWith("/applications") || pathname.startsWith("/gov/workspace") || pathname.startsWith("/government/applications")));

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                      isActive
                        ? "bg-white/20 text-white"
                        : item.badgeColor || "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Support Card & Government of India Emblem Footer */}
      <div className="pt-4 border-t border-slate-800/80 space-y-4">
        {/* Help Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3 text-slate-300">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Headphones className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs font-bold text-white leading-tight">Need Help?</div>
            <div className="text-[10px] text-slate-400 truncate">System support & guides</div>
          </div>
        </div>

        {/* Official Sovereign Emblem Footer */}
        <div className="flex items-center gap-2.5 px-2 py-1 text-slate-400">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-xs shrink-0 text-amber-300">
            <StateEmblem size={18} className="text-amber-400/90" />
          </div>
          <div className="text-[10px] leading-tight text-slate-400">
            <div className="font-semibold text-slate-300">Government of India</div>
            <div>Income Tax Department (CBDT)</div>
            <div className="text-[9px] text-slate-500">Digital Governance for a better India</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* 1. Left Fixed Sidebar for Desktop (1024px+) */}
      <aside className="hidden lg:flex w-64 bg-[#0A1128] text-white shrink-0 border-r border-slate-800/80 flex-col justify-between sticky top-0 h-screen overflow-y-auto no-scrollbar z-40">
        {SidebarContent}
      </aside>

      {/* 2. Mobile Drawer for Small Screens */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#0A1128] text-white h-full z-10 flex flex-col shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-slate-800">
              <span className="font-black text-white text-base">FORMly Gov</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{SidebarContent}</div>
          </div>
        </div>
      )}

      {/* 3. Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          {/* Left: Mobile hamburger & Search Bar */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-2xl">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar */}
            <div className="relative flex-1">
              <div
                onClick={() => {
                  setSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs text-slate-400 cursor-pointer transition-all w-full max-w-lg"
              >
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate hidden sm:inline">
                  Search applications, citizens, services, or documents...
                </span>
                <span className="truncate sm:hidden">Search cases...</span>
                <span className="ml-auto text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-2xs shrink-0">
                  Ctrl + K
                </span>
              </div>
            </div>
          </div>

          {/* Right: Notifications & Officer Profile Menu */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Notifications Bell */}
            <button
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                19
              </span>
            </button>

            {/* Officer Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
                  SS
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {currentUser.roleTitle}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu (No Citizen Link, No Role Switcher) */}
              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    {/* User Identity Header */}
                    <div className="p-3 border-b border-slate-100">
                      <div className="font-bold text-xs text-slate-900">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Desk ID: <span className="text-blue-700 font-semibold">{currentUser.id}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {currentUser.office}
                      </div>
                    </div>

                    {/* Operational Menu Items */}
                    <div className="py-1 space-y-0.5 text-xs">
                      <Link
                        href="/my-queue"
                        onClick={() => setProfileMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>My Assigned Work</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-slate-400" />
                        <span>Security & Access Logs</span>
                      </Link>
                      <Link
                        href="/settings?tab=resources"
                        onClick={() => setProfileMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Building className="w-4 h-4 text-slate-400" />
                        <span>Regional Jurisdiction RPC</span>
                      </Link>
                    </div>

                    {/* Sign Out Action */}
                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleSignOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out of Government Operations</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Global Search Modal Overlay */}
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
            <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs" onClick={() => setSearchOpen(false)} />
            <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95">
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search application ID (e.g. PAN-2026-0001), citizen, phone, or stage..."
                  className="w-full text-sm bg-transparent outline-none text-slate-900 placeholder-slate-400"
                  autoFocus
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg text-xs"
                >
                  ESC
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Matching Applications ({searchResults.length})
                    </div>
                    {searchResults.map((app) => (
                      <Link
                        key={app.id}
                        href={`/applications/${app.id}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/60 border border-transparent hover:border-blue-100 transition-all group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-700 text-xs">{app.id}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {app.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {app.applicantName} • {app.serviceName}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                          Open Workspace →
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No applications or citizens found matching &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  <div className="p-4 text-xs text-slate-400 space-y-2">
                    <div className="font-bold text-slate-600">Quick Navigation Suggestions:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/applications/PAN-2026-0001"
                        onClick={() => setSearchOpen(false)}
                        className="p-2.5 bg-slate-50 hover:bg-blue-50 rounded-xl font-mono text-blue-700 font-bold"
                      >
                        PAN-2026-0001 (Sai Sankeerth)
                      </Link>
                      <Link
                        href="/applications/PAN-2026-0002"
                        onClick={() => setSearchOpen(false)}
                        className="p-2.5 bg-slate-50 hover:bg-blue-50 rounded-xl font-mono text-blue-700 font-bold"
                      >
                        PAN-2026-0002 (Anjali Sharma)
                      </Link>
                      <Link
                        href="/applications/PAN-2026-0003"
                        onClick={() => setSearchOpen(false)}
                        className="p-2.5 bg-slate-50 hover:bg-blue-50 rounded-xl font-mono text-blue-700 font-bold"
                      >
                        PAN-2026-0003 (Rahul Verma)
                      </Link>
                      <Link
                        href="/applications/PAN-2026-0004"
                        onClick={() => setSearchOpen(false)}
                        className="p-2.5 bg-slate-50 hover:bg-blue-50 rounded-xl font-mono text-blue-700 font-bold"
                      >
                        PAN-2026-0004 (Priya Patel)
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
