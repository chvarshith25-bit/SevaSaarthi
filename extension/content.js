// SevaSaarthi — Universal Citizen Application & Real Document Autofill Content Engine
// Implements Real Form-Field Autofill + Real <input type="file"> Attachment via DataTransfer API

(function () {
  // CRITICAL: NEVER run or inject inside any iframe (e.g. Google reCAPTCHA, Cloudflare, payment gateways)
  if (window !== window.top) {
    return;
  }

  // Guard against any captcha verification iframe URLs
  const currentUrl = (window.location.href || "").toLowerCase();
  if (
    currentUrl.includes("recaptcha") ||
    currentUrl.includes("hcaptcha") ||
    currentUrl.includes("turnstile") ||
    currentUrl.includes("challenge")
  ) {
    return;
  }

  async function getVaultOrigin() {
    if (typeof getSevaSaarthiOrigin === "function") {
      return await getSevaSaarthiOrigin();
    }
    return "http://localhost:3000";
  }

  console.log("🇮🇳 [SevaSaarthi Extension] Content Engine Active on:", window.location.href);

  // If on SevaSaarthi app itself, automatically sync profile & vault metadata
  getVaultOrigin().then((origin) => {
    if (window.location.origin === origin) {
      syncLocalPortalProfile();
    }
  });

  async function syncLocalPortalProfile() {
    try {
      const origin = await getVaultOrigin();
      const res = await fetch(`${origin}/api/profile`, { credentials: "include" });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const sessRes = await fetch(`${origin}/api/auth/session`, { credentials: "include" });
        const sess = await sessRes.json();
        const user = sess.user || {};

        const getVal = (k) => {
          const m = data.data.find((f) => f.field_name === k);
          return m && m.value ? m.value : "";
        };

        const fullName = getVal("full_name") || user.name || "Chiluveri Varshith";
        const parts = fullName.trim().split(" ");

        const profile = {
          fullName,
          firstName: parts[0] || "Varshith",
          lastName: parts.slice(1).join(" ") || "Chiluveri",
          dob: getVal("date_of_birth") || "2003-08-15",
          gender: getVal("gender") || "Male",
          aadhaar: getVal("aadhaar_number") || "583920194821",
          mobile: getVal("phone_number") || user.phone || "9876543210",
          email: getVal("email") || user.email || "varshith@example.com",
          income: getVal("annual_income") || "180000",
          college: getVal("college_name") || "Vidya Jyothi Institute of Technology",
          course: getVal("education_degree") || "B.Tech Computer Science & Engineering",
          rollNo: getVal("roll_number") || "22071A0589",
          category: getVal("caste_category") || "General",
          bankAccount: getVal("bank_account_no") || "38491029481",
          bankIfsc: getVal("bank_ifsc") || "SBIN0012948",
          bankName: getVal("bank_name") || "State Bank of India",
          fatherName: getVal("father_name") || "Ramesh Chiluveri",
          motherName: getVal("mother_name") || "Lakshmi Chiluveri",
          location: getVal("location") || "Hyderabad, Telangana",
          presentAddress: getVal("present_address_line1") || "Flat 402, Sri Sai Residency, Madhapur, Hyderabad - 500081",
          permanentAddress: getVal("permanent_address_line1") || "H.No 3-45/1, Gandhi Nagar, Warangal - 506001",
          pincode: getVal("present_pincode") || "500081",
          state: getVal("present_state") || "Telangana",
          district: getVal("present_district") || "Hyderabad",
        };

        // Also fetch verified vault documents list
        const vaultRes = await fetch("/api/vault/documents", { credentials: "include" });
        const vaultData = await vaultRes.json();
        const vaultDocs = vaultData.success && Array.isArray(vaultData.documents) ? vaultData.documents : [];

        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({
            userProfile: profile,
            vaultDocs: vaultDocs,
            lastSynced: Date.now(),
          });
          console.log(`✓ [SevaSaarthi Extension] Synced profile & ${vaultDocs.length} vault documents for:`, fullName);
        }
      }
    } catch (e) {
      // ignore on sync error
    }
  }

  // =========================================================================
  // 1. HELPER: FIELD VALUE SETTER & EVENT DISPATCHER (React / Angular Bypass)
  // =========================================================================
  function setValueAndDispatch(element, val) {
    if (!element || val === undefined || val === null || val === "") return;
    element.focus();

    const lastValue = element.value;
    element.value = val;

    // React 16/17/18/19 native value tracker reset
    const tracker = element._valueTracker;
    if (tracker) {
      tracker.setValue(lastValue);
    }

    // React native prototype value setter bypass
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    )?.set;

    if (element.tagName === "TEXTAREA" && nativeTextAreaValueSetter) {
      nativeTextAreaValueSetter.call(element, val);
    } else if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, val);
    }

    element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true, composed: true }));

    // Trigger jQuery event if present on page
    if (window.$ && typeof window.$(element).val === "function") {
      try {
        window.$(element).val(val).trigger("change");
      } catch (e) {}
    }

    element.style.border = "2px solid #10b981";
    element.style.backgroundColor = "#f0fdf4";
    element.style.boxShadow = "0 0 10px rgba(16, 185, 129, 0.3)";
  }

  function selectDropdown(selectEl, matchTextOrVal) {
    if (!selectEl || !matchTextOrVal) return false;
    let matched = false;
    for (let i = 0; i < selectEl.options.length; i++) {
      const opt = selectEl.options[i];
      if (
        opt.value.toLowerCase().includes(matchTextOrVal.toLowerCase()) ||
        opt.text.toLowerCase().includes(matchTextOrVal.toLowerCase())
      ) {
        selectEl.selectedIndex = i;
        matched = true;
        break;
      }
    }

    selectEl.dispatchEvent(new Event("change", { bubbles: true }));
    if (window.$ && typeof window.$(selectEl).trigger === "function") {
      try {
        window.$(selectEl).trigger("change");
      } catch (e) {}
    }
    return matched;
  }

  // =========================================================================
  // 2. DOCUMENT REQUIREMENT CLASSIFIER (Semantic Portal Detection)
  // =========================================================================
  function classifyDocumentRequirement(inputEl) {
    if (!inputEl || inputEl.type !== "file") return null;

    const id = (inputEl.id || "").toLowerCase();
    const name = (inputEl.name || "").toLowerCase();
    const ariaLabel = (inputEl.getAttribute("aria-label") || "").toLowerCase();
    const placeholder = (inputEl.getAttribute("placeholder") || "").toLowerCase();
    const accept = (inputEl.getAttribute("accept") || "").toLowerCase();

    // Find direct label
    let labelText = "";
    if (inputEl.labels && inputEl.labels.length > 0) {
      labelText = Array.from(inputEl.labels).map((l) => l.innerText).join(" ").toLowerCase();
    }
    if (!labelText && inputEl.id) {
      const matchingLabel = document.querySelector(`label[for="${inputEl.id}"]`);
      if (matchingLabel) labelText = matchingLabel.innerText.toLowerCase();
    }

    // Find parent container context / text
    const container = inputEl.closest(".form-group, .form-field, div, tr, td, p, section") || inputEl.parentElement;
    let surroundingText = "";
    if (container) {
      surroundingText = container.innerText.slice(0, 300).toLowerCase();
    }

    // Combine all textual context
    const haystack = `${id} ${name} ${ariaLabel} ${placeholder} ${labelText} ${surroundingText} ${accept}`;

    // AADHAAR
    if (
      haystack.includes("aadhaar") ||
      haystack.includes("aadhar") ||
      haystack.includes("uidai") ||
      haystack.includes("identity proof") ||
      haystack.includes("identity_proof") ||
      haystack.includes("photo id") ||
      haystack.includes("id proof")
    ) {
      return { type: "AADHAAR", label: "Aadhaar Card / Identity Proof" };
    }

    // INCOME CERTIFICATE
    if (
      haystack.includes("income") ||
      haystack.includes("income_cert") ||
      haystack.includes("annual income") ||
      haystack.includes("family income") ||
      haystack.includes("salary slip") ||
      haystack.includes("income proof")
    ) {
      return { type: "INCOME_CERTIFICATE", label: "Income Certificate" };
    }

    // COLLEGE ID / BONAFIDE
    if (
      haystack.includes("college") ||
      haystack.includes("college_id") ||
      haystack.includes("student id") ||
      haystack.includes("bonafide") ||
      haystack.includes("institution id") ||
      haystack.includes("study cert")
    ) {
      return { type: "COLLEGE_ID", label: "College ID / Bonafide Certificate" };
    }

    // MARKSHEET / ACADEMIC MEMO
    if (
      haystack.includes("marksheet") ||
      haystack.includes("mark sheet") ||
      haystack.includes("memo") ||
      haystack.includes("10th") ||
      haystack.includes("12th") ||
      haystack.includes("matriculation") ||
      haystack.includes("transcript") ||
      haystack.includes("academic cert")
    ) {
      return { type: "MARKSHEET", label: "10th / Academic Marksheet Memo" };
    }

    // CASTE CERTIFICATE
    if (
      haystack.includes("caste") ||
      haystack.includes("community") ||
      haystack.includes("category cert") ||
      haystack.includes("obc") ||
      haystack.includes("sc/st") ||
      haystack.includes("ews")
    ) {
      return { type: "CASTE_CERTIFICATE", label: "Caste / Category Certificate" };
    }

    // PAN CARD
    if (
      haystack.includes("pan") ||
      haystack.includes("pan_card") ||
      haystack.includes("pancard") ||
      haystack.includes("form 49a")
    ) {
      return { type: "PAN_CARD", label: "PAN Card Document" };
    }

    return { type: "OTHER", label: labelText || "Document Attachment" };
  }

  // =========================================================================
  // 3. VAULT DOCUMENT RETRIEVAL & EPHEMERAL TICKET HANDSHAKE
  // =========================================================================
  async function fetchVaultDocuments() {
    // 1. Try local storage cache
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      try {
        const stored = await chrome.storage.local.get(["vaultDocs"]);
        if (stored && Array.isArray(stored.vaultDocs) && stored.vaultDocs.length > 0) {
          return stored.vaultDocs;
        }
      } catch (e) {}
    }

    // 2. Fetch live from SevaSaarthi server
    try {
      const origin = await getVaultOrigin();
      const res = await fetch(`${origin}/api/vault/documents`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.documents)) {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ vaultDocs: data.documents });
        }
        return data.documents;
      }
    } catch (e) {}

    // 3. Fallback default verified demo documents
    return [
      {
        id: "d0000000-0000-0000-0000-000000000011",
        document_type: "AADHAAR",
        original_filename: "Aadhaar_Card_Varshith.pdf",
        mime_type: "application/pdf",
        status: "VERIFIED",
      },
      {
        id: "d0000000-0000-0000-0000-000000000012",
        document_type: "INCOME_CERTIFICATE",
        original_filename: "Income_Certificate_2025_26.pdf",
        mime_type: "application/pdf",
        status: "VERIFIED",
      },
      {
        id: "d0000000-0000-0000-0000-000000000013",
        document_type: "COLLEGE_ID",
        original_filename: "College_ID_VJIT.pdf",
        mime_type: "application/pdf",
        status: "VERIFIED",
      },
      {
        id: "d0000000-0000-0000-0000-000000000014",
        document_type: "MARKSHEET",
        original_filename: "Class_10_Matriculation_Memo.pdf",
        mime_type: "application/pdf",
        status: "VERIFIED",
      },
    ];
  }

  // Request short-lived single-use ticket
  async function requestDocumentTicket(docId, docType) {
    try {
      const origin = await getVaultOrigin();
      const res = await fetch(`${origin}/api/vault/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          document_id: docId,
          document_type: docType,
          target_origin: window.location.origin,
        }),
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        return data;
      }
      console.warn("[SevaSaarthi] Ticket API returned non-success:", res.status, data);
    } catch (e) {
      console.error("[SevaSaarthi] requestDocumentTicket exception:", e);
    }
    return null;
  }

  // Fetch binary blob using ephemeral single-use ticket
  async function fetchDocumentBlob(ticket) {
    try {
      const origin = await getVaultOrigin();
      const res = await fetch(`${origin}/api/vault/export-blob?ticket=${encodeURIComponent(ticket)}`);
      if (res.ok) {
        return await res.blob();
      }
      console.warn("[SevaSaarthi] export-blob API returned error:", res.status);
    } catch (e) {
      console.error("[SevaSaarthi] fetchDocumentBlob exception:", e);
    }
    return null;
  }

  // =========================================================================
  // 4. IN-PAGE HUMAN CONSENT DIALOG (DPDP Act 2023 Compliance)
  // =========================================================================
  function promptUserConsentForDocumentTransfer(docList) {
    return new Promise((resolve) => {
      const existing = document.getElementById("sevasaarthi-consent-modal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "sevasaarthi-consent-modal";
      modal.style.cssText = `
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483647 !important;
        background: rgba(15, 23, 42, 0.75) !important;
        backdrop-filter: blur(4px) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        padding: 16px !important;
      `;

      const docsHtml = docList
        .map(
          (d) => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">📄</span>
              <div>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${d.filename}</div>
                <div style="font-size: 10px; color: #64748b;">${d.reqLabel} (${d.mimeType})</div>
              </div>
            </div>
            <span style="font-size: 10px; font-weight: 700; color: #059669; background: #d1fae5; padding: 2px 8px; border-radius: 9999px;">VERIFIED</span>
          </div>
        `
        )
        .join("");

      const isAuthorizedDomain = typeof isTargetDomainAuthorized === "function"
        ? isTargetDomainAuthorized(window.location.hostname)
        : true;

      const domainBadge = isAuthorizedDomain
        ? `<span style="font-size: 10px; font-weight: 700; color: #047857; background: #d1fae5; padding: 2px 8px; border-radius: 9999px;">GOV / DPI PORTAL</span>`
        : `<span style="font-size: 10px; font-weight: 700; color: #b45309; background: #fef3c7; padding: 2px 8px; border-radius: 9999px;">EXTERNAL DESTINATION</span>`;

      modal.innerHTML = `
        <div style="background: white; border-radius: 24px; max-width: 440px; width: 100%; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid #e2e8f0; animation: modalPop 0.2s ease;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
            <div style="width: 38px; height: 38px; border-radius: 12px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 20px;">🛡️</div>
            <div>
              <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0;">Authorize Document Transfer</h3>
              <p style="font-size: 11px; color: #64748b; margin: 0;">DPDP Act 2023 Explicit Consent Gate</p>
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Destination Portal</div>
              <div style="font-size: 12px; font-weight: 800; color: #0f172a; font-family: monospace;">${window.location.hostname}</div>
            </div>
            ${domainBadge}
          </div>
          
          <p style="font-size: 12px; color: #334155; line-height: 1.5; margin-bottom: 14px;">
            SevaSaarthi has matched <strong>${docList.length} verified vault documents</strong>. Do you authorize secure in-memory attachment for this portal?
          </p>

          <div style="max-height: 200px; overflow-y: auto; margin-bottom: 18px;">
            ${docsHtml}
          </div>

          <div style="display: flex; gap: 10px;">
            <button id="sevasaarthi-btn-consent-allow" style="flex: 1; background: #4f46e5; color: white; border: none; padding: 11px 16px; border-radius: 12px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
              <span>✓ Authorize & Attach</span>
            </button>
            <button id="sevasaarthi-btn-consent-cancel" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 11px 16px; border-radius: 12px; font-size: 12px; font-weight: 600; cursor: pointer;">
              Cancel
            </button>
          </div>
        </div>
      `;

      document.documentElement.appendChild(modal);

      document.getElementById("sevasaarthi-btn-consent-allow").onclick = () => {
        modal.remove();
        resolve(true);
      };

      document.getElementById("sevasaarthi-btn-consent-cancel").onclick = () => {
        modal.remove();
        resolve(false);
      };
    });
  }

  // =========================================================================
  // 5. REAL PROGRAMMATIC FILE ATTACHMENT VIA DATATRANSFER API
  // =========================================================================
  async function attachDocumentToFileControl(fileInput, blob, filename, mimeType) {
    if (!fileInput || !blob) return { success: false, error: "Missing input or blob." };

    try {
      // 1. Construct standard W3C DOM File object from in-memory binary stream
      const file = new File([blob], filename, {
        type: mimeType || "application/pdf",
        lastModified: Date.now(),
      });

      // 2. Create DataTransfer container
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      // 3. Assign FileList to native HTML file input
      fileInput.files = dataTransfer.files;

      // 4. Dispatch bubbling events for React, Angular, Vue, and Vanilla JS listeners
      fileInput.dispatchEvent(new Event("input", { bubbles: true }));
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      fileInput.dispatchEvent(new Event("blur", { bubbles: true }));

      // 5. Post-attachment verification: Check actual FileList length & properties
      const isVerified =
        fileInput.files &&
        fileInput.files.length > 0 &&
        fileInput.files[0].name === filename &&
        fileInput.files[0].size === file.size;

      if (isVerified) {
        fileInput.style.border = "2px solid #10b981";
        fileInput.style.backgroundColor = "#f0fdf4";
        fileInput.style.boxShadow = "0 0 10px rgba(16, 185, 129, 0.35)";

        // Inject attached badge next to input if possible
        const badgeId = `sevasaarthi-badge-${fileInput.id || Math.random().toString(36).slice(2)}`;
        let badge = document.getElementById(badgeId);
        if (!badge) {
          badge = document.createElement("span");
          badge.id = badgeId;
          badge.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            font-weight: 700;
            color: #047857;
            background: #d1fae5;
            padding: 3px 8px;
            border-radius: 9999px;
            margin-top: 4px;
          `;
          badge.innerHTML = `<span>✓</span><span>Attached: ${filename}</span>`;
          fileInput.parentElement?.appendChild(badge);
        }

        console.log(`✓ [SevaSaarthi Real Attachment] Successfully attached ${filename} (${file.size} bytes) to`, fileInput);
        return { success: true, filename, size: file.size };
      } else {
        return { success: false, error: "FileList verification failed." };
      }
    } catch (err) {
      console.error("[SevaSaarthi File Attachment Error]", err);
      return { success: false, error: err.message };
    }
  }

  // =========================================================================
  // 6. HUMAN SUBMISSION GATE (Explicit Pause Before Final Submission)
  // =========================================================================
  function renderHumanSubmissionGate(fieldsCount, docsCount) {
    const existing = document.getElementById("sevasaarthi-submission-gate");
    if (existing) existing.remove();

    const gate = document.createElement("div");
    gate.id = "sevasaarthi-submission-gate";
    gate.style.cssText = `
      position: fixed !important;
      bottom: 24px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      z-index: 2147483647 !important;
      background: #0f172a !important;
      color: white !important;
      padding: 16px 22px !important;
      border-radius: 20px !important;
      box-shadow: 0 20px 45px rgba(0,0,0,0.4) !important;
      border: 2px solid #6366f1 !important;
      display: flex !important;
      align-items: center !important;
      gap: 18px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      animation: slideUp 0.3s ease !important;
    `;

    gate.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 36px; height: 36px; border-radius: 10px; background: #6366f1; display: flex; align-items: center; justify-content: center; font-size: 18px;">⚡</div>
        <div>
          <div style="font-size: 13px; font-weight: 800;">READY FOR CITIZEN REVIEW</div>
          <div style="font-size: 11px; color: #94a3b8;">
            Fields: <strong style="color: #34d399;">${fieldsCount} Filled</strong> • Documents: <strong style="color: #34d399;">${docsCount} Attached</strong>
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="sevasaarthi-btn-gate-submit" style="background: #10b981; color: white; border: none; padding: 9px 16px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);">
          ✓ Ready to Submit
        </button>
        <button id="sevasaarthi-btn-gate-dismiss" style="background: #334155; color: #cbd5e1; border: none; padding: 9px 12px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer;">
          Dismiss
        </button>
      </div>
    `;

    document.documentElement.appendChild(gate);

    document.getElementById("sevasaarthi-btn-gate-submit").onclick = () => {
      gate.remove();
      // Scroll to submit button on portal
      const submitBtn = document.querySelector('button[type="submit"], input[type="submit"], #btn-nsp-submit, #btn-final-submit');
      if (submitBtn) {
        submitBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        submitBtn.style.outline = "4px solid #10b981";
      }
      showToastNotification("All fields & verified documents attached! Click Submit when ready.");
    };

    document.getElementById("sevasaarthi-btn-gate-dismiss").onclick = () => {
      gate.remove();
    };
  }

  // =========================================================================
  // 7. CORE EXECUTION ENGINE: FIELD AUTOFILL + REAL DOCUMENT ATTACHMENT
  // =========================================================================
  async function executeAutofill(passedProfile) {
    const existingGate = document.getElementById("sevasaarthi-submission-gate");
    if (existingGate) existingGate.remove();
    const existingToast = document.getElementById("sevasaarthi-toast");
    if (existingToast) existingToast.remove();

    let profile = passedProfile;

    // 1. Resolve Profile
    if (!profile && typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      try {
        const stored = await chrome.storage.local.get(["userProfile"]);
        if (stored && stored.userProfile) profile = stored.userProfile;
      } catch (e) {}
    }

    if (!profile) {
      try {
        const origin = await getVaultOrigin();
        const res = await fetch(`${origin}/api/profile`, { credentials: "include" });
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          profile = {};
          json.data.forEach((f) => {
            if (f.field_name === "full_name") {
              profile.fullName = f.value;
              const parts = f.value.trim().split(" ");
              profile.firstName = parts[0] || "";
              profile.lastName = parts.slice(1).join(" ") || "";
            }
            if (f.field_name === "date_of_birth") profile.dob = f.value;
            if (f.field_name === "phone_number") profile.mobile = f.value;
            if (f.field_name === "email") profile.email = f.value;
            if (f.field_name === "aadhaar_number") profile.aadhaar = f.value;
            if (f.field_name === "annual_income") profile.income = f.value;
            if (f.field_name === "college_name") profile.college = f.value;
            if (f.field_name === "education_degree") profile.course = f.value;
            if (f.field_name === "roll_number") profile.rollNo = f.value;
            if (f.field_name === "bank_account_no") profile.bankAccount = f.value;
            if (f.field_name === "bank_ifsc") profile.bankIfsc = f.value;
            if (f.field_name === "caste_category") profile.category = f.value;
          });
        }
      } catch (e) {}
    }

    if (!profile || !profile.fullName) {
      profile = {
        fullName: "Chiluveri Varshith",
        firstName: "Varshith",
        lastName: "Chiluveri",
        dob: "2003-08-15",
        gender: "Male",
        aadhaar: "583920194821",
        mobile: "9876543210",
        email: "varshith@example.com",
        income: "180000",
        category: "General",
        college: "Vidya Jyothi Institute of Technology",
        course: "B.Tech Computer Science & Engineering",
        rollNo: "22071A0589",
        bankAccount: "38491029481",
        bankIfsc: "SBIN0012948",
        fatherName: "Ramesh Chiluveri",
      };
    }

    let formattedDob = profile.dob || "";
    if (formattedDob && formattedDob.includes("-")) {
      const parts = formattedDob.split("-");
      if (parts.length === 3 && parts[0].length === 4) {
        formattedDob = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    let filledCount = 0;

    // A. Fill Protean PAN Card exact fields if present
    const proteanFirstName = document.getElementById("f_name_end");
    if (proteanFirstName && profile.firstName) { setValueAndDispatch(proteanFirstName, profile.firstName); filledCount++; }
    const proteanLastName = document.getElementById("l_name_end");
    if (proteanLastName && profile.lastName) { setValueAndDispatch(proteanLastName, profile.lastName); filledCount++; }
    const proteanDob = document.getElementById("date_of_birth_reg");
    if (proteanDob && formattedDob) { setValueAndDispatch(proteanDob, formattedDob); filledCount++; }
    const proteanEmail = document.getElementById("email_id2");
    if (proteanEmail && profile.email) { setValueAndDispatch(proteanEmail, profile.email); filledCount++; }
    const proteanMobile = document.getElementById("rvContactNo");
    if (proteanMobile && profile.mobile) { setValueAndDispatch(proteanMobile, profile.mobile); filledCount++; }
    const proteanConsent = document.getElementById("consent");
    if (proteanConsent) { proteanConsent.checked = true; proteanConsent.dispatchEvent(new Event("change", { bubbles: true })); filledCount++; }
    const proteanAppType = document.getElementById("type");
    if (proteanAppType) { if (selectDropdown(proteanAppType, "49A")) filledCount++; }

    // B. Generic Form-Field Scanner
    const allInputs = document.querySelectorAll("input:not([type='file']), select, textarea");
    allInputs.forEach((input) => {
      if (input.type === "hidden" || input.type === "submit" || input.type === "button") return;
      const id = (input.id || "").toLowerCase();
      const name = (input.name || "").toLowerCase();
      const placeholder = (input.getAttribute("placeholder") || "").toLowerCase();
      const ariaLabel = (input.getAttribute("aria-label") || "").toLowerCase();
      const label = input.labels && input.labels[0] ? input.labels[0].innerText.toLowerCase() : "";
      const text = `${id} ${name} ${placeholder} ${ariaLabel} ${label}`;

      if (input.value && input.value.trim().length > 0) return;

      if ((text.includes("fullname") || text.includes("applicant_name") || text.includes("candidate_name") || text.includes("name of applicant")) && profile.fullName) {
        setValueAndDispatch(input, profile.fullName); filledCount++;
      } else if ((text.includes("firstname") || text.includes("first_name") || text.includes("fname")) && profile.firstName) {
        setValueAndDispatch(input, profile.firstName); filledCount++;
      } else if ((text.includes("lastname") || text.includes("last_name") || text.includes("lname") || text.includes("surname")) && profile.lastName) {
        setValueAndDispatch(input, profile.lastName); filledCount++;
      } else if ((text.includes("mobile") || text.includes("phone") || text.includes("contact_no") || text.includes("cell")) && profile.mobile) {
        setValueAndDispatch(input, profile.mobile); filledCount++;
      } else if ((text.includes("email") || text.includes("e-mail") || text.includes("mailid")) && profile.email) {
        setValueAndDispatch(input, profile.email); filledCount++;
      } else if ((text.includes("dob") || text.includes("birth") || text.includes("date_of_birth")) && formattedDob) {
        setValueAndDispatch(input, input.type === "date" ? profile.dob : formattedDob); filledCount++;
      } else if ((text.includes("aadhaar") || text.includes("uid") || text.includes("adhar")) && profile.aadhaar) {
        setValueAndDispatch(input, profile.aadhaar); filledCount++;
      } else if ((text.includes("income") || text.includes("annual_income")) && profile.income) {
        setValueAndDispatch(input, profile.income); filledCount++;
      } else if ((text.includes("college") || text.includes("institution") || text.includes("university")) && profile.college) {
        setValueAndDispatch(input, profile.college); filledCount++;
      } else if ((text.includes("degree") || text.includes("course") || text.includes("branch")) && profile.course) {
        setValueAndDispatch(input, profile.course); filledCount++;
      } else if ((text.includes("roll") || text.includes("hallticket") || text.includes("reg_no")) && profile.rollNo) {
        setValueAndDispatch(input, profile.rollNo); filledCount++;
      } else if ((text.includes("account_no") || text.includes("account_number") || text.includes("bank_acc") || text.includes("bank_account")) && profile.bankAccount) {
        setValueAndDispatch(input, profile.bankAccount); filledCount++;
      } else if ((text.includes("ifsc") || text.includes("ifsc_code")) && profile.bankIfsc) {
        setValueAndDispatch(input, profile.bankIfsc); filledCount++;
      } else if ((text.includes("father") || text.includes("parent_name")) && profile.fatherName) {
        setValueAndDispatch(input, profile.fatherName); filledCount++;
      } else if (input.tagName.toLowerCase() === "select" && (text.includes("gender") || text.includes("sex")) && profile.gender) {
        if (selectDropdown(input, profile.gender)) filledCount++;
      } else if (input.tagName.toLowerCase() === "select" && (text.includes("category") || text.includes("caste")) && profile.category) {
        if (selectDropdown(input, profile.category)) filledCount++;
      }
    });

    // C. REAL DOCUMENT ATTACHMENT PIPELINE
    const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
    let attachedDocCount = 0;

    if (fileInputs.length > 0) {
      console.log(`🔍 [SevaSaarthi] Found ${fileInputs.length} file upload control(s). Classifying requirements...`);
      const vaultDocs = await fetchVaultDocuments();

      // Correlate requirements with available vault documents
      const matchPlan = [];
      for (const input of fileInputs) {
        const req = classifyDocumentRequirement(input);
        if (!req) continue;

        const matchedDoc = vaultDocs.find(
          (d) => d.document_type === req.type && !d.is_superseded && d.status === "VERIFIED"
        );

        if (matchedDoc) {
          matchPlan.push({
            inputEl: input,
            requirementType: req.type,
            reqLabel: req.label,
            docId: matchedDoc.id,
            filename: matchedDoc.original_filename || `${req.type}.pdf`,
            mimeType: matchedDoc.mime_type || "application/pdf",
          });
        }
      }

      // If matches found, prompt for human consent
      if (matchPlan.length > 0) {
        const userApproved = await promptUserConsentForDocumentTransfer(matchPlan);

        if (userApproved) {
          for (const item of matchPlan) {
            try {
              console.log(`[SevaSaarthi] Requesting ticket for ${item.filename} (${item.requirementType})...`);
              // 1. Get single-use ticket
              const ticketRes = await requestDocumentTicket(item.docId, item.requirementType);
              console.log(`[SevaSaarthi] Ticket response for ${item.filename}:`, ticketRes ? "Received Ticket" : "FAILED");
              if (ticketRes && ticketRes.ticket) {
                // 2. Fetch binary stream into memory
                console.log(`[SevaSaarthi] Fetching binary blob for ${item.filename}...`);
                const blob = await fetchDocumentBlob(ticketRes.ticket);
                console.log(`[SevaSaarthi] Blob result for ${item.filename}:`, blob ? `Blob size ${blob.size}B` : "FAILED");
                if (blob) {
                  // 3. Attach using DataTransfer API
                  const res = await attachDocumentToFileControl(item.inputEl, blob, item.filename, item.mimeType);
                  console.log(`[SevaSaarthi] Attach result for ${item.filename}:`, res);
                  if (res.success) {
                    attachedDocCount++;
                  }
                }
              }
            } catch (err) {
              console.warn(`[SevaSaarthi] Failed to attach ${item.filename}`, err);
            }
          }
        }
      }
    }

    // D. Show toast notification & Human Submission Gate
    showToastNotification(
      `SevaSaarthi Autofilled ${filledCount} field(s) & Attached ${attachedDocCount} document(s)`
    );

    renderHumanSubmissionGate(filledCount, attachedDocCount);
  }

  // Auto-dismissing Toast
  function showToastNotification(message) {
    const existing = document.getElementById("sevasaarthi-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "sevasaarthi-toast";
    toast.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      z-index: 2147483647 !important;
      background: #0f172a !important;
      color: #ffffff !important;
      padding: 10px 18px !important;
      border-radius: 12px !important;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4) !important;
      border: 1px solid #6366f1 !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      pointer-events: none !important;
      animation: fadeIn 0.2s ease !important;
    `;
    toast.innerHTML = `
      <span style="color: #34d399; font-size: 16px; font-weight: bold;">✓</span>
      <span>${message}</span>
    `;

    document.documentElement.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Floating Trigger Button
  async function injectFloatingTrigger() {
    if (window !== window.top) return;
    const origin = await getVaultOrigin();
    if (window.location.origin === origin && !window.location.pathname.includes("/demo/")) return;
    if (document.getElementById("sevasaarthi-floating-widget")) return;

    const widget = document.createElement("div");
    widget.id = "sevasaarthi-floating-widget";
    widget.innerHTML = `
      <button id="sevasaarthi-btn-trigger" style="position: fixed !important; bottom: 24px !important; right: 24px !important; z-index: 2147483647 !important; background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%) !important; color: white !important; padding: 10px 18px !important; font-size: 13px !important; font-weight: 700 !important; border-radius: 9999px !important; border: 2px solid white !important; box-shadow: 0 10px 30px rgba(79, 70, 229, 0.5) !important; cursor: pointer !important; display: flex !important; align-items: center !important; gap: 8px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; transition: transform 0.2s ease !important; margin: 0 !important;">
        <span style="font-size: 15px;">⚡</span>
        <span>Autofill & Attach Documents</span>
      </button>
    `;

    document.documentElement.appendChild(widget);

    document.getElementById("sevasaarthi-btn-trigger").onclick = async () => {
      const btn = document.getElementById("sevasaarthi-btn-trigger");
      btn.innerHTML = `<span style="font-size: 14px;">⏳</span> <span>Autofilling...</span>`;
      btn.style.background = "#10b981";
      try {
        await executeAutofill();
      } finally {
        btn.innerHTML = `<span style="font-size: 14px;">✓</span> <span>Complete!</span>`;
        setTimeout(() => {
          btn.innerHTML = `<span style="font-size: 15px;">⚡</span> <span>Autofill & Attach Documents</span>`;
          btn.style.background = "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)";
        }, 2500);
      }
    };
  }

  // Observe DOM for dynamically created forms / inputs
  const domObserver = new MutationObserver(() => {
    injectFloatingTrigger();
  });
  domObserver.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectFloatingTrigger);
  } else {
    injectFloatingTrigger();
  }

  // Listen for messages from popup
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "AUTOFILL_NOW") {
        executeAutofill(request.profile).then(() => {
          sendResponse({ status: "success" });
        });
        return true;
      }
    });
  }
})();
