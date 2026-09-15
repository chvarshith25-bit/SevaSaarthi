import fs from "fs";
import path from "path";
import {
  getRegisteredServices,
  getRegisteredDepartments,
  getRegisteredSubDepartments,
  getRegisteredOffices,
  getServiceWorkflow,
  getServiceRequirements,
  RegisteredServiceRecord,
} from "../registry-service";
import { pgQuery, getAuthoritativeDb } from "../pg-db";

export interface ApplicationRoutingInput {
  applicationId: string;
  serviceId?: string;
  serviceName?: string;
  applicationTitle?: string;
  applicationDescription?: string;
  category?: string;
  stateCode?: string;
  applicantType?: string;
  relevantProfileAttributes?: Record<string, any>;
  documentTypes?: string[];
  requestedBenefit?: string;
}

export interface AIModel1RoutingRecommendation {
  applicationId: string;
  suggestedServiceId: string;
  suggestedServiceName: string;
  suggestedDepartmentId: string;
  suggestedDepartmentName: string;
  suggestedSubDepartmentId: string;
  suggestedSubDepartmentName: string;
  suggestedOfficeId: string;
  suggestedOfficeName: string;
  suggestedWorkflowId: string;
  suggestedWorkflowCode: string;
  requiredVerificationTypes: string[];
  confidenceScore: number;
  routingTier: "AUTOMATIC_RECOMMENDATION" | "HUMAN_CONFIRMATION_REQUIRED" | "MANUAL_REVIEW";
  recommendationExplanation: string;
  modelVersion: string;
  routingMode: "RULE_BASED" | "AI_RECOMMENDED" | "AI_CONFIRMED" | "MANUAL_REVIEW_REQUIRED";
}

// Configurable confidence thresholds (Single source of truth)
export const ROUTING_CONFIDENCE_CONFIG = {
  HIGH_CONFIDENCE_THRESHOLD: 0.85,
  MEDIUM_CONFIDENCE_THRESHOLD: 0.60,
  MODEL_VERSION: "workflow-router-v1",
} as const;

interface ModelArtifact {
  version: string;
  total_docs: number;
  classes: Record<string, Record<string, number>>;
  service_metadata: Record<string, { department_id: string; sub_department_id: string; workflow_id: string }>;
}

export interface ModelV2Artifact {
  model_version: string;
  dataset_version: string;
  training_timestamp: string;
  temperature: number;
  classes: string[];
  service_metadata: Record<string, { department_id: string; sub_department_id: string; workflow_id: string }>;
  ood_indicators: string[];
  service_anchors: Record<string, string[]>;
  idf: Record<string, number>;
  class_word_counts: Record<string, Record<string, number>>;
}

let cachedModel: ModelArtifact | null = null;
let cachedModelV2: ModelV2Artifact | null = null;

function loadModel(): ModelArtifact {
  if (cachedModel) return cachedModel;
  const modelPath = path.resolve(process.cwd(), "data/ai/workflow-router/model.json");
  if (fs.existsSync(modelPath)) {
    const raw = fs.readFileSync(modelPath, "utf8");
    cachedModel = JSON.parse(raw);
    return cachedModel!;
  }
  throw new Error("Model artifact not found at data/ai/workflow-router/model.json. Please run train.py first.");
}

export function loadModelV2(): ModelV2Artifact {
  if (cachedModelV2) return cachedModelV2;
  const modelPath = path.resolve(process.cwd(), "data/ai/workflow-router/model-v2.json");
  if (fs.existsSync(modelPath)) {
    const raw = fs.readFileSync(modelPath, "utf8");
    cachedModelV2 = JSON.parse(raw);
    return cachedModelV2!;
  }
  throw new Error("Model v2 artifact not found at data/ai/workflow-router/model-v2.json.");
}

