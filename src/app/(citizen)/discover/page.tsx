"use client";

import { Suspense } from "react";
import { DiscoverPage } from "@/components/discover/DiscoverPage";

export default function DiscoverRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DiscoverPage />
    </Suspense>
  );
}
