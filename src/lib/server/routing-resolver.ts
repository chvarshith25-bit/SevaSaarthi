import { pgQuery, getAuthoritativeDb } from "./pg-db";
import { getServiceById, getServiceByCode, getServiceRequirements, getServiceWorkflow } from "./registry-service";
import { WorkflowRouter, ApplicationRoutingInput, ROUTING_CONFIDENCE_CONFIG } from "./ai/workflow-router";

export interface RoutingResolutionContext {
  stateCode?: string;
  category?: string;
  applicantIncome?: number;
  priority?: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
  customAttributes?: Record<string, any>;
  naturalLanguageText?: string;
  applicationId?: string;
  documentTypes?: string[];
  requestedBenefit?: string;
}

export type RoutingMode = "RULE_BASED" | "MANUAL_REVIEW_REQUIRED" | "AI_RECOMMENDED" | "AI_CONFIRMED";

export interface ResolvedRoute {
  status: "ROUTED" | "ROUTING_REQUIRES_MANUAL_REVIEW";
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  departmentId: string | null;
  departmentName?: string;
  subDepartmentId: string | null;
  subDepartmentName?: string;
  officeId: string | null;
  officeName?: string;
  routingRuleId: string | null;
  targetRole: string | null;
  workflowId: string | null;
  requiredVerifications: string[];
  routingMode: RoutingMode;
  confidence?: number;
  modelVersion?: string;
  reason: string;
}

export interface StoredRoutingRule {
  id: string;
  service_id: string;
  department_id: string | null;
  sub_department_id: string | null;
  office_id: string | null;
  target_role: string;
  conditions: Record<string, any>;
  priority_order: number;
  is_active: boolean;
}

/**
 * Resolves the operational government route for an application using a hybrid AI + deterministic routing architecture.
 * If natural text intent is provided, AI Model 1 ranks candidate registry entities.
 * All results are strictly validated against Phase 2 registry foreign keys.
 * If confidence is below threshold or unmatched, safely falls back to ROUTING_REQUIRES_MANUAL_REVIEW.
 */
