# SevaSaarthi Chrome Extension: Production Deployment & Operation Guide

**Document Reference:** `DOC-EXT-2026-PRODUCTION-DEPLOYMENT`  
**Privacy & Security Framework:** `DPDP-aligned privacy, consent and security safeguards / Digital Public Infrastructure (DPI)`  
**Extension Version:** `1.2.0`  
**Manifest Version:** `3`  
**Validation Status:** `REAL CHROME EXTENSION VERIFIED` | `CONTROLLED DEMO PORTAL VERIFIED`

---

## 1. Extension Architecture Overview

The SevaSaarthi Chrome Extension is a sovereign client-side browser automation engine that performs **real form-field autofill** and **real document attachment** onto Indian Digital Public Infrastructure (DPI) and welfare portals.

```
+----------------------------------------------------------------------------------------------------+
|                                    SEVASAARTHI BROWSER EXTENSION                                   |
|                                                                                                    |
|   +-----------------------+           +----------------------+         +------------------------+  |
|   |      popup.html       |           |    background.js     |         |       content.js       |  |
|   | (Vault Profile Strip, |<--------->| (Service Worker / SW)|<------->| (DOM Scanner, DPDP     |  |
|   |  Portal Quick Link)   |           | (Topological CAPTCHA |         |  Consent, DataTransfer |  |
|   +-----------+-----------+           |  Offscreen Decoder)  |         |  File Attachment)      |  |
|               |                       +----------------------+         +-----------+------------+  |
|               |                                                                    |               |
|               +-------------------------------+------------------------------------+               |
|                                               |                                                    |
|                                               v                                                    |
|                                   +-----------------------+                                        |
|                                   |       config.js       |                                        |
|                                   | (Production / Local   |                                        |
|                                   |  Domain Authorization)|                                        |
|                                   +-----------+-----------+                                        |
+-----------------------------------------------|----------------------------------------------------+
                                                |
              Ephemeral Single-Use Ticket       | In-Memory Binary Stream
              HMAC-SHA256 (60s TTL)             | (Zero Local Disk Persistence)
                                                v
+----------------------------------------------------------------------------------------------------+
|                                     SEVASAARTHI SECURE VAULT                                       |
|                                                                                                    |
|    1. GET  /api/vault/documents  -> Authenticated citizen verified documents metadata              |
|    2. POST /api/vault/ticket     -> Issues 60-second single-use HMAC token                         |
|    3. POST /api/vault/export-blob-> Validates token, emits DPDP audit event, streams binary PDF    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Production API Configuration & Environment Separation

The extension decouples development environments from production through [`extension/config.js`](file:///c:/Formly-main/extension/config.js).

### Configuration Parameters
| Parameter | Default Value | Description |
|:---|:---|:---|
| `PRODUCTION_ORIGIN` | `https://sevasaarthi.gov.in` | Sovereign production portal origin. |
| `LOCAL_ORIGIN` | `http://localhost:3000` | Local development testbed origin. |
| `TICKET_TTL_MS` | `60000` | Ephemeral single-use authorization ticket window (60 seconds). |
| `AUTHORIZED_TARGET_DOMAINS` | `[*.gov.in, *.nic.in, *.ac.in, ...]` | List of authorized government and educational portal domains. |

### Dynamic Origin Resolution Priority
1. **Admin / User Storage Override:** `chrome.storage.local.get(["customApiOrigin"])` (allows pointed enterprise/demo deployment without modifying code).
2. **Local Environment Detection:** Automatically connects to `http://localhost:3000` if the browser is currently running on `localhost` or `127.0.0.1`.
3. **Production Fallback:** Connects to `https://sevasaarthi.gov.in`.

---

## 3. Manifest Permissions Audit & Justifications

The manifest (`extension/manifest.json`) adheres to the principle of least privilege:

| Permission | Scope | Technical Justification |
|:---|:---:|:---|
| `activeTab` | Tab | Grants temporary access to the active tab when the citizen clicks the extension action or keyboard shortcut. |
| `scripting` | Execution | Enables injecting the autofill engine into dynamic portals and multi-frame contexts. |
| `storage` | Browser Memory | Caches non-sensitive profile attributes and verified document counts locally in browser memory. |
| `host_permissions` | `<all_urls>` | Required because government portals reside across various central (`.gov.in`), state (`.nic.in`), education (`.ac.in`), and banking domains. |
| `exclude_matches` | Security Guard | Explicitly excludes CAPTCHA and anti-bot challenge sandboxes (`*://*.google.com/recaptcha/*`, `*://*.hcaptcha.com/*`, `*://challenges.cloudflare.com/*`). |

