import { NextResponse } from "next/server";
import {
  verifyAndConsumeVaultTicket,
  generateSyntheticDocumentPdfBuffer,
} from "@/lib/server/vault-security";
import { addAuditLog, getUserDocuments } from "@/lib/server/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketStr = searchParams.get("ticket");

    if (!ticketStr) {
      return NextResponse.json(
        { success: false, error: "Ephemeral authorization ticket query parameter is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    const verification = verifyAndConsumeVaultTicket(ticketStr);
    if (!verification.valid || !verification.payload) {
      return NextResponse.json(
        { success: false, error: verification.error || "Invalid or expired ticket." },
        { status: 403, headers: corsHeaders }
      );
    }

    const { documentId, userId, documentType, filename, targetOrigin } = verification.payload;

    // Log upload started audit event
    addAuditLog({
      action: "DOCUMENT_UPLOAD_STARTED",
      actor: {
        id: userId,
        name: "Citizen Vault Client",
        role: "CITIZEN",
      },
      source: "SEVASAARTHI_VAULT",
      target: targetOrigin,
      purpose: `Transmit verified document ${filename} (${documentType}) to ${targetOrigin}`,
      result: "SUCCESS",
      details: JSON.stringify({
        document_id: documentId,
        document_type: documentType,
        filename,
      }),
      requestId: `req_${Date.now()}`,
    });

    const pdfBuffer = generateSyntheticDocumentPdfBuffer(
      documentType,
      filename,
      "Chiluveri Varshith",
      userId
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to export document binary." },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ticketStr = body.ticket;

    if (!ticketStr) {
      return NextResponse.json(
        { success: false, error: "Ticket is required in body." },
        { status: 400, headers: corsHeaders }
      );
    }

    const verification = verifyAndConsumeVaultTicket(ticketStr);
    if (!verification.valid || !verification.payload) {
      return NextResponse.json(
        { success: false, error: verification.error || "Invalid or expired ticket." },
        { status: 403, headers: corsHeaders }
      );
    }

    const { documentId, userId, documentType, filename, targetOrigin } = verification.payload;

    addAuditLog({
      action: "DOCUMENT_UPLOAD_STARTED",
      actor: {
        id: userId,
        name: "Citizen Vault Client",
        role: "CITIZEN",
      },
      source: "SEVASAARTHI_VAULT",
      target: targetOrigin,
      purpose: `Transmit verified document ${filename} (${documentType}) to ${targetOrigin}`,
      result: "SUCCESS",
      details: JSON.stringify({
        document_id: documentId,
        document_type: documentType,
        filename,
      }),
      requestId: `req_${Date.now()}`,
    });

    const pdfBuffer = generateSyntheticDocumentPdfBuffer(
      documentType,
      filename,
      "Chiluveri Varshith",
      userId
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to export document binary." },
      { status: 500, headers: corsHeaders }
    );
  }
}
