import { NextRequest, NextResponse } from "next/server";
import { getAIExplanation } from "@/lib/server/db";
import { authenticateSession } from "@/lib/server/db";
import { cookies } from "next/headers";

async function getAuthenticatedUser(request: Request) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("seva_saarthi_session")?.value ||
    (request.headers.get("Authorization")?.startsWith("Bearer ")
      ? request.headers.get("Authorization")?.substring(7)
      : null);

  if (!token) return null;
  return authenticateSession(token);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const explanation = await getAIExplanation(id);

    if (!explanation) {
      return NextResponse.json({ success: false, error: "No AI explanation available for this application" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      explanation: explanation.explanation,
      recommendedActions: JSON.parse(explanation.recommended_actions || "[]"),
      type: explanation.assistance_type,
      sourceReason: explanation.source_reason,
    });
  } catch (error: any) {
    console.error("[API track/[id]/ai-explanation GET]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
