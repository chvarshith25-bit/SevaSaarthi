"use client";

import React, { useEffect, useState } from "react";
import {
  Radio,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Server,
  Shield,
  ArrowRight,
} from "lucide-react";
import { ConnectedSystemInfo, ConnectorRequestRecord } from "@/types/government";
import { toast } from "sonner";

export default function InteroperabilityCenterPage() {
  const [systems, setSystems] = useState<ConnectedSystemInfo[]>([]);
  const [recentRequests, setRecentRequests] = useState<ConnectorRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingKey, setTestingKey] = useState<string | null>(null);

  const fetchConnectorData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gov/connectors");
      const data = await res.json();
      if (data.success) {
        setSystems(data.systems || []);
        setRecentRequests(data.recentRequests || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching connector statuses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectorData();
  }, []);

  const handleToggleStatus = async (systemKey: string, currentStatus: string) => {
    const newStatus = currentStatus === "ONLINE" ? "DEGRADED" : "ONLINE";
    try {
      const res = await fetch("/api/gov/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STATUS",
          systemKey,
          status: newStatus,
          latencyMs: newStatus === "DEGRADED" ? 5200 : 180,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.info(`Toggled ${systemKey} status to ${newStatus}`);
        fetchConnectorData();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handlePingSystem = async (systemKey: any) => {
    setTestingKey(systemKey);
    try {
      const res = await fetch("/api/gov/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PING",
          systemKey,
          payload: { healthCheck: true, client: "Formly Orchestration Mesh" },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Ping successful! Response latency: ${data.requestRecord?.latencyMs}ms`);
      } else {
        toast.error(data.error || "System unreachable");
      }
      fetchConnectorData();
    } catch {
      toast.error("Ping test failed");
    } finally {
      setTestingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            <span>Interoperability Layer (MeitY Core Mesh)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            INTEROPERABILITY CENTER
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry, health checks, and connector orchestration across 5 connected national systems.
          </p>
        </div>

        <button
          onClick={fetchConnectorData}
          className="self-start sm:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* 5 Connected Systems Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systems.map((sys) => {
          const isOnline = sys.status === "ONLINE";
          const isDegraded = sys.status === "DEGRADED";

          return (
            <div
              key={sys.key}
              className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                isOnline
                  ? "border-slate-200 hover:border-slate-300"
                  : isDegraded
                  ? "border-amber-300 bg-amber-50/20"
                  : "border-rose-300 bg-rose-50/20"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        isOnline
                          ? "bg-emerald-500 animate-pulse"
                          : isDegraded
                          ? "bg-amber-500 animate-ping"
                          : "bg-rose-500"
                      }`}
                    />
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {sys.name}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isOnline
                        ? "bg-emerald-100 text-emerald-800"
                        : isDegraded
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {sys.status}
                  </span>
                </div>

                <div className="text-[11px] font-medium text-slate-500 mb-2">
                  Agency: <span className="text-slate-800 font-semibold">{sys.agency}</span>
                </div>

                <div className="font-mono text-[10px] text-slate-400 bg-slate-50 p-2 rounded-xl border border-slate-100 truncate mb-3">
                  {sys.endpoint}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Latency</span>
                    <span className="font-bold text-slate-800">{sys.latencyMs} ms</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Uptime</span>
                    <span className="font-bold text-emerald-600">{sys.uptimePercent}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Today</span>
                    <span className="font-bold text-slate-800">{sys.requestsToday}</span>
                  </div>
                </div>
              </div>

              {/* Simulation Actions */}
              <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => handlePingSystem(sys.key)}
                  disabled={testingKey === sys.key}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>{testingKey === sys.key ? "Pinging..." : "Test Ping"}</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(sys.key, sys.status)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                    isOnline
                      ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  }`}
                  title="Chaos testing switch"
                >
                  {isOnline ? "Simulate Lag" : "Restore"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Connector Telemetry Logs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">RECENT CONNECTOR REQUEST TELEMETRY</h2>
          <span className="text-xs font-bold text-slate-400">Signed MeitY Gateway Headers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Request ID</th>
                <th className="pb-3">Target System</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Latency</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Response Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recentRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="py-3 font-mono font-bold text-indigo-700">{req.id}</td>
                  <td className="py-3 font-bold text-slate-900">{req.systemName}</td>
                  <td className="py-3">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {req.method}
                    </span>
                  </td>
                  <td className="py-3 font-mono">{req.latencyMs} ms</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.statusCode === 200
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      HTTP {req.statusCode}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600 text-[11px] max-w-md truncate">
                    {req.responseSummary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