---

## 4. End-to-End Vault Security & DPDP Compliance

```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Citizen / User
    participant Ext as Extension (content.js)
    participant Vault as SevaSaarthi Backend
    participant Dom as Portal File Control

    Citizen->>Ext: Clicks "Autofill & Attach Documents"
    Ext->>Vault: GET /api/vault/documents (with cookie session)
    Vault-->>Ext: Returns verified metadata (Aadhaar, Income, etc.)
    Ext->>Ext: Match required <input type="file"> controls
    Ext->>Citizen: Renders In-Page DPDP Consent Dialog
    Citizen->>Ext: Clicks "✓ Authorize & Attach"
    
    loop For each matched requirement
        Ext->>Vault: POST /api/vault/ticket { docId, docType, targetOrigin }
        Vault-->>Ext: Returns 60s Single-Use HMAC-SHA256 Ticket
        Ext->>Vault: GET /api/vault/export-blob?ticket=...
        Vault->>Vault: Enforce Single-Use (Add nonce to consumed set)
        Vault->>Vault: Write Append-Only DOCUMENT_UPLOAD_STARTED Audit Event
        Vault-->>Ext: Streams binary PDF (application/pdf)
        Ext->>Dom: Injects File object via DataTransfer API
        Ext->>Dom: Dispatches bubbling 'input' and 'change' events
    end

    Ext->>Ext: Renders Human Submission Gate
    Citizen->>Dom: Reviews form and manually clicks Submit
```

### Security Invariants
- **Single-Use Replay Prevention:** Each ticket contains a cryptographically secure random 16-byte nonce. Once consumed, the nonce is recorded in the server's consumed registry. Replaying the ticket returns `HTTP 403 (TICKET_ALREADY_USED)`.
- **Zero Local Disk Persistence:** Document bytes are streamed directly into volatile browser RAM (`ArrayBuffer` $\rightarrow$ `Blob` $\rightarrow$ `File`). No temporary PDF files are created on the user's hard drive.
- **Append-Only Tamper-Evident Audit Logging:** Every document transfer generates an immutable audit record in PostgreSQL with SHA-256 integrity hashing. Database triggers prohibit `UPDATE` and `DELETE` on audit events.

---

## 5. Target-Domain Authorization & DPDP Consent Gate

To prevent documents from being transferred to unauthorized or malicious websites, the extension implements a two-tier gate:

1. **Domain Whitelist Verification:** Target hostnames are matched against `AUTHORIZED_TARGET_DOMAINS` and `AUTHORIZED_DOMAIN_SUFFIXES` (`.gov.in`, `.nic.in`, `.ac.in`, `.edu.in`).
2. **Explicit User Authorization:** Before any ticket is requested or document blob downloaded, the in-page consent modal displays:
   - **Target Portal:** `${window.location.hostname}` with an official badge (`GOV / DPI PORTAL` or `EXTERNAL DESTINATION`).
   - **Document List:** Specific verified documents and file sizes.
   - **Action Buttons:** `✓ Authorize & Attach` or `Cancel`.
3. **Fail-Closed Behavior:** Clicking `Cancel` immediately terminates the operation with zero files transferred or attached.

---

## 6. Demonstration Documents Notice

All documents generated in the testbed environment are watermarked and labeled:
```
*** SYNTHETIC DEMONSTRATION DOCUMENT - NOT A REAL GOVERNMENT RECORD ***
*** FOR TESTING, EVALUATION & DEMONSTRATION PURPOSES ONLY ***
```
Synthetic demonstration documents contain generated sample attributes and must never be used as genuine legal documentation.

---

## 7. Production Installation & Maintenance Procedure

### Developer Mode Installation (Local / Evaluation):
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in upper right).
3. Click **Load unpacked** and select `c:\Formly-main\extension`.
4. The extension icon will appear in the Chrome toolbar.

### Production Web Store Deployment Packaging:
1. Ensure `extension/config.js` is set to the production URL (`https://sevasaarthi.gov.in`).
2. Compress the contents of `extension/` into a standard ZIP archive:
   ```bash
   cd extension && zip -r ../sevasaarthi-extension-v1.2.0.zip ./*
   ```
3. Upload `sevasaarthi-extension-v1.2.0.zip` to the **Chrome Web Store Developer Dashboard**.

---

## 8. Dual Platform Vercel Deployment & Database Architecture

