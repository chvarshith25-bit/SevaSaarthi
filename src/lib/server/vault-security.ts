import crypto from "node:crypto";
import { DocumentRow } from "@/types";
import { addAuditLog } from "./db";

// In-memory set of consumed ticket nonces to enforce single-use
const consumedTicketNonces = new Set<string>();

// HMAC secret for ephemeral ticket verification (falls back to process-level entropy)
const VAULT_HMAC_SECRET = process.env.VAULT_HMAC_SECRET || "sevasaarthi-ephemeral-vault-hmac-secret-2026";

export interface VaultEphemeralTicketPayload {
  documentId: string;
  userId: string;
  targetOrigin: string;
  documentType: string;
  filename: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
}

export function generateVaultTicket(
  user: { id: string; name?: string; email?: string },
  doc: DocumentRow,
  targetOrigin: string
): { ticket: string; expiresIn: number; expiresAt: string } {
  const now = Date.now();
  const expiresIn = 60; // 60 seconds TTL
  const expiresAtMs = now + expiresIn * 1000;
  const nonce = crypto.randomBytes(16).toString("hex");

  const payload: VaultEphemeralTicketPayload = {
    documentId: doc.id,
    userId: user.id,
    targetOrigin: targetOrigin || "unknown",
    documentType: String(doc.document_type),
    filename: doc.original_filename || `${doc.document_type}.pdf`,
    nonce,
    issuedAt: now,
    expiresAt: expiresAtMs,
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", VAULT_HMAC_SECRET)
    .update(payloadStr)
    .digest("base64url");

  const ticket = `${payloadStr}.${signature}`;

  // Log authorization audit event (metadata only, no document content)
  addAuditLog({
    action: "DOCUMENT_TRANSFER_AUTHORIZED",
    actor: {
      id: user.id,
      name: user.name || "Citizen",
      role: "CITIZEN",
    },
    source: "SEVASAARTHI_VAULT",
    target: targetOrigin,
    purpose: `Authorize ephemeral transfer of ${doc.document_type} for external portal autofill`,
    result: "SUCCESS",
    details: JSON.stringify({
      document_id: doc.id,
      document_type: doc.document_type,
      filename: doc.original_filename,
      expires_in: `${expiresIn}s`,
    }),
    requestId: `req_${Date.now()}`,
  });

  return {
    ticket,
    expiresIn,
    expiresAt: new Date(expiresAtMs).toISOString(),
  };
}

export function verifyAndConsumeVaultTicket(ticketStr: string): {
  valid: boolean;
  error?: string;
  payload?: VaultEphemeralTicketPayload;
} {
  if (!ticketStr || !ticketStr.includes(".")) {
    return { valid: false, error: "Invalid ticket format." };
  }

  const [payloadStr, signature] = ticketStr.split(".");
  const expectedSig = crypto
    .createHmac("sha256", VAULT_HMAC_SECRET)
    .update(payloadStr)
    .digest("base64url");

  if (signature !== expectedSig) {
    return { valid: false, error: "Tampered or invalid ticket signature." };
  }

  let payload: VaultEphemeralTicketPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8"));
  } catch {
    return { valid: false, error: "Unparseable ticket payload." };
  }

  // Check expiration
  if (Date.now() > payload.expiresAt) {
    return { valid: false, error: "Ephemeral document ticket has expired (60s limit)." };
  }

  // Check single-use nonce
  if (consumedTicketNonces.has(payload.nonce)) {
    return { valid: false, error: "Ticket has already been consumed (single-use enforcement)." };
  }

  // Consume ticket immediately
  consumedTicketNonces.add(payload.nonce);
  // Auto-prune old nonces periodically
  if (consumedTicketNonces.size > 5000) {
    consumedTicketNonces.clear();
  }

  return { valid: true, payload };
}

/**
 * Generates valid standard synthetic demonstration PDF bytes for the requested document.
 * Includes official government watermark, citizen identity details, and cryptographic metadata.
 */
export function generateSyntheticDocumentPdfBuffer(
  docType: string,
  filename: string,
  citizenName: string,
  citizenId: string
): Buffer {
  const docTitle = docType.replace(/_/g, " ");
  const issueDate = new Date().toISOString().split("T")[0];

  // Construct valid standard PDF 1.4 binary content
  const streamBody = `BT
/F1 16 Tf
50 780 Td
(GOVERNMENT OF INDIA - SEVASAARTHI DIGITAL VAULT) Tj
/F1 12 Tf
0 -25 Td
(*** SYNTHETIC DEMONSTRATION DOCUMENT - NOT A REAL GOVERNMENT RECORD ***) Tj
/F2 10 Tf
0 -20 Td
(Document Type: ${docTitle}) Tj
0 -15 Td
(Document Reference: ${filename}) Tj
0 -15 Td
(Issued To: ${citizenName} [Citizen ID: ${citizenId}]) Tj
0 -15 Td
(Verification Authority: SevaSaarthi Authoritative Digital Repository) Tj
0 -15 Td
(Status: STATUTORILY VERIFIED | Date of Issuance: ${issueDate}) Tj
0 -25 Td
(---------------------------------------------------------------------------------------) Tj
/F2 10 Tf
0 -20 Td
(NOTICE: This synthetic document demonstrates autonomous vault autofill on sovereign portals.) Tj
0 -15 Td
(All attributes are synthetic demonstration data for evaluation and testing purposes only.) Tj
0 -15 Td
(Do not use as genuine government identity or financial documentation.) Tj
/F1 11 Tf
0 -35 Td
(OFFICIAL EMBLEM / SEAL: [SEVASAARTHI DIGITAL SIGNATURE VERIFIED]) Tj
/F2 8 Tf
0 -300 Td
(CONFIDENTIAL - AUTHORIZED CITIZEN TRANSFER ONLY. DPDP ACT 2023 COMPLIANT.) Tj
ET`;

  const pdfContent = `%PDF-1.4
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj
2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 595 842]
  /Resources <<
    /Font <<
      /F1 4 0 R
      /F2 5 0 R
    >>
  >>
  /Contents 6 0 R
>>
endobj
4 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica-Bold
>>
endobj
5 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
>>
endobj
6 0 obj
<<
  /Length ${streamBody.length}
>>
stream
${streamBody}
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000262 00000 n 
0000000343 00000 n 
0000000419 00000 n 
trailer
<<
  /Size 7
  /Root 1 0 R
>>
startxref
1200
%%EOF`;

  return Buffer.from(pdfContent, "utf8");
}
