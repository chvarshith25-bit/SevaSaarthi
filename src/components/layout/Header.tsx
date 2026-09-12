"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  CheckCircle,
  Menu,
  Globe,
  Check,
  X,
  Sparkles,
  FileText,
  Compass,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  GraduationCap,
  Home,
  Bot,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { LotusLogo } from "@/components/ui/LotusLogo";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenMobileNav?: () => void;
}

const LANGUAGES = [
  { code: "EN", name: "English", label: "English" },
  { code: "HI", name: "Hindi", label: "हिन्दी" },
  { code: "TE", name: "Telugu", label: "తెలుగు" },
  { code: "TA", name: "Tamil", label: "தமிழ்" },
  { code: "MR", name: "Marathi", label: "मराठी" },
  { code: "KN", name: "Kannada", label: "ಕನ್ನಡ" },
];

const QUICK_SEARCH_ITEMS = [
  { id: "scheme_pan", title: "Instant e-PAN Card Application", category: "Identity & Tax", type: "scheme", href: "/discover?q=pan", icon: CreditCard },
  { id: "scheme_nsp", title: "Post-Matric Scholarship (NSP)", category: "Scholarships", type: "scheme", href: "/discover?q=scholarship", icon: GraduationCap },
  { id: "scheme_pmay", title: "Pradhan Mantri Awas Yojana (PMAY)", category: "Housing", type: "scheme", href: "/discover?q=pmay", icon: Home },
  { id: "scheme_abha", title: "Ayushman Bharat Health Card (ABHA)", category: "Healthcare", type: "scheme", href: "/discover?q=ayushman", icon: ShieldCheck },
  { id: "scheme_dl", title: "Driving License / Sarathi Portal", category: "Transport", type: "scheme", href: "/discover?q=driving", icon: Compass },
  { id: "scheme_inc", title: "Income & Domicile Certificate", category: "e-District", type: "scheme", href: "/discover?q=certificate", icon: FileText },
  
  // Vault Documents
  { id: "doc_aadhaar", title: "Aadhaar Card (UIDAI)", category: "Document Vault", type: "document", href: "/vault", icon: FileText },
  { id: "doc_pan", title: "Permanent Account Number (PAN)", category: "Document Vault", type: "document", href: "/vault", icon: FileText },
  { id: "doc_marksheet", title: "10th / 12th Board Marksheet", category: "Document Vault", type: "document", href: "/vault", icon: FileText },
  { id: "doc_income", title: "Annual Income Certificate", category: "Document Vault", type: "document", href: "/vault", icon: FileText },

  // Platform Navigation
  { id: "nav_profile", title: "My Profile (27 Verified Attributes)", category: "Citizen Profile", type: "page", href: "/profile", icon: User },
  { id: "nav_vault", title: "Document Vault & OCR Extractions", category: "Locker", type: "page", href: "/vault", icon: FileText },
  { id: "nav_apply", title: "Apply for a Service (Checklist)", category: "Readiness", type: "page", href: "/checklist", icon: Sparkles },
  { id: "nav_tasks", title: "Tasks & Reminders", category: "Actions", type: "page", href: "/tasks", icon: CheckCircle },
  { id: "nav_ai", title: "Ask Saarthi AI Assistant", category: "Guidance", type: "page", href: "/help", icon: Bot },
];

