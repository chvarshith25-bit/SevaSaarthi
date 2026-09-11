"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { Sidebar, MobileNavDrawer } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoadingAuth } = useSevaSaarthi();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isPortalPage = pathname.startsWith("/portal");
  const isGovPage = pathname.startsWith("/gov");
  const isTrackPage = pathname.startsWith("/track");

  // Close mobile navigation drawer whenever route changes
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  // Route protection: Redirect unauthenticated users to /login
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated && !isAuthPage && !isPortalPage && !isGovPage && !isTrackPage) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoadingAuth, isAuthPage, isPortalPage, isGovPage, isTrackPage, router]);

  // If on login/signup, portal, gov, or track pages, render clean layout without citizen sidebar/header
  if (isAuthPage || isPortalPage || isGovPage || isTrackPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  // Show loading spinner while determining authentication state
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Checking secure session...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and redirecting, render minimal placeholder
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated full dashboard shell
  return (
    <div className="min-h-screen flex bg-slate-50/50 w-full max-w-full overflow-x-hidden relative">
      {/* Global Demo Mode Banner */}
      <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
        <div className="bg-amber-500 text-white text-center py-1 px-3 text-[10px] font-black uppercase tracking-widest shadow-sm">
          Simulation Environment • SIH Demo Mode • Government APIs Simulated
        </div>
      </div>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden pt-6">
        <Header onOpenMobileNav={() => setIsMobileNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto box-border overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Drawer placed at root of shell for guaranteed stacking above all components */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
    </div>
  );
}