export async function resolveServiceRoute(
  serviceIdOrCode: string,
  context?: RoutingResolutionContext
): Promise<ResolvedRoute> {
  await getAuthoritativeDb();

  // If citizen natural language text is provided without a rigid service ID, run AI Model 1 first
  let aiRecommendation = null;
  let resolvedServiceIdOrCode = serviceIdOrCode;

  if (context?.naturalLanguageText) {
    try {
      const aiInput: ApplicationRoutingInput = {
        applicationId: context.applicationId || "APP-PENDING",
        serviceName: context.naturalLanguageText,
        applicationTitle: context.naturalLanguageText,
        category: context.category,
        stateCode: context.stateCode,
        documentTypes: context.documentTypes,
        requestedBenefit: context.requestedBenefit,
      };
      aiRecommendation = await WorkflowRouter.routeApplication(aiInput);

      if (aiRecommendation.suggestedServiceId) {
        resolvedServiceIdOrCode = aiRecommendation.suggestedServiceId;
      }
    } catch (err) {
      console.warn("[routing-resolver] AI router fallback:", err);
    }
  }

  // 1. Resolve service from registry
  let service = await getServiceById(resolvedServiceIdOrCode);
  if (!service) {
    service = await getServiceByCode(resolvedServiceIdOrCode);
  }

  if (!service) {
    return {
      status: "ROUTING_REQUIRES_MANUAL_REVIEW",
      serviceId: serviceIdOrCode,
      serviceCode: "UNKNOWN",
      serviceName: "Unknown or Unregistered Service",
      departmentId: null,
      subDepartmentId: null,
      officeId: null,
      routingRuleId: null,
      targetRole: "DEPARTMENT_OFFICER",
      workflowId: null,
      requiredVerifications: [],
      routingMode: "MANUAL_REVIEW_REQUIRED",
      reason: `Service '${serviceIdOrCode}' is not registered in the authoritative government service catalog.`,
    };
  }

  // 2. Query active routing rules for this service ordered by priority
  const rules = await pgQuery<StoredRoutingRule>(
    `SELECT * FROM routing_rules 
     WHERE service_id = $1 AND is_active = true 
     ORDER BY priority_order ASC`,
    [service.id]
  );

  // 3. Find first rule whose condition matches the application context
  let matchedRule: StoredRoutingRule | null = null;
  for (const rule of rules) {
    if (matchesRuleConditions(rule.conditions, context)) {
      matchedRule = rule;
      break;
    }
  }

  // 4. Fetch service workflow and requirements
  const [workflow, requirements] = await Promise.all([
    getServiceWorkflow(service.id),
    getServiceRequirements(service.id),
  ]);

  const requiredVerifications = requirements
    .filter((r) => r.requirement_type === "VERIFICATION" || r.requirement_type === "DOCUMENT")
    .map((r) => r.requirement_key);

  // 5. If no active rule matches, fall back safely to manual review
  if (!matchedRule) {
    return {
      status: "ROUTING_REQUIRES_MANUAL_REVIEW",
      serviceId: service.id,
      serviceCode: service.code,
      serviceName: service.name,
      departmentId: service.department_id || null,
      subDepartmentId: service.sub_department_id || null,
      officeId: null,
      routingRuleId: null,
      targetRole: "DEPARTMENT_OFFICER",
      workflowId: workflow.definition?.id || null,
      requiredVerifications,
      routingMode: "MANUAL_REVIEW_REQUIRED",
      reason: "No active routing rule matches the application context. Dispatched to centralized nodal review queue.",
    };
  }

  // 6. Look up department, sub-department, and office labels
  let departmentName: string | undefined;
  let subDepartmentName: string | undefined;
  let officeName: string | undefined;

  const targetDeptId = matchedRule.department_id || service.department_id;
  const targetSubDeptId = matchedRule.sub_department_id || service.sub_department_id;

  if (targetDeptId) {
    const deptRows = await pgQuery<{ name: string }>(`SELECT name FROM departments WHERE id = $1`, [targetDeptId]);
    departmentName = deptRows[0]?.name;
  }
  if (targetSubDeptId) {
    const subRows = await pgQuery<{ name: string }>(`SELECT name FROM sub_departments WHERE id = $1`, [targetSubDeptId]);
    subDepartmentName = subRows[0]?.name;
  }
  if (matchedRule.office_id) {
    const ofcRows = await pgQuery<{ name: string }>(`SELECT name FROM offices WHERE id = $1`, [matchedRule.office_id]);
    officeName = ofcRows[0]?.name;
  }

  const isAiRoute = !!aiRecommendation && aiRecommendation.confidenceScore >= ROUTING_CONFIDENCE_CONFIG.HIGH_CONFIDENCE_THRESHOLD;

  return {
    status: "ROUTED",
    serviceId: service.id,
    serviceCode: service.code,
    serviceName: service.name,
    departmentId: targetDeptId || null,
    departmentName,
    subDepartmentId: targetSubDeptId || null,
    subDepartmentName,
    officeId: matchedRule.office_id || null,
    officeName,
    routingRuleId: matchedRule.id,
    targetRole: matchedRule.target_role || "DEPARTMENT_OFFICER",
    workflowId: workflow.definition?.id || null,
    requiredVerifications,
    routingMode: isAiRoute ? "AI_RECOMMENDED" : "RULE_BASED",
    confidence: aiRecommendation?.confidenceScore,
    modelVersion: aiRecommendation?.modelVersion,
    reason: isAiRoute && aiRecommendation
      ? `AI Model 1 recommended with ${Math.round(aiRecommendation.confidenceScore * 100)}% confidence; validated against rule ${matchedRule.id}.`
      : `Matched routing rule ${matchedRule.id} (priority ${matchedRule.priority_order}).`,
  };
}

function matchesRuleConditions(conditions: Record<string, any>, context?: RoutingResolutionContext): boolean {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true; // Unconditional rule for this service
  }
  for (const [key, value] of Object.entries(conditions)) {
    if (key === "serviceCode") continue;
    if (!context) return false;
    if (key === "stateCode" && context.stateCode && context.stateCode !== value) return false;
    if (key === "category" && context.category && context.category !== value) return false;
    if (key === "priority" && context.priority && context.priority !== value) return false;
  }
  return true;
}
