import { ConnectorRequestRecord } from "@/types/government";

export interface ConnectedSystemInfo {
  key: "identity" | "document" | "pan_core" | "printing" | "dispatch";
  name: string;
  agency: string;
  endpoint: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  latencyMs: number;
  uptimePercent: number;
  requestsToday: number;
  lastPing: string;
}

let connectedSystemsState: Record<string, ConnectedSystemInfo> = {
  identity: {
    key: "identity",
    name: "Identity Registry (UIDAI)",
    agency: "Unique Identification Authority of India",
    endpoint: "https://gateway.uidai.gov.in/v2.5/ekyc",
    status: "ONLINE",
    latencyMs: 142,
    uptimePercent: 99.98,
    requestsToday: 14250,
    lastPing: new Date().toISOString(),
  },
  document: {
    key: "document",
    name: "Document Registry (DigiLocker)",
    agency: "National e-Governance Division (NeGD)",
    endpoint: "https://api.digilocker.gov.in/v3/certificate",
    status: "ONLINE",
    latencyMs: 189,
    uptimePercent: 99.85,
    requestsToday: 9812,
    lastPing: new Date().toISOString(),
  },
  pan_core: {
    key: "pan_core",
    name: "PAN Processing Service (NSDL / Income Tax)",
    agency: "Central Board of Direct Taxes (CBDT)",
    endpoint: "https://services.incometax.gov.in/pan/v1/core",
    status: "ONLINE",
    latencyMs: 235,
    uptimePercent: 99.42,
    requestsToday: 11043,
    lastPing: new Date().toISOString(),
  },
  printing: {
    key: "printing",
    name: "Card Printing Service (ISP Nashik)",
    agency: "Security Printing and Minting Corp of India (SPMCIL)",
    endpoint: "https://orders.isp.gov.in/v2/secure-print",
    status: "ONLINE",
    latencyMs: 310,
    uptimePercent: 99.91,
    requestsToday: 4890,
    lastPing: new Date().toISOString(),
  },
  dispatch: {
    key: "dispatch",
    name: "Dispatch Logistics Service (India Post)",
    agency: "Department of Posts, Ministry of Communications",
    endpoint: "https://speedpost.indiapost.gov.in/api/consignment",
    status: "ONLINE",
    latencyMs: 175,
    uptimePercent: 99.78,
    requestsToday: 5120,
    lastPing: new Date().toISOString(),
  },
};

export function getConnectedSystems(): ConnectedSystemInfo[] {
  return Object.values(connectedSystemsState);
}

export function updateSystemStatus(key: string, status: "ONLINE" | "DEGRADED" | "OFFLINE", latencyMs?: number): ConnectedSystemInfo {
  if (connectedSystemsState[key]) {
    connectedSystemsState[key].status = status;
    if (latencyMs) connectedSystemsState[key].latencyMs = latencyMs;
    connectedSystemsState[key].lastPing = new Date().toISOString();
  }
  return connectedSystemsState[key];
}

export async function simulateConnectorCall(
  systemKey: "identity" | "document" | "pan_core" | "printing" | "dispatch",
  action: string,
  applicationId: string,
  payload: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string; requestRecord: ConnectorRequestRecord }> {
  const sys = connectedSystemsState[systemKey];
  const reqId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  // If system is offline or degraded, simulate failure if chaos mode
  const isFailed = sys.status === "OFFLINE" || (sys.status === "DEGRADED" && Math.random() < 0.5);

  const requestRecord: ConnectorRequestRecord = {
    id: reqId,
    systemName: sys.name,
    systemKey,
    status: isFailed ? "DEGRADED" : "ONLINE",
    endpoint: `${sys.endpoint}/${action}`,
    method: "POST",
    latencyMs: isFailed ? 5200 : sys.latencyMs + Math.floor(Math.random() * 30),
    statusCode: isFailed ? 504 : 200,
    applicationId,
    requestPayloadSummary: JSON.stringify(payload).slice(0, 100) + "...",
    responseSummary: isFailed
      ? `Gateway Timeout (504): External ${sys.name} downstream service did not respond within deadline.`
      : `HTTP 200 OK: Operation '${action}' acknowledged by ${sys.name}. Signature validated.`,
    timestamp: now,
    retryCount: isFailed ? 1 : 0,
  };

  sys.requestsToday += 1;

  if (isFailed) {
    return {
      success: false,
      error: `Gateway Timeout: ${sys.name} is currently unavailable. Request ${reqId} queued for retry.`,
      requestRecord,
    };
  }

  return {
    success: true,
    data: {
      acknowledgementToken: `ACK-${Date.now().toString(36).toUpperCase()}`,
      systemTimestamp: now,
      status: "PROCESSED",
    },
    requestRecord,
  };
}
