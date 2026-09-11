import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs, addAuditLog } from "@/lib/server/db";
import { validateGovSession, unauthorizedResponse, forbiddenResponse } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await validateGovSession(request);
    if (!auth.success) {
      return auth.error?.toLowerCase().includes("forbidden")
        ? forbiddenResponse(auth.error!)
        : unauthorizedResponse(auth.error!);
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId") || undefined;
    const logs = await getAuditLogs(applicationId);
    return NextResponse.json({ success: true, auditLogs: logs, count: logs.length });
  } catch (error: any) {
    console.error("[API gov/audit GET]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await validateGovSession(request);
    if (!auth.success) {
      return auth.error?.toLowerCase().includes("forbidden")
        ? forbiddenResponse(auth.error!)
        : unauthorizedResponse(auth.error!);
    }

    const body = await request.json();
    const entry = await addAuditLog(body);
    return NextResponse.json({ success: true, logEntry: entry }, { status: 201 });
  } catch (error: any) {
    console.error("[API gov/audit POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
