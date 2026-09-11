"use client";

import React from "react";
import { SevaSaarthiProvider } from "@/lib/store/formly-store";
import { CitizenLayoutShell } from "@/components/layout/CitizenLayoutShell";

export function CitizenLayout({ children }: { children: React.ReactNode }) {
  return (
    <SevaSaarthiProvider>
      <CitizenLayoutShell>{children}</CitizenLayoutShell>
    </SevaSaarthiProvider>
  );
}
