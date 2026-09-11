import { NextRequest, NextResponse } from "next/server";
import { getApplicationById, getAuditLogs } from "@/lib/server/db";
import { authenticateSession } from "@/lib/server/db";
import { getAuthoritativeDb } from "@/lib/server/pg-db";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("FORMLY_CITIZEN_SESSION")?.value ||
      cookieStore.get("formly_citizen_session")?.value ||
      cookieStore.get("seva_saarthi_session")?.value;
    const govToken =
      cookieStore.get("FORMLY_GOV_SESSION")?.value ||
      cookieStore.get("formly_gov_session")?.value;

    const { id } = await context.params;
    const app = await getApplicationById(id);

    if (!app) {
      return NextResponse.json({ success: false, error: `Application not found: ${id}` }, { status: 404 });
    }

    // Allow public tracking only for seeded demo cases; all new dynamic citizen applications require auth
    const SEEDED_DEMO_CASES = new Set(["PAN-2026-0001", "PAN-2026-0002", "PAN-2026-0003", "PAN-2026-0004", "SCH-2026-2345", "HOU-2026-7781"]);
    const isPublicDemoCase = SEEDED_DEMO_CASES.has(id);

    if (!isPublicDemoCase) {
      if (govToken) {
        // Government officer is allowed to inspect application tracker
      } else if (token) {
        const user = await authenticateSession(token);
        if (!user) {
          return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const ownerId = (app as any).citizen_user_id || app.userId;
        if (ownerId !== user.id) {
          return NextResponse.json({ success: false, error: "Forbidden: You can only track your own applications" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    let aiAssistanceRecord = null;
    try {
      const dbPg = await getAuthoritativeDb();
      const aiRes = await dbPg.query(
        `SELECT assistance_type, explanation, recommended_actions
         FROM ai_case_assistance
         WHERE application_id = $1 AND review_status = 'APPROVED_FOR_DISPLAY'
         ORDER BY created_at DESC LIMIT 1`,
        [app.id]
      );
      aiAssistanceRecord = aiRes.rows[0] || null;
    } catch {}

    const logs = await getAuditLogs(id);
    return NextResponse.json({
      success: true,
      application: app,
      auditLogs: logs,
      aiAssistance: aiAssistanceRecord
    });
  } catch (error: any) {
    console.error("[API track/[id] GET]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
