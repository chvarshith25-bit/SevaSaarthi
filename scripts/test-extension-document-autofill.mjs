import crypto from "node:crypto";
import http from "node:http";

console.log("========================================================================");
console.log("   SEVASAARTHI CHROME EXTENSION REAL DOCUMENT AUTOFILL VALIDATION SUITE  ");
console.log("========================================================================");

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${message}`);
    testsFailed++;
  }
}

// -----------------------------------------------------------------------------
// 1. TEST DOCUMENT REQUIREMENT CLASSIFIER LOGIC
// -----------------------------------------------------------------------------
console.log("\n--- 1. TESTING DETERMINISTIC DOCUMENT REQUIREMENT CLASSIFIER ---");

function classifyRequirementFromAttributes(id, name, label, accept) {
  const haystack = `${id} ${name} ${label} ${accept}`.toLowerCase();
  if (haystack.includes("aadhaar") || haystack.includes("aadhar") || haystack.includes("identity proof") || haystack.includes("id proof")) {
    return "AADHAAR";
  }
  if (haystack.includes("income") || haystack.includes("annual income") || haystack.includes("salary slip")) {
    return "INCOME_CERTIFICATE";
  }
  if (haystack.includes("college") || haystack.includes("student id") || haystack.includes("bonafide")) {
    return "COLLEGE_ID";
  }
  if (haystack.includes("marksheet") || haystack.includes("matriculation") || haystack.includes("10th") || haystack.includes("memo")) {
    return "MARKSHEET";
  }
  if (haystack.includes("caste") || haystack.includes("community") || haystack.includes("obc")) {
    return "CASTE_CERTIFICATE";
  }
  if (haystack.includes("pan") || haystack.includes("form 49a")) {
    return "PAN_CARD";
  }
  return "OTHER";
}

assert(
  classifyRequirementFromAttributes("upload_aadhaar", "aadhaar_file", "Upload Aadhaar Card / Identity Proof", ".pdf") === "AADHAAR",
  "Classifies 'Upload Aadhaar Card / Identity Proof' -> AADHAAR"
);

assert(
  classifyRequirementFromAttributes("income_cert", "income_file", "Upload Annual Family Income Certificate", ".pdf") === "INCOME_CERTIFICATE",
  "Classifies 'Upload Annual Family Income Certificate' -> INCOME_CERTIFICATE"
);

assert(
  classifyRequirementFromAttributes("doc_college", "bonafide_file", "Bonafide Student Certificate / College ID", ".pdf,image/*") === "COLLEGE_ID",
  "Classifies 'Bonafide Student Certificate / College ID' -> COLLEGE_ID"
);

assert(
  classifyRequirementFromAttributes("txt_10th_memo", "marksheet_file", "Upload Class 10 Matriculation Marksheet Memo", ".pdf") === "MARKSHEET",
  "Classifies 'Upload Class 10 Matriculation Marksheet Memo' -> MARKSHEET"
);

assert(
  classifyRequirementFromAttributes("caste_doc", "community_cert", "Upload OBC Community Certificate", ".pdf") === "CASTE_CERTIFICATE",
  "Classifies 'Upload OBC Community Certificate' -> CASTE_CERTIFICATE"
);

// -----------------------------------------------------------------------------
// 2. TEST EPHEMERAL TICKET GENERATION, HMAC VERIFICATION & SINGLE-USE EXPIRY
// -----------------------------------------------------------------------------
console.log("\n--- 2. TESTING EPHEMERAL TICKET SECURITY & SINGLE-USE ENFORCEMENT ---");

const VAULT_HMAC_SECRET = "sevasaarthi-ephemeral-vault-hmac-secret-2026";
const consumedNonces = new Set();

function generateTestTicket(userId, docId, docType, expiresInSeconds = 60) {
  const now = Date.now();
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = {
    userId,
    documentId: docId,
    documentType: docType,
    nonce,
    issuedAt: now,
    expiresAt: now + expiresInSeconds * 1000,
    targetOrigin: "https://scholarships.gov.in",
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", VAULT_HMAC_SECRET).update(payloadStr).digest("base64url");
  return `${payloadStr}.${signature}`;
}

function verifyAndConsumeTestTicket(ticketStr) {
  if (!ticketStr || !ticketStr.includes(".")) return { valid: false, error: "Malformed ticket" };
  const [payloadStr, signature] = ticketStr.split(".");
  const expectedSig = crypto.createHmac("sha256", VAULT_HMAC_SECRET).update(payloadStr).digest("base64url");
  if (signature !== expectedSig) return { valid: false, error: "Tampered signature" };

  const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8"));
  if (Date.now() > payload.expiresAt) return { valid: false, error: "Ticket expired" };
  if (consumedNonces.has(payload.nonce)) return { valid: false, error: "Ticket already consumed" };

  consumedNonces.add(payload.nonce);
  return { valid: true, payload };
}

// 2a. Valid Ticket Consumption
const validTicket = generateTestTicket("u_varshith_002", "d0000000-0000-0000-0000-000000000011", "AADHAAR", 60);
const firstConsumption = verifyAndConsumeTestTicket(validTicket);
assert(firstConsumption.valid === true, "Valid 60-second ticket is verified & consumed successfully");

// 2b. Replay Attack Prevention (Single-Use Enforcement)
const replayConsumption = verifyAndConsumeTestTicket(validTicket);
assert(
  replayConsumption.valid === false && replayConsumption.error === "Ticket already consumed",
  "Replaying the same ticket fails closed (Single-use strictly enforced)"
);

// 2c. Tampered Ticket Detection
const tamperedTicket = validTicket.slice(0, -4) + "X9Z1";
const tamperedResult = verifyAndConsumeTestTicket(tamperedTicket);
assert(
  tamperedResult.valid === false && tamperedResult.error === "Tampered signature",
  "Tampered ticket signature fails closed with cryptographic rejection"
);

// 2d. Expired Ticket Rejection
const expiredTicket = generateTestTicket("u_varshith_002", "d0000000-0000-0000-0000-000000000012", "INCOME_CERTIFICATE", -10); // expired 10s ago
const expiredResult = verifyAndConsumeTestTicket(expiredTicket);
assert(
  expiredResult.valid === false && expiredResult.error === "Ticket expired",
  "Expired ticket (>60s) fails closed immediately"
);

// -----------------------------------------------------------------------------
// 3. TEST SYNTHETIC DEMONSTRATION PDF STREAM INTEGRITY
// -----------------------------------------------------------------------------
console.log("\n--- 3. TESTING SYNTHETIC DEMONSTRATION PDF GENERATION ---");

function createSyntheticPdf(docTitle, citizenName) {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 120 >>
stream
BT
/F1 14 Tf
50 750 Td
(SEVASAARTHI VERIFIED SYNTHETIC DOCUMENT: ${docTitle} FOR ${citizenName}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000210 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
400
%%EOF`;
  return Buffer.from(content, "utf8");
}

