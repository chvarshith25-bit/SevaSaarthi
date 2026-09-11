import { NextRequest, NextResponse } from "next/server";
import { officerAcceptApplication, getAuditLogs } from "@/lib/server/db";
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
    let remarks = "Approved after statutory officer review.";
    try {
      const body = await request.json();
      if (body.remarks) remarks = body.remarks;
    } catch {}

    const result = await officerAcceptApplication(
      id,
      auth.employee.employee_code,
      auth.employee.full_name,
      remarks
    );

    const logs = await getAuditLogs(id);
    return NextResponse.json({ success: true, application: result, auditLogs: logs });
  } catch (error: any) {
    console.error("[API gov/applications/[id]/accept POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
