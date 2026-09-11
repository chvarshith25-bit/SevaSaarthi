const FORMLY_URL = "http://localhost:3000";

let currentProfile = null;

async function syncProfileFromFormly() {
  const statusEl = document.getElementById("vault-status");
  statusEl.innerText = "● Syncing with Formly...";
  statusEl.className = "sub";

  try {
    // 1. Fetch Session
    const sessionRes = await fetch(`${FORMLY_URL}/api/auth/session`, {
      credentials: "include",
    });
    const sessionData = await sessionRes.json();

    if (!sessionData.success || !sessionData.user) {
      statusEl.innerText = "⚠️ Not Logged In";
      statusEl.className = "sub offline";
      document.getElementById("p-name").innerText = "Please log in";
      return null;
    }

    // 2. Fetch Profile Fields
    const profileRes = await fetch(`${FORMLY_URL}/api/profile`, {
      credentials: "include",
    });
    const profileData = await profileRes.json();
    const fields = profileData.success && Array.isArray(profileData.data) ? profileData.data : [];

    const getField = (name) => {
      const match = fields.find((f) => f.field_name === name);
      return match && match.value ? match.value : "";
    };

    const fullName = getField("full_name") || sessionData.user.name || "Citizen";
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const profile = {
      fullName,
      firstName,
      lastName,
      dob: getField("date_of_birth"),
      gender: getField("gender") || "Male",
      aadhaar: getField("aadhaar_number"),
      mobile: getField("phone_number") || sessionData.user.phone || "",
      email: getField("email") || sessionData.user.email || "",
      income: getField("annual_income"),
      category: getField("caste_category") || "General",
      college: getField("college_name"),
      course: getField("education_degree"),
      rollNo: getField("roll_number"),
      bankAccount: getField("bank_account_no"),
      bankIfsc: getField("bank_ifsc"),
      fatherName: getField("father_name"),
      location: getField("location"),
    };

    currentProfile = profile;

    // Cache locally in extension storage
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ userProfile: profile, userSession: sessionData.user, lastSynced: Date.now() });
    }

    // Update UI Elements
    statusEl.innerText = `● Vault Connected (${firstName})`;
    statusEl.className = "sub";

    document.getElementById("p-name").innerText = fullName;
    document.getElementById("p-dob").innerText = profile.dob || "(Not set in profile)";
    document.getElementById("p-aadhaar").innerText = profile.aadhaar ? `•••• •••• ${profile.aadhaar.slice(-4)}` : "(Not set in profile)";
    document.getElementById("p-mobile").innerText = profile.mobile || "(Not set in profile)";
    document.getElementById("p-bank").innerText = profile.bankAccount ? `•••• ${profile.bankAccount.slice(-4)} (${profile.bankIfsc || "IFSC"})` : "(Not set in profile)";

    return profile;
  } catch (err) {
    statusEl.innerText = "⚠️ Formly server unreachable";
    statusEl.className = "sub offline";
    document.getElementById("p-name").innerText = "Start Formly on localhost:3000";
    return null;
  }
}

// Load cached profile first, then sync fresh
document.addEventListener("DOMContentLoaded", async () => {
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["userProfile"], (res) => {
      if (res && res.userProfile) {
        currentProfile = res.userProfile;
        const p = res.userProfile;
        document.getElementById("vault-status").innerText = `● Vault Connected (${p.firstName || p.fullName})`;
        document.getElementById("p-name").innerText = p.fullName || "—";
        document.getElementById("p-dob").innerText = p.dob || "—";
        document.getElementById("p-aadhaar").innerText = p.aadhaar || "—";
        document.getElementById("p-mobile").innerText = p.mobile || "—";
        document.getElementById("p-bank").innerText = p.bankAccount || "—";
      }
    });
  }

  await syncProfileFromFormly();
});

// Manual Sync Button
document.getElementById("btn-sync").addEventListener("click", async () => {
  const btn = document.getElementById("btn-sync");
  btn.innerText = "⏳...";
  await syncProfileFromFormly();
  btn.innerText = "✓ Synced";
  setTimeout(() => { btn.innerText = "🔄 Sync Vault"; }, 1500);
});

// Autofill Button
document.getElementById("btn-autofill").addEventListener("click", async () => {
  const btn = document.getElementById("btn-autofill");
  btn.innerText = "⏳ Autofilling with your data...";

  let profile = currentProfile;
  if (!profile) {
    profile = await syncProfileFromFormly();
  }

  if (!profile || !profile.fullName) {
    alert("⚠️ Please open Formly at http://localhost:3000 and complete your citizen profile first.");
    btn.innerText = "⚡ AUTOFILL CURRENT PAGE";
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    const payload = { action: "AUTOFILL_NOW", profile: profile };

    chrome.tabs.sendMessage(tab.id, payload, (response) => {
      if (chrome.runtime.lastError || !response) {
        // Fallback: inject content.js and dispatch
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        }).then(() => {
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, payload);
          }, 300);
        }).catch((err) => {
          console.error("Script injection error:", err);
        });
      }
    });

    setTimeout(() => {
      btn.innerText = "✓ Form Populated!";
      setTimeout(() => {
        btn.innerText = "⚡ AUTOFILL CURRENT PAGE";
      }, 2000);
    }, 600);
  }
});

// Open Formly Web App
document.getElementById("btn-open-formly").addEventListener("click", () => {
  chrome.tabs.create({ url: FORMLY_URL });
});
