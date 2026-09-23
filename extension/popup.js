const PORTAL_URL = "http://localhost:3000";

let currentProfile = null;
let currentVaultDocs = [];

// Default starter citizen data in case extension is used before first portal sync
const DEFAULT_CITIZEN_PROFILE = {
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
  bankName: "State Bank of India",
  fatherName: "Ramesh Chiluveri",
  motherName: "Lakshmi Chiluveri",
  location: "Hyderabad, Telangana",
  presentAddress: "Flat 402, Sri Sai Residency, Madhapur, Hyderabad, Telangana - 500081",
  permanentAddress: "H.No 3-45/1, Gandhi Nagar, Hanamkonda, Warangal, Telangana - 506001",
  pincode: "500081",
  state: "Telangana",
  district: "Hyderabad",
};

const DEFAULT_VAULT_DOCS = [
  { id: "d0000000-0000-0000-0000-000000000011", document_type: "AADHAAR", original_filename: "Aadhaar_Card_Varshith.pdf", status: "VERIFIED" },
  { id: "d0000000-0000-0000-0000-000000000012", document_type: "INCOME_CERTIFICATE", original_filename: "Income_Certificate_2025_26.pdf", status: "VERIFIED" },
  { id: "d0000000-0000-0000-0000-000000000013", document_type: "COLLEGE_ID", original_filename: "College_ID_VJIT.pdf", status: "VERIFIED" },
  { id: "d0000000-0000-0000-0000-000000000014", document_type: "MARKSHEET", original_filename: "Class_10_Matriculation_Memo.pdf", status: "VERIFIED" },
];

function getInitials(name) {
  if (!name) return "CV";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function updateUI(profile, docs, isOnline = true) {
  const p = profile || DEFAULT_CITIZEN_PROFILE;
  const d = docs || DEFAULT_VAULT_DOCS;
  currentProfile = p;
  currentVaultDocs = d;

  const statusEl = document.getElementById("vault-status");
  const statusText = document.getElementById("status-text");
  if (isOnline) {
    statusEl.className = "status-badge";
    statusText.innerText = "Vault Connected";
  } else {
    statusEl.className = "status-badge offline";
    statusText.innerText = "Offline Cache";
  }

  const nameEl = document.getElementById("p-name");
  const avatarEl = document.getElementById("p-avatar");
  const dobEl = document.getElementById("p-dob");
  const aadhaarEl = document.getElementById("p-aadhaar");
  const mobileEl = document.getElementById("p-mobile");
  const bankEl = document.getElementById("p-bank");
  const docCountEl = document.getElementById("vault-doc-count");

  if (nameEl) nameEl.innerText = p.fullName || "Citizen";
  if (avatarEl) avatarEl.innerText = getInitials(p.fullName);
  if (dobEl) dobEl.innerText = p.dob || "2003-08-15";
  if (aadhaarEl) {
    const rawAadhaar = (p.aadhaar || "583920194821").replace(/\D/g, "");
    aadhaarEl.innerText = rawAadhaar.length >= 4 ? `•••• •••• ${rawAadhaar.slice(-4)}` : rawAadhaar;
  }
  if (mobileEl) {
    const rawMobile = p.mobile || "9876543210";
    mobileEl.innerText = rawMobile.startsWith("+91") ? rawMobile : `+91 ${rawMobile}`;
  }
  if (bankEl) {
    const rawBank = (p.bankAccount || "38491029481").replace(/\D/g, "");
    const bankShort = p.bankName ? p.bankName.split(" ")[0] : "SBI";
    bankEl.innerText = rawBank.length >= 4 ? `•••• ${rawBank.slice(-4)} (${bankShort})` : rawBank;
  }
  if (docCountEl) {
    docCountEl.innerText = `${d.length} Verified`;
  }
}

async function syncProfileFromPortal() {
  const statusText = document.getElementById("status-text");
  if (statusText) statusText.innerText = "Syncing...";

  try {
    // 1. Fetch Session
    const sessionRes = await fetch(`${PORTAL_URL}/api/auth/session`, {
      credentials: "include",
    });
    const sessionData = await sessionRes.json();
    const user = sessionData.user || {};

    // 2. Fetch Profile Fields
    const profileRes = await fetch(`${PORTAL_URL}/api/profile`, {
      credentials: "include",
    });
    const profileData = await profileRes.json();
    const fields = profileData.success && Array.isArray(profileData.data) ? profileData.data : [];

    const getField = (name) => {
      const match = fields.find((f) => f.field_name === name);
      return match && match.value ? match.value : "";
    };

    const fullName = getField("full_name") || user.name || DEFAULT_CITIZEN_PROFILE.fullName;
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || DEFAULT_CITIZEN_PROFILE.firstName;
    const lastName = nameParts.slice(1).join(" ") || DEFAULT_CITIZEN_PROFILE.lastName;

    const profile = {
      fullName,
      firstName,
      lastName,
      dob: getField("date_of_birth") || DEFAULT_CITIZEN_PROFILE.dob,
      gender: getField("gender") || DEFAULT_CITIZEN_PROFILE.gender,
      aadhaar: getField("aadhaar_number") || DEFAULT_CITIZEN_PROFILE.aadhaar,
      mobile: getField("phone_number") || user.phone || DEFAULT_CITIZEN_PROFILE.mobile,
      email: getField("email") || user.email || DEFAULT_CITIZEN_PROFILE.email,
      income: getField("annual_income") || DEFAULT_CITIZEN_PROFILE.income,
      category: getField("caste_category") || DEFAULT_CITIZEN_PROFILE.category,
      college: getField("college_name") || DEFAULT_CITIZEN_PROFILE.college,
      course: getField("education_degree") || DEFAULT_CITIZEN_PROFILE.course,
      rollNo: getField("roll_number") || DEFAULT_CITIZEN_PROFILE.rollNo,
      bankAccount: getField("bank_account_no") || DEFAULT_CITIZEN_PROFILE.bankAccount,
      bankIfsc: getField("bank_ifsc") || DEFAULT_CITIZEN_PROFILE.bankIfsc,
      bankName: getField("bank_name") || DEFAULT_CITIZEN_PROFILE.bankName,
      fatherName: getField("father_name") || DEFAULT_CITIZEN_PROFILE.fatherName,
      motherName: getField("mother_name") || DEFAULT_CITIZEN_PROFILE.motherName,
      location: getField("location") || DEFAULT_CITIZEN_PROFILE.location,
      presentAddress: getField("present_address_line1") || DEFAULT_CITIZEN_PROFILE.presentAddress,
      permanentAddress: getField("permanent_address_line1") || DEFAULT_CITIZEN_PROFILE.permanentAddress,
      pincode: getField("present_pincode") || DEFAULT_CITIZEN_PROFILE.pincode,
      state: getField("present_state") || DEFAULT_CITIZEN_PROFILE.state,
      district: getField("present_district") || DEFAULT_CITIZEN_PROFILE.district,
    };

    // 3. Fetch Vault Documents
    let docs = DEFAULT_VAULT_DOCS;
    try {
      const docsRes = await fetch(`${PORTAL_URL}/api/vault/documents`, { credentials: "include" });
      const docsData = await docsRes.json();
      if (docsData.success && Array.isArray(docsData.documents)) {
        docs = docsData.documents;
      }
    } catch (e) {}

    // Cache locally in extension storage
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        userProfile: profile,
        vaultDocs: docs,
        lastSynced: Date.now(),
      });
    }

    updateUI(profile, docs, true);
    return { profile, docs };
  } catch (err) {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["userProfile", "vaultDocs"], (res) => {
        const p = res && res.userProfile ? res.userProfile : DEFAULT_CITIZEN_PROFILE;
        const d = res && res.vaultDocs ? res.vaultDocs : DEFAULT_VAULT_DOCS;
        updateUI(p, d, false);
      });
    } else {
      updateUI(DEFAULT_CITIZEN_PROFILE, DEFAULT_VAULT_DOCS, false);
    }
    return { profile: currentProfile, docs: currentVaultDocs };
  }
}

