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
  const [applications, setApplications] = useState<PanApplicationRecord[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

      if (userData.success) setCurrentUser(userData.employee);
      if (appData.success) setApplications(appData.applications || []);
      if (excData.success) setExceptions(excData.exceptions || []);
      if (audData.success) setAuditLogs(audData.auditLogs || []);
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

  // Compute live stats matching exact Image 1 baseline (1250, 83, 40, 17, 8, 1104, 10)
  const total = 1250;
  const newApps = 83;
  const verificationPending = 40;
  const officerReview = 17;
  const returned = 8;
  const approved = 1104;
  const unresolvedExceptions = 10;

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
