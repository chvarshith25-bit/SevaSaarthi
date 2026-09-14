import { NextRequest, NextResponse } from "next/server";
import { getApplicationById, calculateAuditTamperHash } from "@/lib/server/db";
import { pgQuery, getAuthoritativeDb } from "@/lib/server/pg-db";
import { validateGovSession, unauthorizedResponse, forbiddenResponse } from "@/lib/server/auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateGovSession(request);
    if (!auth.success) {
      return auth.error?.toLowerCase().includes("forbidden")
        ? forbiddenResponse(auth.error!)
        : unauthorizedResponse(auth.error!);
    }

    const { id } = await context.params;
    const app = await getApplicationById(id);
    if (!app) {
      return NextResponse.json({ success: false, error: `Application not found: ${id}` }, { status: 404 });
    }

    await getAuthoritativeDb();
    const body = await request.json().catch(() => ({}));
    const officerId = auth.employee?.id || "00000000-0000-0000-0000-000000007042";
    const officerName = auth.user?.name || "Officer Sai Sankeerth";

    // 1. Update the latest recommendation status to CONFIRMED
    await pgQuery(
      `UPDATE application_routing_recommendations
       SET status = 'CONFIRMED',
           routing_mode = 'AI_CONFIRMED',
           reviewed_by = $1,
           reviewed_at = now(),
           updated_at = now()
       WHERE application_id = (SELECT id FROM applications WHERE application_number = $2 OR id::text = $2 LIMIT 1)
         AND status = 'PENDING'`,
      [officerId, id]
    );

    // 2. Record statutory human confirmation in audit log
    const auditEntry = {
      id: `AUD-CONF-${Date.now()}`,
      applicationId: id,
      timestamp: new Date().toISOString(),
      actor: { id: officerId, name: officerName, role: "OFFICER" as const },
      action: "AI_ROUTE_CONFIRMED",
      stage: app.stage || "OFFICER_REVIEW",
      source: "Government Workspace (Port 3001)",
      target: "Application Case Route",
      purpose: "Statutory officer confirmation of AI recommended workflow",
      result: "SUCCESS" as const,
      details: `Officer ${officerName} (${officerId}) confirmed AI Model 1 recommended workflow route. Mode set to AI_CONFIRMED.`,
      requestId: `REQ-${Date.now()}`,
    };
    const tamperHash = calculateAuditTamperHash(auditEntry);

    await pgQuery(
      `INSERT INTO audit_events (id, application_id, action, actor_type, event_data)
       VALUES ($1, (SELECT id FROM applications WHERE application_number = $2 OR id::text = $2 LIMIT 1), 'AI_ROUTE_CONFIRMED', 'EMPLOYEE', $3)`,
      [crypto.randomUUID(), id, JSON.stringify({ ...auditEntry, tamperHash })]
    );

    return NextResponse.json({
      success: true,
      status: "AI_CONFIRMED",
      message: `Workflow route confirmed by ${officerName}.`,
    });
  } catch (error: any) {
    console.error("[API confirm-route POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
