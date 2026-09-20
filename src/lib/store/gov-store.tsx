"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  GovernmentUser,
  GovernmentRole,
  PanApplicationRecord,
  ExceptionRecord,
  AuditLogRecord,
} from "@/types/government";
import { toast } from "sonner";

import {
  getInitialPanApplications,
  getInitialExceptions,
  getInitialAuditLogs,
} from "@/lib/mock-data/pan-initial-data";

export const GOV_ROLES: Record<GovernmentRole, GovernmentUser> = {
  OFFICER: {
    id: "OFF-PAN-7042",
    name: "Sai Sankeerth",
    email: "sai.sankeerth@incometax.gov.in",
    role: "OFFICER",
    roleTitle: "Department Officer",
    department: "Income Tax Department (CBDT) - PAN Division",
    office: "Regional Processing Cell, Hyderabad",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  DEPT_ADMIN: {
    id: "ADM-PAN-1001",
    name: "Rajesh Sharma",
    email: "rajesh.sharma@incometax.gov.in",
    role: "DEPT_ADMIN",
    roleTitle: "Department Administrator",
    department: "Income Tax Department (CBDT) - Operations Directorate",
    office: "Centralized Processing Center, New Delhi",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  SYS_ADMIN: {
    id: "SYS-ROOT-0099",
    name: "Vikram Rao",
    email: "vikram.rao@negd.gov.in",
    role: "SYS_ADMIN",
    roleTitle: "System Administrator",
    department: "National e-Governance Division (NeGD) / MeitY",
    office: "Interoperability Infrastructure Command, New Delhi",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
};

interface GovContextType {
  currentUser: GovernmentUser;
  applications: PanApplicationRecord[];
  exceptions: ExceptionRecord[];
  auditLogs: AuditLogRecord[];
  stats: {
    total: number;
    newApps: number;
    verificationPending: number;
    officerReview: number;
    returned: number;
    approved: number;
    exceptions: number;
  };
  isLoading: boolean;
  refreshAll: () => Promise<void>;
  resetDemoPipeline: () => Promise<void>;
}

const GovContext = createContext<GovContextType | null>(null);

export function GovProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<GovernmentUser>(GOV_ROLES.OFFICER);
  const [applications, setApplications] = useState<PanApplicationRecord[]>(() => getInitialPanApplications());
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>(() => getInitialExceptions());
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(() => getInitialAuditLogs());
  const [isLoading, setIsLoading] = useState(false);

  const refreshAll = useCallback(async () => {
    try {
      const [userRes, appRes, excRes, audRes] = await Promise.all([
        fetch("/api/gov/me"),
        fetch("/api/gov/applications"),
        fetch("/api/gov/exceptions"),
        fetch("/api/gov/audit"),
      ]);

      const [userData, appData, excData, audData] = await Promise.all([
        userRes.json(),
        appRes.json(),
        excRes.json(),
        audRes.json(),
      ]);

      if (userData?.success && userData.employee) setCurrentUser(userData.employee);
      if (appData?.success && Array.isArray(appData.applications) && appData.applications.length > 0) {
        setApplications(appData.applications);
      }
      if (excData?.success && Array.isArray(excData.exceptions) && excData.exceptions.length > 0) {
        setExceptions(excData.exceptions);
      }
      if (audData?.success && Array.isArray(audData.auditLogs) && audData.auditLogs.length > 0) {
        setAuditLogs(audData.auditLogs);
      }
    } catch (err) {
      console.error("[GovProvider refreshAll error]", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);


  const resetDemoPipeline = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/gov/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("PAN demo pipeline reset to initial configuration");
        await refreshAll();
      } else {
        toast.error("Failed to reset demo pipeline");
      }
    } catch (err) {
      toast.error("Error resetting pipeline");
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamically compute real operational statistics from the single source of truth (Requirement 4 & 7)
  const total = applications.length;
  const newApps = applications.filter(
    (a) => a.stage === "SUBMITTED" || a.status === "ACTION_REQUIRED"
  ).length;
  const verificationPending = applications.filter(
    (a) => a.stage === "VERIFICATION_IN_PROGRESS" || a.stage === "GOVERNMENT_PROCESSING"
  ).length;
  const officerReview = applications.filter(
    (a) => a.status === "ACTION_REQUIRED" || a.stage === "OFFICER_REVIEW"
  ).length;
  const returned = applications.filter((a) => a.status === "RETURNED_FOR_CORRECTION").length;
  const approved = applications.filter(
    (a) => a.status === "APPROVED" || a.status === "COMPLETED" || a.stage === "DELIVERED"
  ).length;
  const unresolvedExceptions = exceptions.filter(
    (e) => !(e.resolved ?? (e as any).isResolved)
  ).length;

  return (
    <GovContext.Provider
      value={{
        currentUser,
        applications,
        exceptions,
        auditLogs,
        stats: {
          total,
          newApps,
          verificationPending,
          officerReview,
          returned,
          approved,
          exceptions: unresolvedExceptions,
        },
        isLoading,
        refreshAll,
        resetDemoPipeline,
      }}
    >
      {children}
    </GovContext.Provider>
  );
}

export function useGov() {
  const context = useContext(GovContext);
  if (!context) {
    throw new Error("useGov must be used within a GovProvider");
  }
  return context;
}
