import { NextRequest, NextResponse } from "next/server";
import { retryApplicationVerification, resetApplicationTimeout, getApplicationById, getAuditLogs } from "@/lib/server/db";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const app = await getApplicationById(id);

    if (!app) {
      return NextResponse.json({ success: false, error: `Application not found: ${id}` }, { status: 404 });
    }

    let isReset = false;
    try {
      const body = await request.json();
      if (body?.reset) isReset = true;
    } catch {}

    const result = isReset
      ? await resetApplicationTimeout(id)
      : await retryApplicationVerification(id);

    const logs = await getAuditLogs(id);

    return NextResponse.json({
      success: true,
      application: result,
      auditLogs: logs,
      message: isReset
        ? "Application reset to gateway timeout state (API_UNAVAILABLE)."
        : "Gateway reconnected! UIDAI and PAN deduplication checks succeeded.",
    });
  } catch (error: any) {
    console.error("[API track/[id]/retry POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
