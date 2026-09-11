import { pgQuery, pgExec } from "./pg-db";

export interface AIExplanationRequest {
  applicationId: string;
  decisionId: string;
  reason: string;
  affectedField?: string;
  type: "RETURN" | "REJECT";
}

export interface AIExplanationResult {
  explanation: string;
  recommendedActions: string[];
}

/**
 * AI Explanation Pipeline
 * Generates citizen-friendly explanations for officer decisions.
 * In a real system, this would call an LLM (e.g., Claude) with the
 * official reason and application context.
 */
export async function generateAIExplanation(request: AIExplanationRequest): Promise<AIExplanationResult> {
  const { reason, affectedField, type } = request;

  // Simulation of LLM processing
  // In reality, this would be a prompt like:
  // "Convert this official government rejection reason into a supportive,
  // clear, and actionable explanation for a citizen.
  // Reason: ${reason}. Field: ${affectedField}"

  let explanation = "";
  let recommendedActions: string[] = [];

  if (type === "RETURN") {
    explanation = `We've reviewed your application and noticed a small discrepancy in your ${affectedField || "details"}. To proceed, please update the following: "${reason}". We're here to help you get your PAN card quickly!`;
    recommendedActions = [
      `Check your ${affectedField || "profile"} details`,
      "Upload a clearer copy of the document",
      "Verify the information matches your official ID",
    ];
  } else {
    explanation = `Unfortunately, we cannot process your application at this time due to: ${reason}. We recommend reviewing the eligibility criteria or consulting a local help desk.`;
    recommendedActions = [
      "Review eligibility requirements",
      "Contact the Income Tax Department help desk",
      "Apply again after resolving the issue",
    ];
  }

  return { explanation, recommendedActions };
}

/**
 * Orchestrates the AI explanation and saves it to the database.
 */
export async function triggerAIExplanationPipeline(
  applicationId: string,
  decisionId: string,
  reason: string,
  affectedField?: string,
  type: "RETURN" | "REJECT" = "RETURN"
): Promise<void> {
  try {
    const result = await generateAIExplanation({
      applicationId,
      decisionId,
      reason,
      affectedField,
      type,
    });

    const assistanceType = type === "RETURN" ? "RETURN_EXPLANATION" : "REJECTION_EXPLANATION";

    await pgQuery(`
      INSERT INTO ai_case_assistance (
        application_id, decision_id, assistance_type, source_reason, explanation, recommended_actions, review_status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED_FOR_DISPLAY')`,
      [
        applicationId,
        decisionId,
        assistanceType,
        reason,
        result.explanation,
        JSON.stringify(result.recommendedActions),
      ]
    );
  } catch (error) {
    console.error("[AI Pipeline Error]", error);
    // We don't throw here to avoid blocking the main officer action
  }
}
