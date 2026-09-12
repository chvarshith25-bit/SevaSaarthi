import { NextResponse } from "next/server";
import { authenticateSession, getUserDocuments, addDocumentForUser, getUserExtractedFields } from "@/lib/server/db";
import { extractDocumentFields } from "@/lib/ocr/ocr-engine";
import { DocumentType, DocumentRow, ExtractedField } from "@/types";
import { cookies } from "next/headers";

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
  return await authenticateSession(token);
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const docs = await getUserDocuments(user.id);
  const extracted = await getUserExtractedFields(user.id);

  return NextResponse.json({
    success: true,
    data: docs.map((doc) => ({
      ...doc,
      extracted_fields: extracted.filter((ef) => ef.document_id === doc.id),
    })),
  });
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = (formData.get("document_type") as DocumentType) || "OTHER";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File exceeds 10MB limit" }, { status: 400 });
    }

    const docId = `doc_${Date.now()}`;

    const newDoc: DocumentRow = {
      id: docId,
      user_id: user.id,
      document_type: documentType,
      storage_path: `vault/${file.name}`,
      original_filename: file.name,
      mime_type: file.type || "application/octet-stream",
      status: "VERIFIED",
      ocr_raw_text: null,
      is_superseded: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await addDocumentForUser(user.id, newDoc, []);

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      document: newDoc,
      extracted_fields: [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Upload failed" }, { status: 500 });
  }
}
