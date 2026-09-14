import { pgQuery, getAuthoritativeDb } from "./pg-db";

// =====================================================================
// CONTROLLED VERIFICATION TYPES (Strict Enum)
// =====================================================================
export const CONTROLLED_VERIFICATION_TYPES = [
  "IDENTITY",
  "DATE_OF_BIRTH",
  "ADDRESS",
  "INCOME",
  "EDUCATION",
  "BANK_ACCOUNT",
  "LAND_OWNERSHIP",
  "DOCUMENT_AUTHENTICITY",
] as const;

export type ControlledVerificationType = (typeof CONTROLLED_VERIFICATION_TYPES)[number];

export function isControlledVerificationType(type: string): type is ControlledVerificationType {
  return CONTROLLED_VERIFICATION_TYPES.includes(type as ControlledVerificationType);
}

// =====================================================================
// INTERFACES FOR REGISTRY ENTITIES
// =====================================================================
export interface DepartmentRecord {
  id: string;
  code: string;
  name: string;
  government_level: "CENTRAL" | "STATE" | "DISTRICT" | "LOCAL" | "OTHER";
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubDepartmentRecord {
  id: string;
  department_id: string;
  code: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE";
  created_at?: string;
  updated_at?: string;
}

export interface OfficeRecord {
  id: string;
  department_id: string;
  sub_department_id?: string;
  code: string;
  name: string;
  city?: string;
  state?: string;
  pincode?: string;
  is_active: boolean;
}

export interface RegisteredServiceRecord {
  id: string;
  code: string;
  name: string;
  description?: string;
  provider_name?: string;
  provider_level?: string;
  category?: string;
  priority?: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
  department_id?: string;
  sub_department_id?: string;
  version: number;
  is_active: boolean;
  created_at?: string;
}

export interface WorkflowDefinitionRecord {
  id: string;
  service_id: string;
  code: string;
  version: number;
  is_active: boolean;
}

export interface WorkflowStepRecord {
  id: string;
  workflow_definition_id: string;
  step_key: string;
  label: string;
  step_type: "AUTOMATED" | "HUMAN" | "WAIT" | "END";
  requires_human: boolean;
  can_run_async: boolean;
  connector_id?: string;
  sub_department_id?: string;
  timeout_seconds?: number;
  order_hint: number;
}

export interface ServiceRequirementRecord {
  id: string;
  service_id: string;
  requirement_key: string;
  requirement_type: "PROFILE_FIELD" | "DOCUMENT" | "CONSENT_SCOPE" | "VERIFICATION" | "ELIGIBILITY";
  label: string;
  field_key?: string;
  document_type?: string;
  required: boolean;
  order_index: number;
}

export interface ConnectorRegistryRecord {
  id: string;
  code: string;
  name: string;
  environment: "DEMO" | "SANDBOX" | "PRODUCTION";
  connector_type: string;
  protocol: string;
  endpoint_mode: "SIMULATED" | "MOCK" | "LIVE";
  enabled: boolean;
  health_status: string;
  supported_data: string[];
}

// =====================================================================
// REGISTRY ACCESS METHODS (Authoritative Postgres / PGlite)
// =====================================================================

export async function getRegisteredDepartments(): Promise<DepartmentRecord[]> {
  await getAuthoritativeDb();
  return pgQuery<DepartmentRecord>(
    `SELECT * FROM departments WHERE is_active = true ORDER BY name ASC`
  );
}

export async function getDepartmentByCode(code: string): Promise<DepartmentRecord | null> {
  await getAuthoritativeDb();
  const rows = await pgQuery<DepartmentRecord>(
    `SELECT * FROM departments WHERE code = $1 LIMIT 1`,
    [code]
  );
  return rows[0] || null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getDepartmentById(id: string): Promise<DepartmentRecord | null> {
  if (!id || !UUID_REGEX.test(id)) return null;
  await getAuthoritativeDb();
  const rows = await pgQuery<DepartmentRecord>(
    `SELECT * FROM departments WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function getRegisteredSubDepartments(departmentId?: string): Promise<SubDepartmentRecord[]> {
  await getAuthoritativeDb();
  if (departmentId) {
    return pgQuery<SubDepartmentRecord>(
      `SELECT * FROM sub_departments WHERE department_id = $1 AND status = 'ACTIVE' ORDER BY name ASC`,
      [departmentId]
    );
  }
  return pgQuery<SubDepartmentRecord>(
    `SELECT * FROM sub_departments WHERE status = 'ACTIVE' ORDER BY name ASC`
  );
}

export async function getSubDepartmentByCode(code: string): Promise<SubDepartmentRecord | null> {
  await getAuthoritativeDb();
  const rows = await pgQuery<SubDepartmentRecord>(
    `SELECT * FROM sub_departments WHERE code = $1 LIMIT 1`,
    [code]
  );
  return rows[0] || null;
}

export async function getRegisteredOffices(departmentId?: string, subDepartmentId?: string): Promise<OfficeRecord[]> {
  await getAuthoritativeDb();
  let sql = `SELECT * FROM offices WHERE is_active = true`;
  const params: any[] = [];
  if (departmentId) {
    params.push(departmentId);
    sql += ` AND department_id = $${params.length}`;
  }
  if (subDepartmentId) {
    params.push(subDepartmentId);
    sql += ` AND sub_department_id = $${params.length}`;
  }
  sql += ` ORDER BY name ASC`;
  return pgQuery<OfficeRecord>(sql, params);
}

export async function getRegisteredServices(filter?: {
  departmentId?: string;
  subDepartmentId?: string;
  category?: string;
}): Promise<RegisteredServiceRecord[]> {
  await getAuthoritativeDb();
  let sql = `SELECT * FROM services WHERE is_active = true`;
  const params: any[] = [];
  if (filter?.departmentId) {
    params.push(filter.departmentId);
    sql += ` AND department_id = $${params.length}`;
  }
  if (filter?.subDepartmentId) {
    params.push(filter.subDepartmentId);
    sql += ` AND sub_department_id = $${params.length}`;
  }
  if (filter?.category) {
    params.push(filter.category);
    sql += ` AND category = $${params.length}`;
  }
  sql += ` ORDER BY name ASC`;
  return pgQuery<RegisteredServiceRecord>(sql, params);
}

export async function getServiceByCode(code: string): Promise<RegisteredServiceRecord | null> {
  await getAuthoritativeDb();
  const rows = await pgQuery<RegisteredServiceRecord>(
    `SELECT * FROM services WHERE code = $1 LIMIT 1`,
    [code]
  );
  return rows[0] || null;
}

export async function getServiceById(id: string): Promise<RegisteredServiceRecord | null> {
  if (!id || !UUID_REGEX.test(id)) return null;
  await getAuthoritativeDb();
  const rows = await pgQuery<RegisteredServiceRecord>(
    `SELECT * FROM services WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function getServiceWorkflow(serviceId: string): Promise<{
  definition: WorkflowDefinitionRecord | null;
  steps: WorkflowStepRecord[];
}> {
  await getAuthoritativeDb();
  const defRows = await pgQuery<WorkflowDefinitionRecord>(
    `SELECT * FROM workflow_definitions WHERE service_id = $1 AND is_active = true ORDER BY version DESC LIMIT 1`,
    [serviceId]
  );
  const definition = defRows[0] || null;
  if (!definition) {
    return { definition: null, steps: [] };
  }

  const steps = await pgQuery<WorkflowStepRecord>(
    `SELECT * FROM workflow_steps WHERE workflow_definition_id = $1 ORDER BY order_hint ASC`,
    [definition.id]
  );

  return { definition, steps };
}

export async function getServiceRequirements(serviceId: string): Promise<ServiceRequirementRecord[]> {
  await getAuthoritativeDb();
  return pgQuery<ServiceRequirementRecord>(
    `SELECT * FROM service_requirements WHERE service_id = $1 ORDER BY order_index ASC`,
    [serviceId]
  );
}

export async function getRegisteredConnectors(): Promise<ConnectorRegistryRecord[]> {
  await getAuthoritativeDb();
  return pgQuery<ConnectorRegistryRecord>(
    `SELECT * FROM connectors WHERE enabled = true ORDER BY name ASC`
  );
}
