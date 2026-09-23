import { NextResponse } from "next/server";
import { authenticateSession, getUserDocuments } from "@/lib/server/db";
import { generateVaultTicket } from "@/lib/server/vault-security";
import { cookies } from "next/headers";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Citizen session required to request document tickets." },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { document_id, target_origin, document_type } = body;

    if (!document_id && !document_type) {
      return NextResponse.json(
        { success: false, error: "document_id or document_type is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    const userDocs = await getUserDocuments(user.id);
    let targetDoc = document_id
      ? userDocs.find((d) => d.id === document_id)
      : userDocs.find((d) => d.document_type === document_type && !d.is_superseded && d.status === "VERIFIED");

    if (!targetDoc) {
      return NextResponse.json(
        {
          success: false,
          error: "Document not found or not in verified status in citizen vault.",
          reason: "DOCUMENT_NOT_AVAILABLE",
        },
        { status: 404, headers: corsHeaders }
      );
    }

    // Enforce verified status & not superseded
    if (targetDoc.is_superseded) {
      return NextResponse.json(
        {
          success: false,
          error: "Document has been superseded by a newer version.",
          reason: "DOCUMENT_SUPERSEDED",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (targetDoc.status !== "VERIFIED") {
      return NextResponse.json(
        {
          success: false,
          error: "Document has not passed statutory verification.",
          reason: "DOCUMENT_UNVERIFIED",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const { ticket, expiresIn, expiresAt } = generateVaultTicket(
      user,
      targetDoc,
      target_origin || "https://scholarships.gov.in"
    );

    return NextResponse.json(
      {
        success: true,
        ticket,
        expiresIn,
        expiresAt,
        document: {
          id: targetDoc.id,
          document_type: targetDoc.document_type,
          original_filename: targetDoc.original_filename || `${targetDoc.document_type}.pdf`,
          mime_type: targetDoc.mime_type || "application/pdf",
        },
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate document ticket." },
      { status: 500, headers: corsHeaders }
    );
  }
}