The SevaSaarthi repository supports running both the **Citizen Platform (SevaSaarthi)** and the **Government Operations Platform (Sarkar Seva)** as separate Vercel projects from a single codebase, controlled purely by environment variables.

### Vercel Project Configurations

```
+-----------------------------------------------------------------------------------------+
|                                    SINGLE CODEBASE                                      |
|                               (github.com/chvarshith25-bit/SevaSaarthi)                  |
+-----------------------------------------------------------------------------------------+
                               |                                           |
                               v                                           v
+---------------------------------------------+ +-----------------------------------------+
|        VERCEL PROJECT 1: SEVASAARTHI        | |        VERCEL PROJECT 2: SARKAR SEVA    |
|             (Citizen Platform)              | |             (Officer Platform)          |
|                                             | |                                         |
|  - Domain: sevasaarthi.gov.in               | |  - Domain: officer.sarkarseva.gov.in    |
|  - PLATFORM=citizen                         | |  - PLATFORM=government                  |
|  - Routes: /(citizen)/*, /api/*             | |  - Routes: /(government)/*, /api/*      |
|  - Route Isolation: Handled by middleware   | |  - Route Isolation: Handled by middleware|
+---------------------------------------------+ +-----------------------------------------+
                               |                                           |
                               +---------------------+---------------------+
                                                     |
                                                     v
                               +-------------------------------------------+
                               |            SUPABASE POSTGRESQL            |
                               |    - Persistent metadata & audit logs     |
                               |    - Private document storage buckets     |
                               |    - Append-only tamper-evident hashing   |
                               +-------------------------------------------+
```

### Production Environment Variables

| Variable | Platform | Required Value / Description |
|:---|:---:|:---|
| `PLATFORM` | Both | `citizen` for SevaSaarthi; `government` for Sarkar Seva. |
| `DATABASE_MODE` | Both | `production` (enforces PostgreSQL/Supabase; forbids ephemeral storage). |
| `DATABASE_URL` | Both | Transaction-pooled PostgreSQL connection URI (`postgres://...`). |
| `NEXT_PUBLIC_SUPABASE_URL` | Both | Supabase project endpoint (`https://<project>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Both | Public client anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | **Server-side only** elevated key for secure vault access and audit logging. |
| `NEXT_PUBLIC_APP_URL` | Both | Active public URL (`https://sevasaarthi.gov.in` or `https://officer.sarkarseva.gov.in`). |
| `VAULT_ENCRYPTION_KEY` | Server Only | 256-bit hexadecimal key for signing ephemeral single-use tickets. |

---

## 9. Verification Matrix & Deployment Scope Boundaries

```
+----------------------------------------------------------------------------------------------------+
|                                    CURRENT DEPLOYMENT STATUS                                       |
|                                                                                                    |
|  [✓] REAL CHROME EXTENSION VERIFIED (Chromium unpacked mode)                                       |
|  [✓] CONTROLLED DEMO PORTAL VERIFIED (http://localhost:3000/demo/scholarship-portal)               |
|  [✓] 24/24 Security & API Negative Tests Passed                                                    |
|  [✓] 18/18 Live Playwright Browser Checks Passed                                                   |
|  [✓] 0 TypeScript Compilation Errors                                                               |
|  [✓] Dual Platform Middleware Separation Verified                                                 |
+----------------------------------------------------------------------------------------------------+
```

### Realistic Scope Boundaries & Operating Prerequisites:
1. **Target Portal Scope:** The Chrome extension and document attachment mechanism have been verified against the controlled scholarship demonstration portal (`/demo/scholarship-portal`) with real HTML5 file inputs and standard DOM events.
2. **Dynamic External Portals:** Live external government portals (e.g., NSP 2.0, NSDL Protean) evolve DOM identifiers periodically. While the semantic classifier handles standard variations, custom or dynamic portal updates may require ongoing rule maintenance.
3. **Session Authentication:** The extension requires an active, authenticated citizen session in the browser to communicate with `/api/vault/*`.
4. **Human-in-the-Loop & Biometrics:** The extension automates field drafting and document attachment under explicit citizen consent; it does **not** bypass biometric scanners, SMS OTPs, or final citizen review. Final submission remains strictly in human hands.
5. **No Claims of Official Legal Certification:** This software is engineered to align with DPDP principles through ephemeral tickets, zero disk persistence, and append-only audit logs. It does not claim formal third-party regulatory certification or universal compatibility across all proprietary web systems.