const STOP_WORDS = new Set([
  "i", "me", "my", "myself", "we", "our", "ours", "you", "your", "he", "him", "his", "she", "her",
  "it", "its", "they", "them", "what", "which", "who", "whom", "this", "that", "these", "those",
  "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do",
  "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until",
  "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during",
  "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over",
  "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all",
  "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only",
  "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now",
  "kavali", "undi", "ledu", "chesa", "cheyali", "padaledu", "chahiye", "hai", "ke", "liye", "me", "se", "ko"
]);

export function tokenizeInput(text: string): string[] {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const rawTokens = clean.split(/\s+/).filter((t) => t.length > 1 && !STOP_WORDS.has(t));
  const ngrams: string[] = [];
  for (const t of rawTokens) {
    if (t.length >= 4) {
      for (let i = 0; i < t.length - 2; i++) {
        ngrams.push(t.substring(i, i + 3));
      }
    }
  }
  return [...rawTokens, ...ngrams];
}

export class WorkflowRouter {
  /**
   * Promoted AI Model 1 Router (Default: V2 with automatic safe fallback to V1 or MANUAL_REVIEW).
   * Controllable via process.env.WORKFLOW_ROUTER_MODEL ('v2' | 'v1').
   */
  public static async routeApplication(
    input: ApplicationRoutingInput
  ): Promise<AIModel1RoutingRecommendation> {
    const selectedModel = (process.env.WORKFLOW_ROUTER_MODEL || "v2").toLowerCase().trim();

    if (selectedModel === "v1") {
      return WorkflowRouter.routeApplicationV1(input);
    }

    try {
      // Default production route: Model 1 V2 (Calibrated)
      const v2Rec = await WorkflowRouter.routeApplicationV2(input);
      // Extra safety check: Ensure output has valid recommendation format
      if (v2Rec && typeof v2Rec.confidenceScore === "number" && v2Rec.modelVersion) {
        return v2Rec;
      }
      throw new Error("Invalid V2 recommendation payload structure.");
    } catch (err: any) {
      console.warn("[WorkflowRouter] V2 routing failed or model unavailable, executing safe fallback to V1:", err?.message || err);
      try {
        const v1Rec = await WorkflowRouter.routeApplicationV1(input);
        return {
          ...v1Rec,
          recommendationExplanation: `[FALLBACK from V2: ${err?.message || 'Error'}] ${v1Rec.recommendationExplanation}`,
        };
      } catch (fallbackErr: any) {
        console.error("[WorkflowRouter] V1 fallback failed as well, dispatching to MANUAL_REVIEW:", fallbackErr);
        return {
          applicationId: input.applicationId,
          suggestedServiceId: "",
          suggestedServiceName: "Unclassified / Emergency Safety Fallback",
          suggestedDepartmentId: "",
          suggestedDepartmentName: "Manual Review Queue",
          suggestedSubDepartmentId: "",
          suggestedSubDepartmentName: "Nodal Allocation Desk",
          suggestedOfficeId: "",
          suggestedOfficeName: "Central Operations Centre",
          suggestedWorkflowId: "",
          suggestedWorkflowCode: "MANUAL_REVIEW",
          requiredVerificationTypes: [],
          confidenceScore: 0.0,
          routingTier: "MANUAL_REVIEW",
          recommendationExplanation: "System safe fallback triggered. Dispatched for manual review.",
          modelVersion: "fallback-manual-review",
          routingMode: "MANUAL_REVIEW_REQUIRED",
        };
      }
    }
  }

