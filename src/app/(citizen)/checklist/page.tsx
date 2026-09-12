"use client";

import React, { Suspense } from "react";
import { ReadinessChecklistPage } from "@/components/checklist/ReadinessChecklistPage";
import { Loader2 } from "lucide-react";

export default function ChecklistPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <ReadinessChecklistPage />
    </Suspense>
  );
}

