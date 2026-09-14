import { ConnectorRequestRecord } from "@/types/government";

export type ConnectorSystemKey =
  | "identity"
  | "document"
  | "pan_core"
  | "printing"
  | "dispatch"
  | "revenue"
  | "education"
  | "bank_npci"
  | "land_records"
  | "revenue_registry"
  | "education_registry"
  | "agriculture_registry"
  | "health_registry"
  | "housing_registry"
  | "land_registry"
  | "pan_tax_registry";

export interface ConnectedSystemInfo {
  key: ConnectorSystemKey;
  code?: string;
  name: string;
  agency: string;
  endpoint: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  endpointMode: "SIMULATED" | "MOCK" | "LIVE";
  latencyMs: number;
  uptimePercent: number;
  requestsToday: number;
  lastPing: string;
  supportedData: string[];
  retryPolicy: { maxRetries: number; backoffMs: number };
}

let connectedSystemsState: Record<ConnectorSystemKey, ConnectedSystemInfo> = {
  identity: {
    key: "identity",
    code: "CONN_UIDAI_AADHAAR",
    name: "Identity Registry (UIDAI)",
    agency: "Unique Identification Authority of India",
    endpoint: "https://gateway.uidai.gov.in/v2.5/ekyc",
    status: "ONLINE",
    endpointMode: "SIMULATED",
    latencyMs: 142,
    uptimePercent: 99.98,
    requestsToday: 14250,
    lastPing: new Date().toISOString(),
    supportedData: ["fullName", "dateOfBirth", "gender", "address", "aadhaarNumber"],
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
  document: {
    key: "document",
    code: "CONN_DIGILOCKER",
    name: "Document Registry (DigiLocker)",
    agency: "National e-Governance Division (NeGD)",
    endpoint: "https://api.digilocker.gov.in/v3/certificate",
    status: "ONLINE",
    endpointMode: "SIMULATED",
    latencyMs: 189,
    uptimePercent: 99.85,
    requestsToday: 9812,
    lastPing: new Date().toISOString(),
    supportedData: ["marksheet", "casteCertificate", "bonafideCertificate", "domicileCertificate"],
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
  pan_core: {
    key: "pan_core",
    code: "CONN_PROTEAN_PAN",
    name: "PAN Processing Service (NSDL / Income Tax)",
    agency: "Central Board of Direct Taxes (CBDT)",
    endpoint: "https://services.incometax.gov.in/pan/v1/core",
    status: "ONLINE",
    endpointMode: "SIMULATED",
    latencyMs: 235,
    uptimePercent: 99.42,
    requestsToday: 11043,
    lastPing: new Date().toISOString(),
    supportedData: ["panNumber", "taxStatus"],
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
  printing: {
    key: "printing",
    code: "CONN_SECURITY_PRINT",
    name: "Card Printing Service (ISP Nashik)",
    agency: "Security Printing and Minting Corp of India (SPMCIL)",
    endpoint: "https://orders.isp.gov.in/v2/secure-print",
    status: "ONLINE",
    endpointMode: "SIMULATED",
    latencyMs: 310,
    uptimePercent: 99.91,
    requestsToday: 4890,
    lastPing: new Date().toISOString(),
    supportedData: ["cardDispatchId"],
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
  dispatch: {
    key: "dispatch",
    code: "CONN_INDIAPOST",
    name: "Dispatch Logistics Service (India Post)",
    agency: "Department of Posts, Ministry of Communications",
    endpoint: "https://speedpost.indiapost.gov.in/api/consignment",
    status: "ONLINE",
    endpointMode: "SIMULATED",
    latencyMs: 175,
    uptimePercent: 99.78,
    requestsToday: 5120,
    lastPing: new Date().toISOString(),
    supportedData: ["trackingNumber", "deliveryStatus"],
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
  revenue: {
    key: "revenue",
    code: "CONN_REVENUE",
    name: "State Revenue & Tehsildar Income Registry",
    agency: "State Disaster Management & Revenue Department",
    endpoint: "https://revenue.telangana.gov.in/api/v1/income",
    status: "ONLINE",
    endpointMode: "SIMULATED",
    latencyMs: 160,
    uptimePercent: 99.65,
    requestsToday: 6240,
    lastPing: new Date().toISOString(),
    supportedData: ["annualIncome", "certificateNumber", "issuingAuthority"],
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
  education: {
    key: "education",
    code: "CONN_EDUCATION",
    name: "AISHE / Higher Education Enrollment Gateway",
    agency: "Department of Higher Education, Ministry of Education",
    endpoint: "https://aishe.gov.in/api/v2/enrollment",
    status: "ONLINE",
    endpointMode: "SIMULATED",
    latencyMs: 210,
    uptimePercent: 99.50,
    requestsToday: 7890,
    lastPing: new Date().toISOString(),
    supportedData: ["enrollmentNumber", "collegeCode", "degree", "academicYear"],
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
  bank_npci: {
    key: "bank_npci",
    code: "CONN_BANK_NPCI",
    name: "NPCI Aadhaar-Seeded Bank Account Gateway",
    agency: "National Payments Corporation of India (NPCI)",
    endpoint: "https://npci.org.in/api/v1/dbt-mandate",
    status: "ONLINE",
    endpointMode: "SIMULATED",
    latencyMs: 195,
    uptimePercent: 99.88,
    requestsToday: 8930,
    lastPing: new Date().toISOString(),
    supportedData: ["accountNumber", "ifsc", "dbtSeededStatus"],
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
  land_records: {
    key: "land_records",
    code: "CONN_LAND_RECORDS",
    name: "Bhoomi / Land Records Registry Gateway",
    agency: "Department of Land Resources & Registration",
    endpoint: "https://landrecords.gov.in/api/v1/ror",
    status: "ONLINE",
    endpointMode: "SIMULATED",
    latencyMs: 240,
    uptimePercent: 99.30,
    requestsToday: 4120,
    lastPing: new Date().toISOString(),
    supportedData: ["khasraNumber", "surveyNumber", "landAreaAcres", "ownershipStatus"],
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
  revenue_registry: {
    key: "revenue_registry",
    code: "CONN_SYNTH_REVENUE",
    name: "Simulated Revenue & Income Registry",
    agency: "Department of Revenue & Disaster Management",
    endpoint: "https://synthetic.revenue.gov.in/v1/income-certificates",
    status: "ONLINE",
    endpointMode: "SIMULATED",
    latencyMs: 130,
    uptimePercent: 99.95,
    requestsToday: 120,
    lastPing: new Date().toISOString(),
    supportedData: ["citizen_id", "name", "father_name", "dob", "address", "district", "income_certificate_number", "annual_income", "certificate_status", "issue_date"],
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
  education_registry: {
    key: "education_registry",
    code: "CONN_SYNTH_EDUCATION",
    name: "Simulated Education & Scholarship Registry",
    agency: "Department of Higher Education (NSP/AISHE)",
    endpoint: "https://synthetic.scholarships.gov.in/v1/students",
    status: "ONLINE",
    endpointMode: "SIMULATED",
    latencyMs: 145,
    uptimePercent: 99.90,
    requestsToday: 210,
    lastPing: new Date().toISOString(),
    supportedData: ["citizen_id", "student_name", "dob", "college_name", "course", "scholarship_id", "scholarship_status", "academic_year", "income_reference"],
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
  agriculture_registry: {
    key: "agriculture_registry",
    code: "CONN_SYNTH_AGRICULTURE",
    name: "Simulated Agriculture & PM-Kisan Registry",
    agency: "Department of Agriculture & Farmers Welfare",
    endpoint: "https://synthetic.pmkisan.gov.in/v1/farmers",
    status: "ONLINE",
    endpointMode: "SIMULATED",
    latencyMs: 160,
    uptimePercent: 99.85,
    requestsToday: 340,
    lastPing: new Date().toISOString(),
    supportedData: ["citizen_id", "farmer_name", "village", "district", "land_reference", "pm_kisan_status", "bank_reference", "eligibility_status"],
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
  health_registry: {
    key: "health_registry",
    code: "CONN_SYNTH_HEALTH",
    name: "Simulated Health & Ayushman Registry",
    agency: "National Health Authority (PM-JAY)",
    endpoint: "https://synthetic.pmjay.gov.in/v1/beneficiaries",
    status: "ONLINE",
    endpointMode: "SIMULATED",
    latencyMs: 150,
    uptimePercent: 99.92,
    requestsToday: 410,
    lastPing: new Date().toISOString(),
    supportedData: ["citizen_id", "beneficiary_name", "dob", "health_scheme_id", "ayushman_status", "family_reference", "eligibility_status"],
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
  housing_registry: {
    key: "housing_registry",
    code: "CONN_SYNTH_HOUSING",
    name: "Simulated Housing & PMAY Registry",
    agency: "Ministry of Housing & Urban Affairs",
    endpoint: "https://synthetic.pmaymis.gov.in/v1/applicants",
    status: "ONLINE",
    endpointMode: "SIMULATED",
    latencyMs: 180,
    uptimePercent: 99.80,
    requestsToday: 95,
    lastPing: new Date().toISOString(),
    supportedData: ["citizen_id", "applicant_name", "address", "district", "household_income", "housing_scheme_id", "housing_status"],
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
  land_registry: {
    key: "land_registry",
    code: "CONN_SYNTH_LAND",
    name: "Simulated Land Records & Survey Registry",
    agency: "Department of Land Resources & Registration",
    endpoint: "https://synthetic.landrecords.gov.in/v1/parcels",
    status: "ONLINE",
    endpointMode: "SIMULATED",
    latencyMs: 170,
    uptimePercent: 99.75,
    requestsToday: 180,
    lastPing: new Date().toISOString(),
    supportedData: ["citizen_id", "owner_name", "survey_number", "village", "district", "land_area", "ownership_status"],
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
  pan_tax_registry: {
    key: "pan_tax_registry",
    code: "CONN_SYNTH_PAN",
    name: "Simulated PAN & Income Tax Registry",
    agency: "Central Board of Direct Taxes (CBDT)",
    endpoint: "https://synthetic.incometax.gov.in/v1/pan-records",
    status: "ONLINE",
    endpointMode: "SIMULATED",
    latencyMs: 135,
    uptimePercent: 99.98,
    requestsToday: 530,
    lastPing: new Date().toISOString(),
    supportedData: ["citizen_id", "name", "dob", "pan_reference", "pan_status", "category"],
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
};

export function getConnectedSystems(): ConnectedSystemInfo[] {
  return Object.values(connectedSystemsState);
}

export function updateSystemStatus(key: ConnectorSystemKey, status: "ONLINE" | "DEGRADED" | "OFFLINE", latencyMs?: number): ConnectedSystemInfo {
  if (connectedSystemsState[key]) {
    connectedSystemsState[key].status = status;
    if (latencyMs) connectedSystemsState[key].latencyMs = latencyMs;
    connectedSystemsState[key].lastPing = new Date().toISOString();
  }
  return connectedSystemsState[key];
}

export async function simulateConnectorCall(
  systemKey: ConnectorSystemKey,
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

export interface SyntheticRegistryQueryRequest {
  requestingApplicationId: string;
  requestingDepartmentId: string;
  purpose: string;
  authorizedFields: string[];
  consentVerified: boolean;
  queryParameters: {
    citizenId?: string;
    name?: string;
    dob?: string;
    referenceId?: string;
    district?: string;
  };
}

export interface SyntheticRegistryQueryResult {
  success: boolean;
  systemKey: ConnectorSystemKey;
  totalMatches: number;
  records: Record<string, any>[];
  redactedFieldCount: number;
  dataMinimizationNotice: string;
  error?: string;
}

const REGISTRY_TABLE_MAP: Record<string, string> = {
  revenue_registry: "registry_revenue",
  education_registry: "registry_education",
  agriculture_registry: "registry_agriculture",
  health_registry: "registry_health",
  housing_registry: "registry_housing",
  land_registry: "registry_land",
  pan_tax_registry: "registry_pan",
};

/**
 * Executes an authorized, field-minimized query against simulated government registries.
 * Enforces DPDP consent compliance and strips all non-authorized fields.
 */
export async function querySyntheticRegistry(
  registryKey: ConnectorSystemKey,
  request: SyntheticRegistryQueryRequest
): Promise<SyntheticRegistryQueryResult> {
  const { pgQuery, getAuthoritativeDb } = await import("./pg-db");
  await getAuthoritativeDb();

  // 1. Consent and Authorization Pre-Condition Check
  if (!request.consentVerified) {
    return {
      success: false,
      systemKey: registryKey,
      totalMatches: 0,
      records: [],
      redactedFieldCount: 0,
      dataMinimizationNotice: "Access Denied: Statutory citizen DPDP consent not verified for cross-registry query.",
      error: "CONSENT_VERIFICATION_REQUIRED",
    };
  }

  const tableName = REGISTRY_TABLE_MAP[registryKey];
  if (!tableName) {
    return {
      success: false,
      systemKey: registryKey,
      totalMatches: 0,
      records: [],
      redactedFieldCount: 0,
      dataMinimizationNotice: `Unknown simulated registry connector: ${registryKey}`,
      error: "INVALID_REGISTRY_CONNECTOR",
    };
  }

  // 2. Build parameter query
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (request.queryParameters.citizenId) {
    conditions.push(`citizen_id = $${paramIdx++}`);
    params.push(request.queryParameters.citizenId);
  }
  if (request.queryParameters.name) {
    // Check common name column aliases
    conditions.push(`(name ILIKE $${paramIdx} OR student_name ILIKE $${paramIdx} OR farmer_name ILIKE $${paramIdx} OR beneficiary_name ILIKE $${paramIdx} OR applicant_name ILIKE $${paramIdx} OR owner_name ILIKE $${paramIdx})`);
    params.push(`%${request.queryParameters.name}%`);
    paramIdx++;
  }
  if (request.queryParameters.dob) {
    conditions.push(`dob = $${paramIdx++}`);
    params.push(request.queryParameters.dob);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `SELECT * FROM ${tableName} ${whereClause} LIMIT 10`;

  let rows: any[] = [];
  try {
    rows = await pgQuery<any>(sql, params);
  } catch (err: any) {
    return {
      success: false,
      systemKey: registryKey,
      totalMatches: 0,
      records: [],
      redactedFieldCount: 0,
      dataMinimizationNotice: "Database query execution error",
      error: err.message,
    };
  }

  // 3. Strict Data Minimization Enforcement
  // Only fields present in request.authorizedFields will be returned.
  const authorizedSet = new Set(request.authorizedFields.map((f) => f.toLowerCase().trim()));
  let totalRedacted = 0;

  const sanitizedRecords = rows.map((rawRow) => {
    const minimizedRow: Record<string, any> = {};
    for (const [key, val] of Object.entries(rawRow)) {
      if (authorizedSet.has(key.toLowerCase()) || key === "id") {
        minimizedRow[key] = val;
      } else {
        totalRedacted++;
      }
    }
    return minimizedRow;
  });

  return {
    success: true,
    systemKey: registryKey,
    totalMatches: rows.length,
    records: sanitizedRecords,
    redactedFieldCount: totalRedacted,
    dataMinimizationNotice: `DPDP Data Minimization: Redacted ${totalRedacted} unauthorized fields across ${rows.length} records.`,
  };
}
