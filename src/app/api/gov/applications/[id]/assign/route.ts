import { NextRequest, NextResponse } from "next/server";
import { assignApplication, getAuditLogs } from "@/lib/server/db";
import { validateGovSession, validateGovRole, unauthorizedResponse, forbiddenResponse } from "@/lib/server/auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateGovRole(request, ["DEPARTMENT_ADMIN", "SYSTEM_ADMIN"]);
    if (!auth.success) {
      return auth.error?.toLowerCase().includes("forbidden")
        ? forbiddenResponse(auth.error!)
        : unauthorizedResponse(auth.error!);
    }

    const { id } = await context.params;
    const body = await request.json();
    const officerId = body.officerId || auth.employee.employee_code;
    const officerName = body.officerName || auth.employee.full_name;

    const result = await assignApplication(id, officerId, officerName);
    const logs = await getAuditLogs(id);
    return NextResponse.json({ success: true, application: result, auditLogs: logs });
  } catch (error: any) {
    console.error("[API gov/applications/[id]/assign POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
