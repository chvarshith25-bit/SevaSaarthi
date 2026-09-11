"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TrackIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectToLatest = async () => {
      try {
        const res = await fetch("/api/track/latest");
        const data = await res.json();
        if (data.success && data.applicationId) {
          router.replace(`/track/${data.applicationId}`);
        } else {
          // Fallback to dashboard if no app found
          router.replace("/dashboard");
        }
      } catch (err) {
        console.error("Redirect error:", err);
        router.replace("/dashboard");
      }
    };
    redirectToLatest();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Redirecting to PAN Application Tracker...</p>
      </div>
    </div>
  );
}
