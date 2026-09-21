import { NextRequest, NextResponse } from "next/server";
import { getApplicationById, calculateAuditTamperHash } from "@/lib/server/db";
import { pgQuery, getAuthoritativeDb } from "@/lib/server/pg-db";
import { WorkflowRouter, ApplicationRoutingInput } from "@/lib/server/ai/workflow-router";
import { resolveServiceRoute } from "@/lib/server/routing-resolver";
import { cookies } from "next/headers";
import { authenticateSession } from "@/lib/server/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    await getAuthoritativeDb();
    const cookieStore = await cookies();
    const token =
      cookieStore.get("FORMLY_CITIZEN_SESSION")?.value ||
      cookieStore.get("FORMLY_GOV_SESSION")?.value ||
      cookieStore.get("formly_citizen_session")?.value ||
      cookieStore.get("seva_saarthi_session")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { applicationId, applicationData, naturalText } = body;

    if (!applicationId && !naturalText) {
      return NextResponse.json(
        { success: false, error: "applicationId or naturalText is required" },
        { status: 400 }
      );
    }

    // 1. Retrieve existing application if an ID was provided
    let existingApp: any = null;
    if (applicationId) {
      existingApp = await getApplicationById(applicationId);
    }

    // 2. Construct normalized routing input (following strict data minimization)
    const routingInput: ApplicationRoutingInput = {
      applicationId: applicationId || "PRE-SUBMIT-ROUTING",
      serviceName: naturalText || existingApp?.serviceName || applicationData?.serviceName || "",
      applicationTitle: naturalText || existingApp?.serviceName || "Citizen Application",
      applicationDescription: naturalText || existingApp?.data?.remarks || "",
      category: existingApp?.category || applicationData?.category,
      stateCode: existingApp?.data?.state || applicationData?.state,
      documentTypes: existingApp?.documents ? Object.values(existingApp.documents).map((d: any) => d.type) : [],
      requestedBenefit: naturalText,
    };

    // 3. Run AI Model 1 Classification & Registry Candidate Ranking
    const recommendation = await WorkflowRouter.routeApplication(routingInput);

    // 4. Validate output with deterministic routing rules
    let resolvedRoute = null;
    if (recommendation.suggestedServiceId) {
      resolvedRoute = await resolveServiceRoute(recommendation.suggestedServiceId, {
        stateCode: routingInput.stateCode,
        category: routingInput.category,
      });
    }

    // 5. Persist recommendation in database if an application exists
    let recommendationId = "";
    if (existingApp?.id) {
      recommendationId = await WorkflowRouter.persistRecommendation(recommendation, existingApp.id);
    }

    // 6. Record tamper-evident audit record
    const auditEntry = {
      id: `AUD-AI-${Date.now()}`,
      applicationId: applicationId || "ANONYMOUS",
      timestamp: new Date().toISOString(),
      actor: { id: "AI-MODEL-1", name: "Seva Saarthi Workflow Router", role: "SYSTEM_WORKFLOW" as const },
      action: "AI_WORKFLOW_ROUTED",
      stage: "OFFICER_REVIEW",
      source: "AI Model 1 Recommender",
      target: "Application Case Queue",
      purpose: "Statutory workflow and office assignment recommendation",
      result: "SUCCESS" as const,
      details: `AI Model 1 recommended ${recommendation.suggestedServiceName} (${recommendation.suggestedServiceId}) with ${(recommendation.confidenceScore * 100).toFixed(1)}% confidence. Tier: ${recommendation.routingTier}.`,
      requestId: `REQ-AI-${Date.now()}`,
    };
    const tamperHash = calculateAuditTamperHash(auditEntry);

    try {
      await pgQuery(
        `INSERT INTO audit_events (id, application_id, action, actor_type, event_data)
         VALUES ($1, $2, $3, 'SYSTEM', $4)`,
        [
          crypto.randomUUID(),
          existingApp?.id || null,
          "AI_WORKFLOW_ROUTED",
          JSON.stringify({ ...auditEntry, tamperHash, recommendationId }),
        ]
      );
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      recommendation,
      resolvedRoute,
      recommendationId,
    });
  } catch (error: any) {
    console.error("[API ai/route-application POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
