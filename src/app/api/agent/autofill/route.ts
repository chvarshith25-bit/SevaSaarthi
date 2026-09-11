import { NextResponse } from "next/server";
import { AutofillPayload } from "@/lib/agent/browser-agent";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, sessionId, payload, userApproved } = body;

    if (action === "START_AGENT") {
      const newSessionId = `agent_${Date.now()}`;
      return NextResponse.json({
        success: true,
        sessionId: newSessionId,
        message: "Autonomous Browser Agent started for target portal: " + (payload?.portalUrl || "https://scholarships.gov.in"),
        initialState: "LAUNCHING_BROWSER",
      });
    }

    if (action === "CONFIRM_SUBMIT") {
      if (!userApproved) {
        return NextResponse.json({
          success: true,
          message: "User declined submission. Browser session safely closed without submitting.",
          state: "ABORTED",
        });
      }

      const generatedAppId = `NSP2026-${Math.floor(1000000 + Math.random() * 9000000)}`;
      return NextResponse.json({
        success: true,
        message: "Simulation: Application payload validated. Demonstration record generated in local sandbox.",
        environment: "SANDBOX_DEMO",
        state: "COMPLETED",
        applicationId: generatedAppId,
        submittedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Agent execution error" }, { status: 500 });
  }
}
