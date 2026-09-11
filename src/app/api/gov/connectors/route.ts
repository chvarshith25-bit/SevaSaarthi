import { NextRequest, NextResponse } from "next/server";
import { getConnectedSystems, updateSystemStatus, simulateConnectorCall } from "@/lib/server/connectors";
import { getConnectorRequests, addConnectorRequest } from "@/lib/server/db";
import { validateGovSession, unauthorizedResponse, forbiddenResponse } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await validateGovSession(request);
    if (!auth.success) {
      return auth.error?.toLowerCase().includes("forbidden")
        ? forbiddenResponse(auth.error!)
        : unauthorizedResponse(auth.error!);
    }

    const systems = getConnectedSystems();
    const requests = getConnectorRequests();
    return NextResponse.json({ success: true, systems, recentRequests: requests });
  } catch (error: any) {
    console.error("[API gov/connectors GET]", error);
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
    const { action, systemKey, status, latencyMs, applicationId, payload } = body;

    if (action === "UPDATE_STATUS") {
      const updated = updateSystemStatus(systemKey, status, latencyMs);
      return NextResponse.json({ success: true, system: updated });
    }

    if (action === "PING" || action === "INVOKE") {
      const result = await simulateConnectorCall(systemKey, action, applicationId || "DEMO-REQ", payload || {});
      if (result.requestRecord) {
        addConnectorRequest(result.requestRecord);
      }
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API gov/connectors POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
