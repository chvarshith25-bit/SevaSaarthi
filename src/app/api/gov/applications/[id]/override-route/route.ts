import { NextRequest, NextResponse } from "next/server";
import { getApplicationById, calculateAuditTamperHash } from "@/lib/server/db";
import { pgQuery, getAuthoritativeDb } from "@/lib/server/pg-db";
import { validateGovSession, unauthorizedResponse, forbiddenResponse } from "@/lib/server/auth";
import { getRegisteredDepartments, getRegisteredSubDepartments, getRegisteredOffices, getRegisteredServices } from "@/lib/server/registry-service";
import crypto from "crypto";

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
    const body = await request.json();
    const { overrideServiceId, overrideDepartmentId, overrideSubDepartmentId, overrideOfficeId, reason } = body;

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "A valid statutory reason is required for human routing override" },
        { status: 400 }
      );
    }

    const officerId = auth.employee?.id || "00000000-0000-0000-0000-000000007042";
    const officerName = auth.user?.name || "Officer Sai Sankeerth";

    let originalAiRec = null;
    try {
      const prevRecRows = await pgQuery<any>(
        `SELECT * FROM application_routing_recommendations
         WHERE application_id = (SELECT id FROM applications WHERE application_number = $1 OR id::text = $1 LIMIT 1)
         ORDER BY created_at DESC LIMIT 1`,
        [id]
      );
      originalAiRec = prevRecRows[0] || null;

      if (originalAiRec) {
        await pgQuery(
          `UPDATE application_routing_recommendations
           SET status = 'OVERRIDDEN',
               officer_override_reason = $1,
               reviewed_by = $2,
               reviewed_at = now(),
               updated_at = now()
           WHERE id = $3`,
          [reason, officerId, originalAiRec.id]
        );
      }

      await pgQuery(
        `INSERT INTO application_routing_recommendations (
          application_id,
          model_version,
          suggested_service_id,
          suggested_department_id,
          suggested_sub_department_id,
          suggested_office_id,
          confidence_score,
          routing_mode,
          explanation,
          status,
          officer_override_reason,
          reviewed_by,
          reviewed_at
        ) VALUES (
          (SELECT id FROM applications WHERE application_number = $1 OR id::text = $1 LIMIT 1),
          'human-override',
          $2, $3, $4, $5, 1.00, 'RULE_BASED',
          $6, 'CONFIRMED', $7, $8, now()
        )`,
        [
          id,
          overrideServiceId || originalAiRec?.suggested_service_id || "srv-override",
          overrideDepartmentId || originalAiRec?.suggested_department_id || "dept-override",
          overrideSubDepartmentId || originalAiRec?.suggested_sub_department_id || "sub-override",
          overrideOfficeId || originalAiRec?.suggested_office_id || "off-override",
          `Human officer override: ${reason}`,
          reason,
          officerId,
        ]
      );
    } catch (pgErr) {
      console.warn("[override-route] PG query fallback notice:", pgErr);
    }

    // 4. Record statutory human override in audit trail
    const auditEntry = {
      id: `AUD-OVERRIDE-${Date.now()}`,
      applicationId: id,
      timestamp: new Date().toISOString(),
      actor: { id: officerId, name: officerName, role: "OFFICER" as const },
      action: "AI_ROUTE_OVERRIDDEN",
      stage: app.stage || "OFFICER_REVIEW",
      source: "Government Workspace (Port 3001)",
      target: "Application Case Route",
      purpose: "Human statutory override of AI suggested workflow routing",
      result: "SUCCESS" as const,
      details: `Officer ${officerName} (${officerId}) manually overrode routing. Reason: "${reason}".`,
      requestId: `REQ-${Date.now()}`,
    };
    const tamperHash = calculateAuditTamperHash(auditEntry);

    try {
      await pgQuery(
        `INSERT INTO audit_events (id, application_id, action, actor_type, event_data)
         VALUES ($1, (SELECT id FROM applications WHERE application_number = $2 OR id::text = $2 LIMIT 1), 'AI_ROUTE_OVERRIDDEN', 'EMPLOYEE', $3)`,
        [crypto.randomUUID(), id, JSON.stringify({ ...auditEntry, tamperHash, originalAiRec })]
      );
    } catch (auditPgErr) {
      console.warn("[override-route] Audit event PG insert notice:", auditPgErr);
    }

    return NextResponse.json({
      success: true,
      status: "OVERRIDDEN",
      message: `Workflow route manually overridden by ${officerName}.`,
    });
  } catch (error: any) {
    console.error("[API override-route POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
