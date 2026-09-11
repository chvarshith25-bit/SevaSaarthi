// Formly — Universal Citizen Application & Portal Autofill Content Engine

(function () {
  // CRITICAL: NEVER run or inject inside any iframe (e.g. Google reCAPTCHA, Cloudflare, payment gateways)
  if (window !== window.top) {
    return;
  }

  // Guard against any captcha or verification URLs
  const currentUrl = (window.location.href || "").toLowerCase();
  if (
    currentUrl.includes("recaptcha") ||
    currentUrl.includes("hcaptcha") ||
    currentUrl.includes("turnstile") ||
    currentUrl.includes("captcha")
  ) {
    return;
  }

  console.log("🇮🇳 [Formly Extension] Initialized on main frame:", window.location.href);

  // If on Formly app itself, listen and automatically sync profile to extension storage!
  if (window.location.origin === "http://localhost:3000") {
    syncLocalFormlyProfile();
  }

  async function syncLocalFormlyProfile() {
    try {
      const res = await fetch("/api/profile", { credentials: "include" });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const sessRes = await fetch("/api/auth/session", { credentials: "include" });
        const sess = await sessRes.json();
        const user = sess.user || {};

        const getVal = (k) => {
          const m = data.data.find((f) => f.field_name === k);
          return m && m.value ? m.value : "";
        };

        const fullName = getVal("full_name") || user.name || "";
        const parts = fullName.trim().split(" ");

        const profile = {
          fullName,
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" ") || "",
          dob: getVal("date_of_birth"),
          gender: getVal("gender") || "Male",
          aadhaar: getVal("aadhaar_number"),
          mobile: getVal("phone_number") || user.phone || "",
          email: getVal("email") || user.email || "",
          income: getVal("annual_income"),
          college: getVal("college_name"),
          course: getVal("education_degree"),
          rollNo: getVal("roll_number"),
          category: getVal("caste_category") || "General",
          bankAccount: getVal("bank_account_no"),
          bankIfsc: getVal("bank_ifsc"),
          fatherName: getVal("father_name"),
          location: getVal("location"),
        };

        if (chrome && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ userProfile: profile, userSession: user, lastSynced: Date.now() });
          console.log("✓ [Formly Extension] Synced citizen profile for:", fullName);
        }
      }
    } catch (e) {
      // ignore on local sync errors
    }
  }

  // Helper to trigger realistic input events and update React / Angular / Vue bindings
  function setValueAndDispatch(element, val) {
    if (!element || val === undefined || val === null || val === "") return;
    element.focus();
    element.value = val;

    // React native value setter bypass
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, val);
    }

    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));

    // Trigger jQuery event if present on page
    if (window.$ && typeof window.$(element).val === "function") {
      try {
        window.$(element).val(val).trigger("change");
      } catch (e) {}
    }

    element.style.border = "2px solid #10b981";
    element.style.backgroundColor = "#f0fdf4";
    element.style.boxShadow = "0 0 10px rgba(16, 185, 129, 0.4)";
  }

  // Helper to select dropdown options (including Select2)
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

  // Core Autofill Execution Function
  async function executeAutofill(passedProfile) {
    let profile = passedProfile;

    // 1. Try local extension storage if not passed
    if (!profile && chrome && chrome.storage && chrome.storage.local) {
      try {
        const stored = await chrome.storage.local.get(["userProfile"]);
        if (stored && stored.userProfile) {
          profile = stored.userProfile;
        }
      } catch (e) {}
    }

    // 2. Try fetching live from local Formly server with credentials
    if (!profile) {
      try {
        const res = await fetch("http://localhost:3000/api/profile", { credentials: "include" });
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
      alert("⚠️ No citizen profile found. Please open Formly (http://localhost:3000) and complete your profile details first.");
      return;
    }

    // Format DOB to DD/MM/YYYY if currently in YYYY-MM-DD
    let formattedDob = profile.dob || "";
    if (formattedDob && formattedDob.includes("-")) {
      const parts = formattedDob.split("-");
      if (parts.length === 3 && parts[0].length === 4) {
        formattedDob = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    let filledCount = 0;

    // A. PROTEAN / NSDL PAN CARD EXACT FIELD MATCHERS
    const proteanFirstName = document.getElementById("f_name_end");
    if (proteanFirstName && profile.firstName) {
      setValueAndDispatch(proteanFirstName, profile.firstName);
      filledCount++;
    }

    const proteanLastName = document.getElementById("l_name_end");
    if (proteanLastName && profile.lastName) {
      setValueAndDispatch(proteanLastName, profile.lastName);
      filledCount++;
    }

    const proteanDob = document.getElementById("date_of_birth_reg");
    if (proteanDob && formattedDob) {
      setValueAndDispatch(proteanDob, formattedDob);
      filledCount++;
    }

    const proteanEmail = document.getElementById("email_id2");
    if (proteanEmail && profile.email) {
      setValueAndDispatch(proteanEmail, profile.email);
      filledCount++;
    }

    const proteanMobile = document.getElementById("rvContactNo");
    if (proteanMobile && profile.mobile) {
      setValueAndDispatch(proteanMobile, profile.mobile);
      filledCount++;
    }

    const proteanConsent = document.getElementById("consent");
    if (proteanConsent) {
      proteanConsent.checked = true;
      proteanConsent.dispatchEvent(new Event("change", { bubbles: true }));
      filledCount++;
    }

    const proteanAppType = document.getElementById("type");
    if (proteanAppType) {
      if (selectDropdown(proteanAppType, "49A")) filledCount++;
    }

    const proteanCategory = document.getElementById("cat_applicant1");
    if (proteanCategory) {
      if (selectDropdown(proteanCategory, "INDIVIDUAL") || selectDropdown(proteanCategory, "P")) filledCount++;
    }

    // B. UNIVERSAL GENERIC MATCHERS (For NSP, PMAY, MeeSeva, college forms)
    const matchers = [
      { val: profile.lastName, keys: ["lastname", "last_name", "surname", "txtlastname", "l_name"] },
      { val: profile.firstName, keys: ["firstname", "first_name", "txtfirstname", "f_name"] },
      { val: profile.fullName, keys: ["fullname", "full_name", "applicantname", "applicant_name", "student_name", "name"] },
      { val: formattedDob || profile.dob, keys: ["dateofbirth", "date_of_birth", "dob", "birth", "txtdob"] },
      { val: profile.mobile, keys: ["mobile", "phonenumber", "phone_number", "contactno", "contact_no", "phone"] },
      { val: profile.email, keys: ["emailid", "email_id", "emailaddress", "email_address", "email"] },
      { val: profile.aadhaar, keys: ["aadhaar", "uid", "aadhar", "aadhaarno", "aadhaar_no"] },
      { val: profile.income, keys: ["annualincome", "annual_income", "familyincome", "family_income", "income"] },
      { val: profile.college, keys: ["institutename", "institute_name", "collegename", "college_name", "university", "college"] },
      { val: profile.course, keys: ["degree", "course", "branch", "program"] },
      { val: profile.rollNo, keys: ["rollno", "roll_no", "regno", "reg_no", "enrollment", "hallticket"] },
      { val: profile.bankAccount, keys: ["accountno", "account_no", "bankaccount", "bank_account", "account"] },
      { val: profile.bankIfsc, keys: ["ifsc", "ifsccode", "ifsc_code"] },
      { val: profile.fatherName, keys: ["fathername", "father_name", "father"] },
    ];

    document.querySelectorAll("input, textarea, select").forEach((input) => {
      if (input.type === "hidden" || input.type === "submit" || input.type === "button") return;
      if (input.value && input.value.trim().length > 0) return; // already populated

      if (input.type === "checkbox") {
        const checkName = (input.name || input.id || "").toLowerCase();
        if (checkName.includes("consent") || checkName.includes("term") || checkName.includes("agree") || checkName.includes("declaration")) {
          input.checked = true;
          input.dispatchEvent(new Event("change", { bubbles: true }));
          filledCount++;
        }
        return;
      }

      if (input.tagName.toLowerCase() === "select") {
        const selName = (input.name || input.id || "").toLowerCase();
        if (selName.includes("gender") && profile.gender) {
          if (selectDropdown(input, profile.gender)) filledCount++;
        } else if (selName.includes("category") && profile.category) {
          if (selectDropdown(input, profile.category)) filledCount++;
        }
        return;
      }

      const nameAttr = (input.getAttribute("name") || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const idAttr = (input.getAttribute("id") || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const placeholderAttr = (input.getAttribute("placeholder") || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const labelText = (input.labels && input.labels[0] ? input.labels[0].innerText : "").toLowerCase().replace(/[^a-z0-9]/g, "");

      for (const m of matchers) {
        if (!m.val) continue;
        const matches = m.keys.some((k) => {
          const cleanK = k.replace(/[^a-z0-9]/g, "");
          return nameAttr.includes(cleanK) || idAttr.includes(cleanK) || placeholderAttr.includes(cleanK) || labelText.includes(cleanK);
        });

        if (matches) {
          setValueAndDispatch(input, m.val);
          filledCount++;
          break;
        }
      }
    });

    // Show floating confirmation banner with actual user details
    showApprovalBanner(profile, filledCount);
  }

  // Floating Confirmation Banner
  function showApprovalBanner(profile, count) {
    let banner = document.getElementById("formly-approval-overlay");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "formly-approval-overlay";
      document.documentElement.appendChild(banner);
    }

    banner.innerHTML = `
      <div style="position: fixed; bottom: 85px; right: 24px; z-index: 2147483647; background: #0f172a; color: white; padding: 18px; border-radius: 20px; box-shadow: 0 25px 60px rgba(0,0,0,0.6); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 360px; border: 2px solid #10b981; animation: slideUp 0.3s ease;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: #10b981; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; color: black; font-weight: bold;">✓</div>
            <div>
              <strong style="font-size: 13px; display: block; color: #fff;">Formly Autofill Applied</strong>
              <span style="font-size: 10px; color: #94a3b8;">${count} field(s) populated with your verified data</span>
            </div>
          </div>
          <span style="font-size: 10px; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); font-weight: bold; padding: 2px 8px; border-radius: 9999px;">VERIFIED</span>
        </div>
        
        <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 12px; line-height: 1.5; background: #1e293b; padding: 10px; border-radius: 12px; border: 1px solid #334155;">
          Applicant: <strong style="color: #fff;">${profile.fullName || "—"}</strong><br/>
          ${profile.dob ? `DOB: <strong style="color: #fff;">${profile.dob}</strong> • ` : ""}${profile.mobile ? `Mobile: <strong style="color: #fff;">${profile.mobile}</strong><br/>` : ""}
          ${profile.aadhaar ? `Aadhaar: <strong style="color: #fff;">•••• •••• ${profile.aadhaar.slice(-4)}</strong>` : ""}
          <span style="color: #f59e0b; font-weight: bold; display: block; margin-top: 6px;">⚠️ Please solve any visible CAPTCHA and review all fields before clicking Submit.</span>
        </div>

        <button id="formly-banner-close" style="width: 100%; background: #334155; color: white; border: none; padding: 8px; border-radius: 10px; font-size: 11px; font-weight: bold; cursor: pointer;">Got It / Close Banner</button>
      </div>
    `;

    document.getElementById("formly-banner-close").onclick = () => banner.remove();
  }

  // Inject Floating Button onto Website (Bottom Right Corner Only)
  function injectFloatingTrigger() {
    // Strictly main window only - NEVER inside iframes/captchas
    if (window !== window.top) return;

    // Avoid injecting inside the Formly web app itself
    if (window.location.origin === "http://localhost:3000") return;
    if (document.getElementById("formly-floating-widget")) return;

    const widget = document.createElement("div");
    widget.id = "formly-floating-widget";
    widget.innerHTML = `
      <button id="formly-btn-trigger" style="position: fixed !important; bottom: 24px !important; right: 24px !important; z-index: 2147483647 !important; background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%) !important; color: white !important; padding: 11px 20px !important; font-size: 13px !important; font-weight: 800 !important; border-radius: 9999px !important; border: 2px solid white !important; box-shadow: 0 10px 30px rgba(79, 70, 229, 0.5) !important; cursor: pointer !important; display: flex !important; align-items: center !important; gap: 8px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; transition: transform 0.2s ease !important; margin: 0 !important;">
        <span style="font-size: 16px;">🤖</span>
        <span>Autofill with Formly</span>
      </button>
    `;

    document.documentElement.appendChild(widget);

    document.getElementById("formly-btn-trigger").onclick = () => {
      const btn = document.getElementById("formly-btn-trigger");
      btn.innerHTML = `<span style="font-size: 15px;">⏳</span> <span>Autofilling...</span>`;
      btn.style.background = "#10b981";
      executeAutofill();
      setTimeout(() => {
        btn.innerHTML = `<span style="font-size: 15px;">✓</span> <span>Autofill Complete!</span>`;
        setTimeout(() => {
          btn.innerHTML = `<span style="font-size: 15px;">🤖</span> <span>Autofill with Formly</span>`;
          btn.style.background = "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)";
        }, 2500);
      }, 700);
    };
  }

  // Run on load and observe DOM changes
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectFloatingTrigger);
  } else {
    injectFloatingTrigger();
  }

  setTimeout(injectFloatingTrigger, 1500);

  // Listen for messages from popup or commands
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "AUTOFILL_NOW") {
        executeAutofill(request.profile);
        sendResponse({ status: "success" });
      }
    });
  }
})();
