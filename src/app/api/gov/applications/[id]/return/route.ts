import { NextRequest, NextResponse } from "next/server";
import { officerReturnApplication, getAuditLogs } from "@/lib/server/db";
import { validateGovSession, validateGovRole, unauthorizedResponse, forbiddenResponse } from "@/lib/server/auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateGovRole(request, ["DEPARTMENT_OFFICER", "DEPARTMENT_ADMIN", "SYSTEM_ADMIN"]);
    if (!auth.success) {
      return auth.error?.toLowerCase().includes("forbidden")
        ? forbiddenResponse(auth.error!)
        : unauthorizedResponse(auth.error!);
    }

    const { id } = await context.params;
    const body = await request.json();
    const reason = body.reason || body.correctionReason || body.returnExplanation;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, error: "Mandatory return reason is required" },
        { status: 400 }
      );
    }

    const result = await officerReturnApplication(
      id,
      auth.employee.employee_code,
      auth.employee.full_name,
      reason
    );

    const logs = await getAuditLogs(id);
    return NextResponse.json({ success: true, application: result, auditLogs: logs });
  } catch (error: any) {
    console.error("[API gov/applications/[id]/return POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
