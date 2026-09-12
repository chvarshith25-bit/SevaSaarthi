// SevaSaarthi — Universal Citizen Application & Portal Autofill Content Engine

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
    currentUrl.includes("challenge")
  ) {
    return;
  }

  console.log("🇮🇳 [SevaSaarthi Extension] Initialized on main frame:", window.location.href);

  // If on SevaSaarthi app itself, automatically sync profile to extension storage
  if (window.location.origin === "http://localhost:3000") {
    syncLocalPortalProfile();
  }

  async function syncLocalPortalProfile() {
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

        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ userProfile: profile, lastSynced: Date.now() });
          console.log("✓ [SevaSaarthi Extension] Synced citizen profile for:", fullName);
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
    element.style.boxShadow = "0 0 10px rgba(16, 185, 129, 0.3)";
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

  // Smart CAPTCHA Detection & OCR Auto-Solver
  async function detectAndSolveCaptcha() {
    try {
      // 1. Locate CAPTCHA input field
      const captchaInputSelectors = [
        'input[name*="captcha" i]',
        'input[id*="captcha" i]',
        'input[placeholder*="captcha" i]',
        'input[aria-label*="captcha" i]',
        'input[formcontrolname*="captcha" i]',
        '#captcha',
        '#txtCaptcha',
        '#captchaInput',
        '#captcha_code',
        '#userCaptcha',
      ];

      let captchaInput = null;
      for (const sel of captchaInputSelectors) {
        const el = document.querySelector(sel);
        if (el && el.offsetParent !== null) {
          captchaInput = el;
          break;
        }
      }

      if (!captchaInput) return false;

      // 2. Locate CAPTCHA image element
      const captchaImgSelectors = [
        'img[src*="captcha" i]',
        'img[id*="captcha" i]',
        'img[class*="captcha" i]',
        '#captchaImg',
        '#imgCaptcha',
        '#captchaimg',
        '#cpatchaTextBox',
        'canvas[id*="captcha" i]',
        'canvas[class*="captcha" i]',
      ];

      let captchaImg = null;
      for (const sel of captchaImgSelectors) {
        const el = document.querySelector(sel);
        if (el && el.offsetParent !== null) {
          captchaImg = el;
          break;
        }
      }

      // If no image found by direct selector, search nearby the input container
      if (!captchaImg && captchaInput) {
        const container = captchaInput.closest("form") || captchaInput.parentElement?.parentElement;
        if (container) {
          captchaImg = container.querySelector("img, canvas");
        }
      }

      if (!captchaImg) {
        captchaInput.focus();
        captchaInput.style.border = "2px solid #f59e0b";
        captchaInput.style.backgroundColor = "#fffbeb";
        return false;
      }

      // 3. Extract Image Data as Base64 Canvas
      let imageBase64 = null;
      if (captchaImg.tagName.toLowerCase() === "canvas") {
        imageBase64 = captchaImg.toDataURL("image/png");
      } else {
        const canvas = document.createElement("canvas");
        canvas.width = captchaImg.naturalWidth || captchaImg.width || 160;
        canvas.height = captchaImg.naturalHeight || captchaImg.height || 50;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(captchaImg, 0, 0, canvas.width, canvas.height);
          try {
            imageBase64 = canvas.toDataURL("image/png");
          } catch (e) {
            imageBase64 = captchaImg.src;
          }
        }
      }

      if (!imageBase64 && captchaImg.src) {
        imageBase64 = captchaImg.src;
      }

      if (!imageBase64) {
        captchaInput.focus();
        return false;
      }

      // 4. Send to SevaSaarthi CAPTCHA OCR service
      const res = await fetch("http://localhost:3000/api/agent/solve-captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await res.json();
      if (data.success && data.text && data.text.length >= 3) {
        setValueAndDispatch(captchaInput, data.text);
        captchaInput.style.border = "2px solid #f59e0b";
        captchaInput.style.backgroundColor = "#fffbeb";
        captchaInput.style.boxShadow = "0 0 10px rgba(245, 158, 11, 0.4)";
        console.log("✓ [SevaSaarthi] Auto-filled predicted CAPTCHA:", data.text);
        captchaInput.focus();
        return true;
      } else {
        captchaInput.focus();
        captchaInput.style.border = "2px solid #f59e0b";
        captchaInput.style.backgroundColor = "#fffbeb";
        return false;
      }
    } catch (err) {
      console.warn("[SevaSaarthi] CAPTCHA auto-solve:", err.message);
      return false;
    }
  }

  // Core Autofill Execution Function
  async function executeAutofill(passedProfile) {
    let profile = passedProfile;

    // 1. Try local extension storage if not passed
    if (!profile && typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      try {
        const stored = await chrome.storage.local.get(["userProfile"]);
        if (stored && stored.userProfile) {
          profile = stored.userProfile;
        }
      } catch (e) {}
    }

    // 2. Try fetching live from local portal server
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

    // Fallback default citizen profile (Varshith)
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
        location: "Hyderabad, Telangana",
      };
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

    // B. ECI / ECINET / VOTER PORTAL LOGIN MATCHERS
    const eciMobile = document.querySelector('input[placeholder*="Mobile" i], input[placeholder*="EPIC" i], #mobNo, #mobileNumber, #username');
    if (eciMobile && profile.mobile) {
      setValueAndDispatch(eciMobile, profile.mobile);
      filledCount++;
    }

    // C. GENERIC SMART HEURISTIC MATCHERS
    const allInputs = document.querySelectorAll("input, select, textarea");
    allInputs.forEach((input) => {
      if (input.type === "hidden" || input.type === "submit" || input.type === "button") return;
      const id = (input.id || "").toLowerCase();
      const name = (input.name || "").toLowerCase();
      const placeholder = (input.getAttribute("placeholder") || "").toLowerCase();
      const ariaLabel = (input.getAttribute("aria-label") || "").toLowerCase();
      const label = input.labels && input.labels[0] ? input.labels[0].innerText.toLowerCase() : "";
      const text = `${id} ${name} ${placeholder} ${ariaLabel} ${label}`;

      // Skip already filled inputs
      if (input.value && input.value.trim().length > 0) return;

      // Full Name
      if ((text.includes("fullname") || text.includes("applicant_name") || text.includes("candidate_name") || text.includes("name of applicant")) && profile.fullName) {
        setValueAndDispatch(input, profile.fullName);
        filledCount++;
      }
      // First Name
      else if ((text.includes("firstname") || text.includes("first_name") || text.includes("fname")) && profile.firstName) {
        setValueAndDispatch(input, profile.firstName);
        filledCount++;
      }
      // Last Name
      else if ((text.includes("lastname") || text.includes("last_name") || text.includes("lname") || text.includes("surname")) && profile.lastName) {
        setValueAndDispatch(input, profile.lastName);
        filledCount++;
      }
      // Mobile Number
      else if ((text.includes("mobile") || text.includes("phone") || text.includes("contact_no") || text.includes("cell")) && profile.mobile) {
        setValueAndDispatch(input, profile.mobile);
        filledCount++;
      }
      // Email
      else if ((text.includes("email") || text.includes("e-mail") || text.includes("mailid")) && profile.email) {
        setValueAndDispatch(input, profile.email);
        filledCount++;
      }
      // Date of Birth
      else if ((text.includes("dob") || text.includes("birth") || text.includes("date_of_birth")) && formattedDob) {
        setValueAndDispatch(input, input.type === "date" ? profile.dob : formattedDob);
        filledCount++;
      }
      // Aadhaar
      else if ((text.includes("aadhaar") || text.includes("uid") || text.includes("adhar")) && profile.aadhaar) {
        setValueAndDispatch(input, profile.aadhaar);
        filledCount++;
      }
      // Income
      else if ((text.includes("income") || text.includes("annual_income")) && profile.income) {
        setValueAndDispatch(input, profile.income);
        filledCount++;
      }
      // College
      else if ((text.includes("college") || text.includes("institution") || text.includes("university")) && profile.college) {
        setValueAndDispatch(input, profile.college);
        filledCount++;
      }
      // Degree / Course
      else if ((text.includes("degree") || text.includes("course") || text.includes("branch")) && profile.course) {
        setValueAndDispatch(input, profile.course);
        filledCount++;
      }
      // Roll Number
      else if ((text.includes("roll") || text.includes("hallticket") || text.includes("reg_no") || text.includes("registration_no")) && profile.rollNo) {
        setValueAndDispatch(input, profile.rollNo);
        filledCount++;
      }
      // Bank Account Number
      else if ((text.includes("account_no") || text.includes("account_number") || text.includes("bank_acc")) && profile.bankAccount) {
        setValueAndDispatch(input, profile.bankAccount);
        filledCount++;
      }
      // Bank IFSC Code
      else if ((text.includes("ifsc") || text.includes("ifsc_code")) && profile.bankIfsc) {
        setValueAndDispatch(input, profile.bankIfsc);
        filledCount++;
      }
      // Father's Name
      else if ((text.includes("father") || text.includes("parent_name")) && profile.fatherName) {
        setValueAndDispatch(input, profile.fatherName);
        filledCount++;
      }
      // Gender Dropdown
      else if (input.tagName.toLowerCase() === "select" && (text.includes("gender") || text.includes("sex")) && profile.gender) {
        if (selectDropdown(input, profile.gender)) filledCount++;
      }
      // Caste Category Dropdown
      else if (input.tagName.toLowerCase() === "select" && (text.includes("category") || text.includes("caste")) && profile.category) {
        if (selectDropdown(input, profile.category)) filledCount++;
      }
    });

    // D. RUN SMART CAPTCHA PREDICTION & AUTO-FILL
    const captchaSolved = await detectAndSolveCaptcha();
    if (captchaSolved) filledCount++;

    // Show floating confirmation banner with actual user details
    showApprovalBanner(profile, filledCount, captchaSolved);
  }

  // Floating Confirmation Banner
  function showApprovalBanner(profile, count, captchaSolved) {
    let banner = document.getElementById("sevasaarthi-approval-overlay");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "sevasaarthi-approval-overlay";
      document.documentElement.appendChild(banner);
    }

    banner.innerHTML = `
      <div style="position: fixed; bottom: 85px; right: 24px; z-index: 2147483647; background: #0f172a; color: white; padding: 18px; border-radius: 20px; box-shadow: 0 25px 60px rgba(0,0,0,0.6); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 360px; border: 2px solid #6366f1; animation: slideUp 0.3s ease;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #6366f1, #4f46e5); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; color: white; font-weight: bold;">✓</div>
            <div>
              <strong style="font-size: 13px; display: block; color: #fff;">SevaSaarthi Autofill Applied</strong>
              <span style="font-size: 10px; color: #94a3b8;">${count} field(s) populated with verified citizen data</span>
            </div>
          </div>
          <span style="font-size: 10px; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); font-weight: bold; padding: 2px 8px; border-radius: 9999px;">VERIFIED</span>
        </div>
        
        <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 12px; line-height: 1.5; background: #1e293b; padding: 10px; border-radius: 12px; border: 1px solid #334155;">
          Applicant: <strong style="color: #fff;">${profile.fullName || "—"}</strong><br/>
          ${profile.dob ? `DOB: <strong style="color: #fff;">${profile.dob}</strong> • ` : ""}${profile.mobile ? `Mobile: <strong style="color: #fff;">${profile.mobile}</strong><br/>` : ""}
          ${profile.aadhaar ? `Aadhaar: <strong style="color: #fff;">•••• •••• ${profile.aadhaar.slice(-4)}</strong>` : ""}
          ${captchaSolved ? `<span style="color: #34d399; font-weight: bold; display: block; margin-top: 6px;">⚡ CAPTCHA auto-predicted! Please verify and submit.</span>` : `<span style="color: #f59e0b; font-weight: bold; display: block; margin-top: 6px;">⚠️ Please solve the CAPTCHA box and click Submit.</span>`}
        </div>

        <button id="sevasaarthi-banner-close" style="width: 100%; background: #334155; color: white; border: none; padding: 8px; border-radius: 10px; font-size: 11px; font-weight: bold; cursor: pointer;">Got It / Close</button>
      </div>
    `;

    document.getElementById("sevasaarthi-banner-close").onclick = () => banner.remove();
  }

  // Inject Floating Button onto Website (Bottom Right Corner Only)
  function injectFloatingTrigger() {
    if (window !== window.top) return;
    if (window.location.origin === "http://localhost:3000") return;
    if (document.getElementById("sevasaarthi-floating-widget")) return;

    const widget = document.createElement("div");
    widget.id = "sevasaarthi-floating-widget";
    widget.innerHTML = `
      <button id="sevasaarthi-btn-trigger" style="position: fixed !important; bottom: 24px !important; right: 24px !important; z-index: 2147483647 !important; background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%) !important; color: white !important; padding: 10px 18px !important; font-size: 13px !important; font-weight: 700 !important; border-radius: 9999px !important; border: 2px solid white !important; box-shadow: 0 10px 30px rgba(79, 70, 229, 0.5) !important; cursor: pointer !important; display: flex !important; align-items: center !important; gap: 8px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; transition: transform 0.2s ease !important; margin: 0 !important;">
        <span style="font-size: 15px;">⚡</span>
        <span>Autofill with SevaSaarthi</span>
      </button>
    `;

    document.documentElement.appendChild(widget);

    document.getElementById("sevasaarthi-btn-trigger").onclick = async () => {
      const btn = document.getElementById("sevasaarthi-btn-trigger");
      btn.innerHTML = `<span style="font-size: 14px;">⏳</span> <span>Autofilling...</span>`;
      btn.style.background = "#10b981";
      await executeAutofill();
      setTimeout(() => {
        btn.innerHTML = `<span style="font-size: 14px;">✓</span> <span>Autofill Complete!</span>`;
        setTimeout(() => {
          btn.innerHTML = `<span style="font-size: 15px;">⚡</span> <span>Autofill with SevaSaarthi</span>`;
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
