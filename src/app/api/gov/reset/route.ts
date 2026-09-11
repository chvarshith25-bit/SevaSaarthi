import { NextRequest, NextResponse } from "next/server";
import { resetPanDemoState, getPanApplications, getApplications, getAuditLogs } from "@/lib/server/db";
import { validateGovSession, validateGovRole, unauthorizedResponse, forbiddenResponse } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await validateGovRole(request, ["SYSTEM_ADMIN"]);
    if (!auth.success) {
      return auth.error?.toLowerCase().includes("forbidden")
        ? forbiddenResponse(auth.error!)
        : unauthorizedResponse(auth.error!);
    }

    resetPanDemoState();
    const apps = getApplications();
    const logs = getAuditLogs();
    return NextResponse.json({
      success: true,
      message: "Reset PAN demo state to initial configuration",
      applications: apps,
      auditLogs: logs,
    });
  } catch (error: any) {
    console.error("[API gov/reset POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
