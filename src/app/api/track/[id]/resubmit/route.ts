import { NextRequest, NextResponse } from "next/server";
import { citizenResubmitCorrection, getApplicationById } from "@/lib/server/db";
import { validateCitizenSession, unauthorizedResponse, forbiddenResponse } from "@/lib/server/auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateCitizenSession(request);
    if (!auth.success) {
      return unauthorizedResponse(auth.error!);
    }

    const { id } = await context.params;
    const app = await getApplicationById(id);

    if (!app) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    const body = await request.json();
    const { updatedFields } = body;

    const result = await citizenResubmitCorrection(id, updatedFields || {});

    return NextResponse.json({ success: true, application: result });
  } catch (error: any) {
    console.error("[API track/[id]/resubmit POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
