import { NextResponse } from "next/server";
import { authenticateSession, getUserDocuments } from "@/lib/server/db";
import { cookies } from "next/headers";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

async function getAuthenticatedUser(request: Request) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("FORMLY_CITIZEN_SESSION")?.value ||
    cookieStore.get("formly_citizen_session")?.value ||
    cookieStore.get("seva_saarthi_session")?.value ||
    (request.headers.get("Authorization")?.startsWith("Bearer ")
      ? request.headers.get("Authorization")?.substring(7)
      : null);

  if (!token) return null;
  return authenticateSession(token);
}

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Active citizen session required." },
        { status: 401, headers: corsHeaders }
      );
    }

    const docs = await getUserDocuments(user.id);

    // Return only active, non-superseded, verified documents for extension consumption
    const activeDocs = docs
      .filter((d) => !d.is_superseded && d.status === "VERIFIED")
      .map((d) => ({
        id: d.id,
        document_type: d.document_type,
        original_filename: d.original_filename || `${d.document_type}.pdf`,
        mime_type: d.mime_type || "application/pdf",
        status: d.status,
        created_at: d.created_at,
      }));

    return NextResponse.json(
      {
        success: true,
        user: { id: user.id, name: user.name, email: user.email },
        documents: activeDocs,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to list vault documents." },
      { status: 500, headers: corsHeaders }
    );
  }
}
