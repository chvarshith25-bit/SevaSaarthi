import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { WorkflowRouter, ApplicationRoutingInput } from "@/lib/server/ai/workflow-router";
import { getAuthoritativeDb } from "@/lib/server/pg-db";
import { getApplicationById } from "@/lib/server/db";

export async function POST(request: NextRequest) {
  try {
    await getAuthoritativeDb();
    let token =
      request.cookies.get("FORMLY_CITIZEN_SESSION")?.value ||
      request.cookies.get("FORMLY_GOV_SESSION")?.value ||
      request.cookies.get("formly_citizen_session")?.value ||
      request.cookies.get("seva_saarthi_session")?.value;

    if (!token) {
      try {
        const cookieStore = await cookies();
        token =
          cookieStore.get("FORMLY_CITIZEN_SESSION")?.value ||
          cookieStore.get("FORMLY_GOV_SESSION")?.value ||
          cookieStore.get("formly_citizen_session")?.value ||
          cookieStore.get("seva_saarthi_session")?.value;
      } catch {
        // Outside Next.js async storage scope
      }
    }

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }


    const body = await request.json();
    const { applicationId, naturalText } = body;
    if (!applicationId && !naturalText) {
      return NextResponse.json({ success: false, error: "applicationId or naturalText required" }, { status: 400 });
    }

    // Optionally load existing application for context
    let existingApp: any = null;
    if (applicationId) {
      existingApp = await getApplicationById(applicationId);
    }

    const routingInput: ApplicationRoutingInput = {
      applicationId: applicationId || "PRE-SUBMIT-ROUTING",
      serviceName: naturalText || existingApp?.serviceName || "",
      applicationTitle: naturalText || existingApp?.serviceName || "Citizen Application",
      applicationDescription: naturalText || existingApp?.data?.remarks || "",
      category: existingApp?.category,
      stateCode: existingApp?.data?.state,
      documentTypes: existingApp?.documents ? Object.values(existingApp.documents).map((d: any) => d.type) : [],
      requestedBenefit: naturalText,
    };

    const requestId = crypto.randomUUID();
    const userId = null; // TODO: derive from token if needed

    const v1Recommendation = await WorkflowRouter.compareAndLog(routingInput, requestId, userId);

    return NextResponse.json({ success: true, recommendation: v1Recommendation, requestId });
  } catch (error: any) {
    console.error("[API v1/router/compare POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