// Initial Load
document.addEventListener("DOMContentLoaded", async () => {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["userProfile", "vaultDocs"], (res) => {
      const p = res && res.userProfile ? res.userProfile : DEFAULT_CITIZEN_PROFILE;
      const d = res && res.vaultDocs ? res.vaultDocs : DEFAULT_VAULT_DOCS;
      updateUI(p, d, true);
    });
  } else {
    updateUI(DEFAULT_CITIZEN_PROFILE, DEFAULT_VAULT_DOCS, true);
  }

  await syncProfileFromPortal();
});

// Manual Sync Button
const syncBtn = document.getElementById("btn-sync");
if (syncBtn) {
  syncBtn.addEventListener("click", async () => {
    syncBtn.innerHTML = `<span>⏳</span><span>Syncing</span>`;
    await syncProfileFromPortal();
    syncBtn.innerHTML = `<span style="color:#34d399">✓</span><span>Synced</span>`;
    setTimeout(() => {
      syncBtn.innerHTML = `
        <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        <span>Sync</span>
      `;
    }, 1500);
  });
}

// Autofill Current Page Action (Fields + Document Attachments)
const autofillBtn = document.getElementById("btn-autofill");
if (autofillBtn) {
  autofillBtn.addEventListener("click", async () => {
    const originalText = autofillBtn.innerHTML;
    autofillBtn.innerHTML = `<span>⏳</span><span>Autofilling & Attaching...</span>`;

    const profile = currentProfile || DEFAULT_CITIZEN_PROFILE;

    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        const payload = { action: "AUTOFILL_NOW", profile: profile };

        chrome.tabs.sendMessage(tab.id, payload, (response) => {
          if (chrome.runtime.lastError || !response) {
            if (chrome.scripting && chrome.scripting.executeScript) {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"],
              }).then(() => {
                setTimeout(() => {
                  chrome.tabs.sendMessage(tab.id, payload);
                }, 300);
              });
            }
          }
        });

        setTimeout(() => {
          autofillBtn.innerHTML = `<span style="color:#34d399">✓</span><span>Application & Docs Ready!</span>`;
          setTimeout(() => {
            autofillBtn.innerHTML = originalText;
          }, 2200);
        }, 800);
      }
    }
  });
}

// Demo Portal Shortcut
const demoPortalBtn = document.getElementById("btn-demo-portal");
if (demoPortalBtn) {
  demoPortalBtn.addEventListener("click", () => {
    const demoUrl = `${PORTAL_URL}/demo/scholarship-portal`;
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: demoUrl });
    } else {
      window.open(demoUrl, "_blank");
    }
  });
}

// Open Citizen Dashboard
const openPortalBtn = document.getElementById("btn-open-portal");
if (openPortalBtn) {
  openPortalBtn.addEventListener("click", () => {
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: `${PORTAL_URL}/dashboard` });
    } else {
      window.open(`${PORTAL_URL}/dashboard`, "_blank");
    }
  });
}
