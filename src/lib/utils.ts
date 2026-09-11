import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatConfidence(confidence: number | null | undefined): string {
  if (confidence === null || confidence === undefined) return "Manual";
  return `${Math.round(confidence * 100)}%`;
}

export function getConfidenceBadgeClass(confidence: number | null | undefined): {
  bg: string;
  text: string;
  label: string;
} {
  if (confidence === null || confidence === undefined) {
    return { bg: "bg-slate-100", text: "text-slate-700", label: "Manual Override" };
  }
  const pct = Math.round(confidence * 100);
  if (pct >= 90) {
    return { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: `High (${pct}%)` };
  }
  if (pct >= 70) {
    return { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: `Medium (${pct}%)` };
  }
  return { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", label: `Low (${pct}%)` };
}

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount.replace(/[^0-9.]/g, "")) : amount;
  if (isNaN(num)) return amount.toString();
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