  /**
   * Authoritative AI Model 1 V1 Router (Baseline TF-IDF + Cosine Similarity).
   * Preserved for explicit backwards compatibility and instant rollback.
   */
  public static async routeApplicationV1(
    input: ApplicationRoutingInput
  ): Promise<AIModel1RoutingRecommendation> {
    await getAuthoritativeDb();
    const model = loadModel();

    // 1. Synthesize minimal textual representation for routing
    const textCorpus = [
      input.applicationTitle || "",
      input.applicationDescription || "",
      input.requestedBenefit || "",
      input.serviceName || "",
      input.category || "",
      (input.documentTypes || []).join(" "),
    ].filter(Boolean).join(" ");

    const tokens = tokenizeInput(textCorpus);

    // 2. Candidate retrieval and classification
    let bestServiceCode = "MANUAL_REVIEW";
    let rawScore = 0.0;

    if (tokens.length > 0) {
      const inputCounts: Record<string, number> = {};
      for (const t of tokens) {
        inputCounts[t] = (inputCounts[t] || 0) + 1;
      }

      let inputNormSq = 0;
      for (const count of Object.values(inputCounts)) {
        inputNormSq += count * count;
      }
      const inputNorm = Math.sqrt(inputNormSq);

      if (inputNorm > 0) {
        for (const [svcCode, classVec] of Object.entries(model.classes)) {
          let dot = 0;
          let vecNormSq = 0;
          for (const [wKey, weight] of Object.entries(classVec)) {
            vecNormSq += weight * weight;
            if (inputCounts[wKey]) {
              dot += inputCounts[wKey] * weight;
            }
          }
          const vecNorm = Math.sqrt(vecNormSq);
          if (vecNorm > 0) {
            const cosine = dot / (inputNorm * vecNorm);
            if (cosine > rawScore) {
              rawScore = cosine;
              bestServiceCode = svcCode;
            }
          }
        }
      }
    }

    // Calibrate confidence score to [0, 1]
    const confidence = Math.min(1.0, Math.max(0.0, Math.round(rawScore * 1.85 * 1000) / 1000));

    // 3. Candidate Registry Validation
    const allServices = await getRegisteredServices();
    const candidateService = allServices.find((s) => s.code === bestServiceCode);

    // SAFETY RULE: If AI returns unknown code or below minimum threshold, reject to MANUAL_REVIEW
    if (!candidateService || confidence < ROUTING_CONFIDENCE_CONFIG.MEDIUM_CONFIDENCE_THRESHOLD) {
      return {
        applicationId: input.applicationId,
        suggestedServiceId: "",
        suggestedServiceName: "Unclassified / Out of Distribution",
        suggestedDepartmentId: "",
        suggestedDepartmentName: "Manual Review Queue",
        suggestedSubDepartmentId: "",
        suggestedSubDepartmentName: "Nodal Allocation Desk",
        suggestedOfficeId: "",
        suggestedOfficeName: "Central Operations Centre",
        suggestedWorkflowId: "",
        suggestedWorkflowCode: "MANUAL_REVIEW",
        requiredVerificationTypes: [],
        confidenceScore: confidence,
        routingTier: "MANUAL_REVIEW",
        recommendationExplanation:
          confidence < ROUTING_CONFIDENCE_CONFIG.MEDIUM_CONFIDENCE_THRESHOLD
            ? `Confidence (${(confidence * 100).toFixed(1)}%) is below statutory threshold of 60%. Dispatched for manual review.`
            : `AI classification '${bestServiceCode}' does not exist in authoritative government service registry.`,
        modelVersion: ROUTING_CONFIDENCE_CONFIG.MODEL_VERSION,
        routingMode: "MANUAL_REVIEW_REQUIRED",
      };
    }

    // 4. Resolve associated registry entities for candidate
    const [departments, subDepartments, offices, workflowData, requirements] = await Promise.all([
      getRegisteredDepartments(),
      getRegisteredSubDepartments(candidateService.department_id),
      getRegisteredOffices(candidateService.department_id, candidateService.sub_department_id),
      getServiceWorkflow(candidateService.id),
      getServiceRequirements(candidateService.id),
    ]);

    const department = departments.find((d) => d.id === candidateService.department_id);
    const subDepartment = subDepartments.find((sd) => sd.id === candidateService.sub_department_id);
    const office = offices.find((o) => o.sub_department_id === candidateService.sub_department_id) || offices[0] || null;
    const workflowDef = workflowData.definition;

    // STATUTORY SAFETY RULE: All relationships between service, department, sub-department, and workflow must be strictly valid
    const isRelationshipValid =
      department &&
      subDepartment &&
      subDepartment.department_id === department.id &&
      workflowDef &&
      workflowDef.service_id === candidateService.id;

    if (!isRelationshipValid) {
      return {
        applicationId: input.applicationId,
        suggestedServiceId: "",
        suggestedServiceName: "Invalid Registry Configuration / Relationship Conflict",
        suggestedDepartmentId: "",
        suggestedDepartmentName: "Manual Review Queue",
        suggestedSubDepartmentId: "",
        suggestedSubDepartmentName: "Nodal Allocation Desk",
        suggestedOfficeId: "",
        suggestedOfficeName: "Central Operations Centre",
        suggestedWorkflowId: "",
        suggestedWorkflowCode: "MANUAL_REVIEW",
        requiredVerificationTypes: [],
        confidenceScore: confidence,
        routingTier: "MANUAL_REVIEW",
        recommendationExplanation: `Service relationship validation failed (Dept: ${department?.id || 'MISSING'}, SubDept: ${subDepartment?.id || 'MISSING'}, Workflow: ${workflowDef?.id || 'MISSING'}). Dispatched for manual review.`,
        modelVersion: ROUTING_CONFIDENCE_CONFIG.MODEL_VERSION,
        routingMode: "MANUAL_REVIEW_REQUIRED",
      };
    }

    const requiredVerificationTypes = Array.from(
      new Set(requirements.map((r) => r.requirement_type))
    );

    // 5. Determine Confidence Tier and Routing Mode
    let routingTier: "AUTOMATIC_RECOMMENDATION" | "HUMAN_CONFIRMATION_REQUIRED" | "MANUAL_REVIEW";
    let routingMode: "RULE_BASED" | "AI_RECOMMENDED" | "AI_CONFIRMED" | "MANUAL_REVIEW_REQUIRED";

    if (confidence >= ROUTING_CONFIDENCE_CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
      routingTier = "AUTOMATIC_RECOMMENDATION";
      routingMode = "AI_RECOMMENDED";
    } else {
      routingTier = "HUMAN_CONFIRMATION_REQUIRED";
      routingMode = "AI_RECOMMENDED";
    }

    // 6. Generate concise, evidence-based human explanation
    const topKeywords = tokens.slice(0, 4).join(", ");
    const explanation = `Application features (${topKeywords}) match statutory service '${candidateService.name}' under ${department?.name || 'Department'} with ${(confidence * 100).toFixed(1)}% semantic alignment.`;

    return {
      applicationId: input.applicationId,
      suggestedServiceId: candidateService.id,
      suggestedServiceName: candidateService.name,
      suggestedDepartmentId: department?.id || "",
      suggestedDepartmentName: department?.name || "General Administration",
      suggestedSubDepartmentId: subDepartment?.id || "",
      suggestedSubDepartmentName: subDepartment?.name || "Central Operations",
      suggestedOfficeId: office?.id || "",
      suggestedOfficeName: office?.name || "Central Processing Centre",
      suggestedWorkflowId: workflowData.definition?.id || "",
      suggestedWorkflowCode: workflowData.definition?.code || "WF_DEFAULT",
      requiredVerificationTypes,
      confidenceScore: confidence,
      routingTier,
      recommendationExplanation: explanation,
      modelVersion: ROUTING_CONFIDENCE_CONFIG.MODEL_VERSION,
      routingMode,
    };
  }


