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

let cachedModel: ModelArtifact | null = null;

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
   * Evaluates application routing input and produces a strictly registry-validated recommendation.
   */
  public static async routeApplication(
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
}