export function Header({ onOpenMobileNav }: HeaderProps = {}) {
  const router = useRouter();
  const {
    user,
    logout,
    unreadNotificationsCount,
    easyMode,
    toggleEasyMode,
    currentLanguage,
    setLanguage,
    t,
  } = useSevaSaarthi();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Compute initials dynamically
  const getInitials = (name?: string) => {
    if (!name) return "CV";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(user?.name || "Chiluveri Varshith");
  const displayName = user?.name || "Chiluveri Varshith";
  const displayEmail = user?.email || "chiluverivarshithsahs@gmail.com";

  const currentLangObj = LANGUAGES.find((l) => l.code.toLowerCase() === currentLanguage.toLowerCase()) || LANGUAGES[0];

  // Filter search results
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return QUICK_SEARCH_ITEMS.slice(0, 7);
    }
    return QUICK_SEARCH_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Keyboard shortcut Ctrl + K and outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setShowUserMenu(false);
        setShowLangMenu(false);
        setIsSearchOpen(false);
        setShowMobileSearch(false);
        searchInputRef.current?.blur();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearchOpen(false);
    setShowMobileSearch(false);
    if (searchQuery.trim()) {
      router.push(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/discover");
    }
  };

  const handleSelectResult = (href: string) => {
    setIsSearchOpen(false);
    setShowMobileSearch(false);
    router.push(href);
  };

  return (
    <>
      {/* 1. MOBILE TOP HEADER (< 768px) */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            className="w-10 h-10 rounded-xl text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <LotusLogo className="w-7 h-7 shrink-0" />
            <span className="font-black text-slate-900 text-sm tracking-tight truncate">
              Seva Saarthi
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Easy Mode Toggle */}
          <button
            onClick={toggleEasyMode}
            aria-label="Toggle Easy Mode"
            className={cn(
              "px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border",
              easyMode
                ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                : "bg-slate-100 text-slate-700 border-slate-200"
            )}
            title="Toggle Easy Mode (Larger fonts & simple controls)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{easyMode ? "Easy: ON" : "Easy Mode"}</span>
          </button>

          {/* Mobile Language Selector */}
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            aria-label="Select language"
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200 text-xs font-bold"
          >
            {currentLangObj.code}
          </button>

          <Link
            href="/notifications"
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center ring-1 ring-slate-300 cursor-pointer"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* Mobile Language Modal Dropdown */}
      {showLangMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Select Language / భాష</h3>
              </div>
              <button
                onClick={() => setShowLangMenu(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {LANGUAGES.map((lang) => {
                const isSel = currentLanguage.toLowerCase() === lang.code.toLowerCase();
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code.toLowerCase() as any);
                      setShowLangMenu(false);
                    }}
                    className={cn(
                      "p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                      isSel
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                    )}
                  >
                    <div className="text-sm font-bold">{lang.label}</div>
                    <div className={cn("text-[11px]", isSel ? "text-blue-100" : "text-slate-500")}>
                      {lang.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Overlay Input */}
      {showMobileSearch && (
        <div className="md:hidden px-4 py-2 bg-white border-b border-slate-200 z-30 shadow-md">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="What are you looking for? (e.g. Scholarship, PAN)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* 2. DESKTOP HEADER (>= 768px) */}
      <header className="hidden md:flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-white/95 backdrop-blur-md sticky top-0 z-20 gap-4">
        {/* Global Citizen Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-xl">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <button
              type="submit"
              aria-label="Submit search"
              className="w-9 h-9 absolute left-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="What are you looking for? (e.g. Scholarship, Income Certificate, PAN Card...)"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              className="w-full pl-10 pr-24 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium shadow-2xs"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="w-5 h-5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs font-mono select-none">
                Ctrl + K
              </kbd>
            </div>
          </form>

          {/* Interactive Live Search Dropdown */}
          {isSearchOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-[75vh] flex flex-col">
              <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 flex items-center justify-between">
                <span>{searchQuery ? "Search Results" : "Quick Citizen Services & Navigation"}</span>
                <span className="text-[9px] font-normal lowercase">press Enter to view all</span>
              </div>

              <div className="overflow-y-auto p-1.5 space-y-1">
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 space-y-2">
                    <Search className="w-6 h-6 mx-auto text-slate-300" />
                    <p className="text-xs">No direct matches found for &quot;{searchQuery}&quot;</p>
                    <button
                      onClick={() => handleSearchSubmit()}
                      className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Search in All Schemes</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  searchResults.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectResult(item.href)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate transition-colors">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              {item.category}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    );
                  })
                )}
              </div>

              {searchQuery && (
                <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => handleSearchSubmit()}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>Search all schemes for &quot;{searchQuery}&quot;</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Easy Mode Switch Button */}
          <button
            type="button"
            onClick={toggleEasyMode}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border cursor-pointer",
              easyMode
                ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80"
            )}
            title="Toggle Easy Mode: Enlarged text, high readability and simplified guidance"
          >
            <Sparkles className={cn("w-3.5 h-3.5", easyMode ? "text-white" : "text-amber-500")} />
            <span>{easyMode ? "Easy Mode: Active" : "Easy Mode"}</span>
          </button>

          {/* Multilingual Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowUserMenu(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentLangObj.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLangMenu(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3.5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                    Select Language / భాష
                  </div>
                  {LANGUAGES.map((lang) => {
                    const isSelected = currentLanguage.toLowerCase() === lang.code.toLowerCase();
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.code.toLowerCase() as any);
                          setShowLangMenu(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{lang.label}</span>
                          <span className="text-slate-400">({lang.name})</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Notification Bell */}
          <Link
            href="/notifications"
            className="relative p-2.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </Link>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowLangMenu(false);
              }}
              className="flex items-center gap-2.5 p-1.5 pr-3 hover:bg-slate-50 rounded-2xl border border-slate-200/80 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                {initials}
              </div>
              <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                {displayName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900">{displayName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{displayEmail}</div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-400" /> My Profile
                  </Link>
                  <Link
                    href="/vault"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-slate-400" /> My Documents
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
