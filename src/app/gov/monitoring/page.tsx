"use client";

import React, { useEffect, useState } from "react";
import {
  Cpu,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Server,
  RefreshCw,
  TrendingUp,
  Shield,
} from "lucide-react";
import { ConnectedSystemInfo } from "@/types/government";
import { useGov } from "@/lib/store/gov-store";

export default function SystemMonitoringPage() {
  const { stats } = useGov();
  const [connectors, setConnectors] = useState<ConnectedSystemInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gov/connectors");
      const data = await res.json();
      if (data.success) {
        setConnectors(data.systems || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
            <Cpu className="w-3.5 h-3.5 text-purple-600" />
            <span>Infrastructure Health & Telemetry</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            SYSTEM MONITORING
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            System Admin infrastructure telemetry: API health, active workflow states, SLA performance, and connector resilience.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="self-start sm:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* 3 Main Sections: Connectors Health, Workflow Engine, Performance Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1: Connectors Status */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              NATIONAL CONNECTORS HEALTH
            </h2>
            <span className="text-xs font-bold text-emerald-600">5 Registered</span>
          </div>

          <div className="space-y-3">
            {connectors.map((c) => (
              <div
                key={c.key}
                className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        c.status === "ONLINE"
                          ? "bg-emerald-500"
                          : c.status === "DEGRADED"
                          ? "bg-amber-500 animate-ping"
                          : "bg-rose-500"
                      }`}
                    />
                    <span>{c.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Latency: <span className="font-mono text-slate-700">{c.latencyMs}ms</span> • Uptime: {c.uptimePercent}%
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    c.status === "ONLINE"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Workflow State Metrics */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              WORKFLOW ENGINE STATES
            </h2>
            <span className="text-xs font-bold text-indigo-600">Active Pipeline</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center justify-between">
              <span className="font-bold text-slate-800">Running Workflows</span>
              <span className="font-mono font-black text-indigo-700 text-base">128</span>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center justify-between">
              <span className="font-bold text-slate-800">Completed & Issued</span>
              <span className="font-mono font-black text-emerald-700 text-base">982</span>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center justify-between">
              <span className="font-bold text-slate-800">Pending Verification</span>
              <span className="font-mono font-black text-blue-700 text-base">41</span>
            </div>

            <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-2xl flex items-center justify-between">
              <span className="font-bold text-slate-800">Failed / API Timed Out</span>
              <span className="font-mono font-black text-rose-700 text-base">7</span>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-2xl flex items-center justify-between">
              <span className="font-bold text-slate-800">Manual Review / Conflict</span>
              <span className="font-mono font-black text-amber-700 text-base">13</span>
            </div>
          </div>
        </div>

        {/* Section 3: Performance & SLA Gauges */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              PERFORMANCE & SLA METRICS
            </h2>
            <span className="text-xs font-bold text-amber-600">SLA 99.4%</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-500 font-semibold">Average Automated Verification</span>
                <span className="font-mono font-bold text-slate-900">1.4 seconds</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[94%]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-500 font-semibold">Average Officer Review Time</span>
                <span className="font-mono font-bold text-slate-900">4.2 minutes</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full w-[85%]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-500 font-semibold">Mesh API Response Latency</span>
                <span className="font-mono font-bold text-slate-900">189 ms</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-[90%]" />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Auto-Retry Success Rate</span>
              <span className="font-bold text-emerald-600 font-mono">98.2%</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Statutory Exception Rate</span>
              <span className="font-bold text-slate-800 font-mono">0.88%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
