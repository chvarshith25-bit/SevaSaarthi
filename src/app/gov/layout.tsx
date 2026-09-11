"use client";

import React from "react";
import { GovProvider } from "@/lib/store/gov-store";
import { GovernmentShell } from "@/components/gov/GovernmentShell";

export default function GovLayout({ children }: { children: React.ReactNode }) {
  return (
    <GovProvider>
      <GovernmentShell>{children}</GovernmentShell>
    </GovProvider>
  );
}
