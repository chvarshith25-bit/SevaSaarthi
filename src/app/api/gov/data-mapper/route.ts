import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_SCHEMAS, mapToCanonical, mapFromCanonical, runCrossSystemValidation } from "@/lib/server/data-mapper";
import { validateGovSession, unauthorizedResponse, forbiddenResponse } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await validateGovSession(request);
    if (!auth.success) {
      return auth.error?.toLowerCase().includes("forbidden")
        ? forbiddenResponse(auth.error!)
        : unauthorizedResponse(auth.error!);
    }

    return NextResponse.json({ success: true, schemas: SYSTEM_SCHEMAS });
  } catch (error: any) {
    console.error("[API gov/data-mapper GET]", error);
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
    const { action, sourceSystem, targetSystem, payload, applicationData, identityData, documentData } = body;

    if (action === "MAP_TO_CANONICAL") {
      const canonical = mapToCanonical(sourceSystem, payload);
      return NextResponse.json({ success: true, canonical });
    }

    if (action === "MAP_FROM_CANONICAL") {
      const systemPayload = mapFromCanonical(targetSystem, payload);
      return NextResponse.json({ success: true, systemPayload });
    }

    if (action === "VALIDATE_CROSS_SYSTEM") {
      const checks = runCrossSystemValidation(applicationData, identityData, documentData);
      return NextResponse.json({ success: true, checks });
    }

    return NextResponse.json({ success: false, error: "Invalid mapper action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API gov/data-mapper POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