  /**
   * Persists an AI routing recommendation into the database.
   */
  public static async persistRecommendation(
    rec: AIModel1RoutingRecommendation,
    appUuid?: string
  ): Promise<string> {
    await getAuthoritativeDb();
    let targetAppId = appUuid || rec.applicationId;
    // If targetAppId is an application number (e.g. PAN-2026-0005) or not a valid UUID, look up UUID from applications
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetAppId);
    if (!isUuid) {
      const appLookup = await pgQuery<{ id: string }>(
        "SELECT id FROM applications WHERE application_number = $1 OR id::text = $1 LIMIT 1",
        [targetAppId]
      );
      if (appLookup.length > 0) {
        targetAppId = appLookup[0].id;
      }
    }
    const rows = await pgQuery<{ id: string }>(
      `INSERT INTO application_routing_recommendations (
        application_id,
        model_version,
        suggested_service_id,
        suggested_department_id,
        suggested_sub_department_id,
        suggested_office_id,
        suggested_workflow_id,
        confidence_score,
        routing_mode,
        explanation,
        required_verification_types,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING')
      RETURNING id`,
      [
        targetAppId,
        rec.modelVersion,
        rec.suggestedServiceId || null,
        rec.suggestedDepartmentId || null,
        rec.suggestedSubDepartmentId || null,
        rec.suggestedOfficeId || null,
        rec.suggestedWorkflowId || null,
        rec.confidenceScore,
        rec.routingMode,
        rec.recommendationExplanation,
        rec.requiredVerificationTypes,
      ]
    );
    return rows[0]?.id;
  }

  /**
   * Phase 7D.1: Upgraded Model v2 Evaluator
   * Uses calibrated hybrid scoring + OOD indicator rejection + controlled registry validation.
   */
  public static async routeApplicationV2(
    input: ApplicationRoutingInput
  ): Promise<AIModel1RoutingRecommendation> {
    await getAuthoritativeDb();
    const modelV2 = loadModelV2();

    const textCorpus = [
      input.applicationTitle || "",
      input.applicationDescription || "",
      input.requestedBenefit || "",
      input.serviceName || "",
      input.category || "",
      (input.documentTypes || []).join(" "),
    ].filter(Boolean).join(" ");

    const clean = textCorpus.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    const words = clean.split(/\s+/).filter(Boolean);

    // 1. OOD Indicator Guard
    const isOod = words.some((w) => modelV2.ood_indicators.includes(w));
    if (isOod) {
      return {
        applicationId: input.applicationId,
        suggestedServiceId: "",
        suggestedServiceName: "Unknown Service (Out of Distribution)",
        suggestedDepartmentId: "",
        suggestedDepartmentName: "Manual Review Queue",
        suggestedSubDepartmentId: "",
        suggestedSubDepartmentName: "Nodal Allocation Desk",
        suggestedOfficeId: "",
        suggestedOfficeName: "Central Operations Centre",
        suggestedWorkflowId: "",
        suggestedWorkflowCode: "MANUAL_REVIEW",
        requiredVerificationTypes: [],
        confidenceScore: 0.10,
        routingTier: "MANUAL_REVIEW",
        recommendationExplanation: "Out-of-distribution service request rejected to manual review.",
        modelVersion: modelV2.model_version,
        routingMode: "MANUAL_REVIEW_REQUIRED",
      };
    }

    // 2. Compute logits using BM25 and domain anchors
    const logits: Record<string, number> = {};
    for (const c of modelV2.classes) {
      let sc = 0.0;
      const classWordCounts = modelV2.class_word_counts[c] || {};
      const anchors = new Set(modelV2.service_anchors[c] || []);

      for (const w of words) {
        if (classWordCounts[w]) {
          const tf = classWordCounts[w];
          sc += Math.log(1.0 + tf) * (modelV2.idf[w] || 1.0);
        }
        if (anchors.has(w)) {
          sc += 25.0; // Distinctive domain anchor boost
        }
      }
      logits[c] = sc;
    }

    const maxLogit = Math.max(...Object.values(logits));
    if (maxLogit <= 5.0) {
      return {
        applicationId: input.applicationId,
        suggestedServiceId: "",
        suggestedServiceName: "Unknown Service (Low Domain Evidence)",
        suggestedDepartmentId: "",
        suggestedDepartmentName: "Manual Review Queue",
        suggestedSubDepartmentId: "",
        suggestedSubDepartmentName: "Nodal Allocation Desk",
        suggestedOfficeId: "",
        suggestedOfficeName: "Central Operations Centre",
        suggestedWorkflowId: "",
        suggestedWorkflowCode: "MANUAL_REVIEW",
        requiredVerificationTypes: [],
        confidenceScore: 0.20,
        routingTier: "MANUAL_REVIEW",
        recommendationExplanation: "Insufficient distinctive domain evidence. Dispatched for manual review.",
        modelVersion: modelV2.model_version,
        routingMode: "MANUAL_REVIEW_REQUIRED",
      };
    }

    // 3. Calibrated Softmax
    const exps: Record<string, number> = {};
    let sumExp = 0;
    for (const c of modelV2.classes) {
      const e = Math.exp((logits[c] - maxLogit) / modelV2.temperature);
      exps[c] = e;
      sumExp += e;
    }

    let topSvc = modelV2.classes[0];
    let topProb = 0;
    for (const c of modelV2.classes) {
      const p = exps[c] / sumExp;
      if (p > topProb) {
        topProb = p;
        topSvc = c;
      }
    }

    // 4. Validate against Controlled Registry
    const services = await getRegisteredServices();
    const candidateService = services.find(
      (s) => s.code === topSvc || s.id === topSvc || s.name.toUpperCase().includes(topSvc)
    );

    if (!candidateService) {
      return {
        applicationId: input.applicationId,
        suggestedServiceId: "",
        suggestedServiceName: "Unregistered Service",
        suggestedDepartmentId: "",
        suggestedDepartmentName: "Manual Review Queue",
        suggestedSubDepartmentId: "",
        suggestedSubDepartmentName: "Nodal Allocation Desk",
        suggestedOfficeId: "",
        suggestedOfficeName: "Central Operations Centre",
        suggestedWorkflowId: "",
        suggestedWorkflowCode: "MANUAL_REVIEW",
        requiredVerificationTypes: [],
        confidenceScore: topProb,
        routingTier: "MANUAL_REVIEW",
        recommendationExplanation: "Service not found in controlled registry.",
        modelVersion: modelV2.model_version,
        routingMode: "MANUAL_REVIEW_REQUIRED",
      };
    }

    const [departments, subDepartments, offices, workflowData, requirements] = await Promise.all([
      getRegisteredDepartments(),
      getRegisteredSubDepartments(),
      getRegisteredOffices(),
      getServiceWorkflow(candidateService.id),
      getServiceRequirements(candidateService.id),
    ]);

    const department = departments.find((d) => d.id === candidateService.department_id);
    const subDepartment = subDepartments.find((sd) => sd.id === candidateService.sub_department_id);
    const office = offices.find((o) => o.sub_department_id === candidateService.sub_department_id) || offices[0] || null;

    let routingTier: "AUTOMATIC_RECOMMENDATION" | "HUMAN_CONFIRMATION_REQUIRED" | "MANUAL_REVIEW";
    let routingMode: "RULE_BASED" | "AI_RECOMMENDED" | "AI_CONFIRMED" | "MANUAL_REVIEW_REQUIRED";

    if (topProb >= 0.80) {
      routingTier = "AUTOMATIC_RECOMMENDATION";
      routingMode = "AI_RECOMMENDED";
    } else if (topProb >= 0.50) {
      routingTier = "HUMAN_CONFIRMATION_REQUIRED";
      routingMode = "AI_RECOMMENDED";
    } else {
      routingTier = "MANUAL_REVIEW";
      routingMode = "MANUAL_REVIEW_REQUIRED";
    }

    const requiredVerificationTypes = Array.from(
      new Set(requirements.map((r) => r.requirement_type))
    );

    return {
      applicationId: input.applicationId,
      suggestedServiceId: candidateService.id,
      suggestedServiceName: candidateService.name,
      suggestedDepartmentId: department?.id || "",
      suggestedDepartmentName: department?.name || "General Administration",
      suggestedSubDepartmentId: subDepartment?.id || "",
      suggestedSubDepartmentName: subDepartment?.name || "Central Operations",
      suggestedOfficeId: office?.id || "",
      suggestedOfficeName: office?.name || "Central Processing Centre",
      suggestedWorkflowId: workflowData.definition?.id || "",
      suggestedWorkflowCode: workflowData.definition?.code || "WF_DEFAULT",
      requiredVerificationTypes,
      confidenceScore: Math.round(topProb * 1000) / 1000,
      routingTier,
      recommendationExplanation: `Model v2 (Calibrated) predicted '${candidateService.name}' with ${(topProb * 100).toFixed(1)}% calibrated probability under ${department?.name || 'Department'}.`,
      modelVersion: modelV2.model_version,
      routingMode,
    };
  }

  /**
   * Comparison mode: evaluates an application with both v1 baseline and v2 calibrated model side-by-side.
   */
  public static async compareModels(input: ApplicationRoutingInput): Promise<{
    baselineV1: AIModel1RoutingRecommendation;
    calibratedV2: AIModel1RoutingRecommendation;
    agreement: boolean;
    recommendationDifference?: string;
  }> {
    const [baselineV1, calibratedV2] = await Promise.all([
      WorkflowRouter.routeApplication(input),
      WorkflowRouter.routeApplicationV2(input),
    ]);

    const agreement = baselineV1.suggestedServiceId === calibratedV2.suggestedServiceId;
    let diff: string | undefined;
    if (!agreement) {
      diff = `V1 recommended '${baselineV1.suggestedServiceName}' (${(baselineV1.confidenceScore * 100).toFixed(1)}%) while V2 recommended '${calibratedV2.suggestedServiceName}' (${(calibratedV2.confidenceScore * 100).toFixed(1)}%)`;
    }

    return {
      baselineV1,
      calibratedV2,
      agreement,
      recommendationDifference: diff,
    };
  }
  /**
   * Shadow‑mode comparison: runs V1 and V2 side‑by‑side, logs the result, and returns V1 output.
   * This function does **NOT** persist any routing decision.
   */
  public static async compareAndLog(input: ApplicationRoutingInput, requestId: string, userId?: string | null): Promise<AIModel1RoutingRecommendation> {
    const comparison = await WorkflowRouter.compareModels(input);
    // Persist shadow telemetry
    await WorkflowRouter.logShadowResult({
      ...comparison,
      requestId,
      userId: userId || null,
    });
    // Return authoritative V1 recommendation to caller
    return comparison.baselineV1;
  }


  /**
   * Insert a row into the shadow‑mode telemetry table.
   * Expected table schema is defined in migration 20240915_create_router_shadow_log.sql.
   */
  public static async logShadowResult(record: {
    baselineV1: AIModel1RoutingRecommendation;
    calibratedV2: AIModel1RoutingRecommendation;
    agreement: boolean;
    recommendationDifference?: string;
    requestId: string;
    userId: string | null;
  }): Promise<void> {
    const {
      baselineV1,
      calibratedV2,
      agreement,
      recommendationDifference,
      requestId,
      userId,
    } = record;
    const v1SvcId = baselineV1.suggestedServiceId && baselineV1.suggestedServiceId.trim() !== '' ? baselineV1.suggestedServiceId : null;
    const v2SvcId = calibratedV2.suggestedServiceId && calibratedV2.suggestedServiceId.trim() !== '' ? calibratedV2.suggestedServiceId : null;

    await pgQuery(`INSERT INTO router_shadow_log (
      request_id,
      user_id,
      v1_service_id,
      v1_confidence,
      v2_service_id,
      v2_probability,
      v2_tier,
      ood_flag,
      agreement,
      recommendation_diff,
      v1_version,
      v2_version
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [
      requestId,
      userId,
      v1SvcId,
      baselineV1.confidenceScore,
      v2SvcId,
      calibratedV2.confidenceScore,
      calibratedV2.routingTier,
      calibratedV2.routingTier === 'MANUAL_REVIEW', // simplistic OOD flag
      agreement,
      recommendationDifference,
      baselineV1.modelVersion,
      calibratedV2.modelVersion,
    ]);
  }


}

