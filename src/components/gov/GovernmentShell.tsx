"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  ShieldCheck,
  AlertTriangle,
  History,
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
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
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
      router.push("/government/login");
    } catch {
      router.push("/government/login");
    }
  };

  // Phase 9.0.2: Strictly 5 Primary Navigation Items for Normal Officers
  const primaryNavItems = [
    {
      label: "Dashboard",
      href: "/government/dashboard",
      icon: LayoutDashboard,
      badge: null,
      badgeColor: "",
    },
    {
      label: "Applications",
      href: "/government/applications",
      icon: Layers,
      badge: stats.total || null,
      badgeColor: "bg-blue-600 text-white",
    },
    {
      label: "Review",
      href: "/government/applications?tab=needs_action",
      icon: ShieldCheck,
      badge: stats.officerReview || null,
      badgeColor: "bg-indigo-600 text-white",
    },
    {
      label: "Exceptions",
      href: "/government/exceptions",
      icon: AlertTriangle,
      badge: stats.exceptions || null,
      badgeColor: "bg-amber-500 text-slate-900 font-bold",
    },
    {
      label: "Audit",
      href: "/government/audit",
      icon: History,
      badge: null,
      badgeColor: "",
    },
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

  const isAdminUser =
    currentUser.role === "SYS_ADMIN" ||
    currentUser.role === "DEPT_ADMIN" ||
    (currentUser.role as any) === "ADMIN";

  const SidebarContent = (
    <div className="flex flex-col justify-between h-full p-4 select-none bg-[#0F172A] text-slate-200">
      {/* Top Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2 py-1.5 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
            <StateEmblem size={24} className="text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white leading-tight">
                SARKAR <span className="text-amber-400">SEVA</span>
              </span>
            </div>
            <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase leading-none mt-0.5">
              Government Officer Operations Portal
            </div>
          </div>
        </div>

        {/* 5 Primary Navigation Items */}
        <nav className="space-y-1.5" aria-label="Government Primary Navigation">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isTabMatch = item.href.includes("?tab=") 
              ? (typeof window !== "undefined" && window.location.search.includes(item.href.split("?")[1]))
              : false;
            
            const isActive =
              item.href === "/government/dashboard"
                ? pathname === "/government/dashboard" || pathname === "/government" || pathname === "/gov" || pathname === "/dashboard"
                : item.href.includes("?tab=assigned")
                ? pathname.includes("/applications") && isTabMatch
                : item.href === "/government/applications"
                ? pathname.startsWith("/government/applications") && !isTabMatch
                : pathname === item.href || pathname.startsWith(item.href);

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
                {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-bold shrink-0 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer & Role-Gated Administration Link */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        {/* Only Visible for ADMIN / SUPERVISOR roles (Product Rule: Normal officer must never see admin tools) */}
        {isAdminUser && (
          <Link
            href="/government/admin"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              pathname.startsWith("/government/admin")
                ? "bg-indigo-950/80 border border-indigo-500/30 text-indigo-200"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Administration</span>
            </div>
            <ChevronRight className="w-3 h-3 text-slate-500" />
          </Link>
        )}

        {/* Officer Card */}
        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentUser.department || "Income Tax Department"}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign Out"
            aria-label="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900">
      {/* Desktop Sidebar (Fixed 260px) */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 z-40 bg-[#0F172A] border-r border-slate-800">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0F172A] border-r border-slate-800 shadow-2xl">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Search Button */}
            <button
              onClick={() => {
                setSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="sm:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Global Search Button / Trigger */}
            <button
              onClick={() => {
                setSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-medium transition-all w-72 lg:w-96 cursor-pointer"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="flex-1 text-left">Search applications, citizens, services...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded-md text-slate-500 shadow-2xs">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right Profile & Notifications Header Actions */}
          <div className="flex items-center gap-3">
            {/* Jurisdiction Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold text-slate-800">{currentUser.department}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">{currentUser.office || "District Operations"}</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative cursor-pointer"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {stats.exceptions > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            </div>

            {/* Officer Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-left cursor-pointer"
                aria-label="Officer Profile Menu"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-xs font-semibold text-slate-800">
                  {currentUser.name}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-800">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                    <div className="text-[10px] font-mono text-blue-600 mt-1">ID: {currentUser.id}</div>
                  </div>
                  <Link
                    href="/government/dashboard"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400" />
                    <span>Officer Dashboard</span>
                  </Link>
                  {isAdminUser && (
                    <Link
                      href="/government/admin"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                      <span>Administration</span>
                    </Link>
                  )}
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Search Dialog Modal */}
        {searchOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
            onClick={() => setSearchOpen(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchResults.length > 0) {
                    setSearchOpen(false);
                    router.push(`/government/applications/${searchResults[0].id}`);
                  }
                }}
                className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50"
              >
                <Search className="w-5 h-5 text-blue-600 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Application ID (e.g. PAN-2026-0001), citizen name, service..."
                  className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-hidden bg-transparent"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="px-2 py-1 text-xs font-bold text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 cursor-pointer"
                >
                  ESC
                </button>
              </form>

              <div className="p-3 max-h-96 overflow-y-auto">
                {searchQuery.trim() === "" ? (
                  <div className="space-y-3 p-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      Quick Officer Navigation
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Link
                        href="/government/applications"
                        onClick={() => setSearchOpen(false)}
                        className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 rounded-xl flex items-center gap-3 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                            All Applications
                          </div>
                          <div className="text-[10px] text-slate-500">View complete intake ledger</div>
                        </div>
                      </Link>

                      <Link
                        href="/government/applications?tab=needs_action"
                        onClick={() => setSearchOpen(false)}
                        className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 rounded-xl flex items-center gap-3 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                            Review Work Desk
                          </div>
                          <div className="text-[10px] text-slate-500">Cases ready for officer decision</div>
                        </div>
                      </Link>

                      <Link
                        href="/government/exceptions"
                        onClick={() => setSearchOpen(false)}
                        className="p-3 bg-slate-50 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-200 rounded-xl flex items-center gap-3 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-amber-800">
                            Exceptions & Conflicts
                          </div>
                          <div className="text-[10px] text-slate-500">Demographic & document issues</div>
                        </div>
                      </Link>

                      <Link
                        href="/government/audit"
                        onClick={() => setSearchOpen(false)}
                        className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 rounded-xl flex items-center gap-3 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          <History className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">
                            Statutory Audit Ledger
                          </div>
                          <div className="text-[10px] text-slate-500">Cryptographic event history</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-700">No matching applications found</div>
                    <div className="text-slate-400 mt-0.5">Try searching with a valid Application ID or citizen name.</div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1 pb-0.5">
                      Matching Cases ({searchResults.length}) — Press Enter to open first
                    </div>
                    {searchResults.map((app) => (
                      <Link
                        key={app.id}
                        href={`/government/applications/${app.id}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/80 border border-slate-100 hover:border-blue-200 transition-all group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-xs text-blue-600 group-hover:text-blue-800">
                              {app.id}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {app.applicantName}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {app.serviceName} • {app.department || "Income Tax Dept"}
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              app.status === "COMPLETED" || (app.status as any) === "APPROVED"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : app.status === "PROCESSING" || (app.status as any) === "ACTION_REQUIRED"
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : app.status === "RETURNED_FOR_CORRECTION" || (app.status as any) === "RETURNED"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : app.status === "REJECTED"
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            {app.status}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