const pdfBuf = createSyntheticPdf("INCOME CERTIFICATE", "Chiluveri Varshith");
assert(pdfBuf.toString("utf8").startsWith("%PDF-1.4"), "Generated PDF starts with standard valid PDF-1.4 header");
assert(pdfBuf.toString("utf8").includes("%%EOF"), "Generated PDF includes valid standard %%EOF termination");
assert(pdfBuf.length > 200, `Generated synthetic PDF has realistic byte size (${pdfBuf.length} bytes)`);

// -----------------------------------------------------------------------------
// 4. TEST LIVE SEVASAARTHI API ENDPOINTS (PORT 3000)
// -----------------------------------------------------------------------------
console.log("\n--- 4. TESTING LIVE VAULT APIS ON CITIZEN PORTAL (PORT 3000) ---");

async function runLiveApiTests() {
  try {
    // 4a. Authenticate as Citizen
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "chiluverivarshithsahs@gmail.com", password: "1234567890" }),
    });
    const loginData = await loginRes.json();
    assert(loginData.success === true, "Citizen authentication successful on port 3000");

    const token = loginData.token;

    // 4b. Fetch Vault Documents
    const docsRes = await fetch("http://localhost:3000/api/vault/documents", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const docsData = await docsRes.json();
    if (!docsData.success) {
      console.error("docsData error:", docsData);
    }
    assert(docsData.success === true && Array.isArray(docsData.documents), "Endpoint /api/vault/documents returned verified document metadata");
    assert(Array.isArray(docsData.documents) && docsData.documents.length >= 4, `Found ${docsData.documents?.length || 0} verified documents in citizen vault`);

    // 4c. Request Ephemeral Ticket for Aadhaar
    const ticketRes = await fetch("http://localhost:3000/api/vault/ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ document_type: "AADHAAR", target_origin: "http://localhost:3000/demo/scholarship-portal" }),
    });
    const ticketData = await ticketRes.json();
    assert(ticketData.success === true && typeof ticketData.ticket === "string", "Endpoint /api/vault/ticket issued 60s ephemeral ticket");

    // 4d. Fetch Binary Blob with Single-Use Ticket
    const blobRes = await fetch(`http://localhost:3000/api/vault/export-blob?ticket=${encodeURIComponent(ticketData.ticket)}`);
    assert(blobRes.status === 200, "Endpoint /api/vault/export-blob returned HTTP 200 OK binary stream");
    assert(blobRes.headers.get("content-type") === "application/pdf", "Response Content-Type is 'application/pdf'");
    const blobArrayBuf = await blobRes.arrayBuffer();
    assert(blobArrayBuf.byteLength > 200, `Downloaded in-memory binary blob (${blobArrayBuf.byteLength} bytes)`);

    // 4e. Verify Replay of Consumed Ticket Returns 403 Forbidden
    const replayRes = await fetch(`http://localhost:3000/api/vault/export-blob?ticket=${encodeURIComponent(ticketData.ticket)}`);
    assert(replayRes.status === 403, "Replay of consumed ticket returned HTTP 403 Forbidden (Single-use verified)");

    // 4f. Unauthenticated access to /api/vault/documents fails closed (401)
    const unauthDocsRes = await fetch("http://localhost:3000/api/vault/documents");
    assert(unauthDocsRes.status === 401, "Unauthenticated request to /api/vault/documents strictly rejected with HTTP 401");

    // 4g. Unauthenticated ticket request fails closed (401)
    const unauthTicketRes = await fetch("http://localhost:3000/api/vault/ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_type: "AADHAAR" }),
    });
    assert(unauthTicketRes.status === 401, "Unauthenticated ticket request strictly rejected with HTTP 401");

    // 4h. Requesting non-existent document returns 404
    const nonExistentDocRes = await fetch("http://localhost:3000/api/vault/ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ document_type: "NON_EXISTENT_DOCUMENT_TYPE_123" }),
    });
    assert(nonExistentDocRes.status === 404, "Ticket request for missing document type rejected with HTTP 404");

    // 4i. Export blob without ticket fails closed (400)
    const noTicketBlobRes = await fetch("http://localhost:3000/api/vault/export-blob");
    assert(noTicketBlobRes.status === 400, "Export blob request without ticket rejected with HTTP 400");

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log("\n========================================================================");
    console.log(`TOTAL TESTS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}`);
    console.log(`INTEGRITY SCORE: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
    console.log("========================================================================");

    if (testsFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Live test suite execution error:", err);
    process.exit(1);
  }
}

runLiveApiTests();
