// Seva Saarthi Universal Government & PAN Portal Injector
(function () {
  console.log("🇮🇳 Seva Saarthi universal script injected!");
  
  let profile = {
    firstName: "Rahul",
    lastName: "Kumar",
    fullName: "Rahul Kumar",
    dob: "15/08/2001",
    gender: "Male",
    mobile: "9876543210",
    email: "rahul@example.com",
    aadhaar: "5492 8173 9012",
  };

  // 1. Select Dropdowns
  document.querySelectorAll("select").forEach((sel) => {
    const n = (sel.name || sel.id || "").toLowerCase();
    if (n.includes("apptype") || n.includes("type")) {
      for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].text.includes("49A") || sel.options[i].value.includes("49A") || sel.options[i].text.includes("Indian Citizen")) {
          sel.selectedIndex = i;
          sel.dispatchEvent(new Event("change", { bubbles: true }));
          sel.style.border = "2px solid #10b981";
          break;
        }
      }
    }
    if (n.includes("cat") || n.includes("category")) {
      for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].text.toLowerCase().includes("individual") || sel.options[i].value.toLowerCase().includes("individual") || sel.options[i].value === "P") {
          sel.selectedIndex = i;
          sel.dispatchEvent(new Event("change", { bubbles: true }));
          sel.style.border = "2px solid #10b981";
          break;
        }
      }
    }
    if (n.includes("title") || n.includes("salutation")) {
      for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].text.includes("Shri") || sel.options[i].value.includes("SHRI") || sel.options[i].value === "1") {
          sel.selectedIndex = i;
          sel.dispatchEvent(new Event("change", { bubbles: true }));
          sel.style.border = "2px solid #10b981";
          break;
        }
      }
    }
  });

  // 2. Fill Text Inputs
  const matchers = [
    { val: profile.lastName, keys: ["lastname", "last_name", "surname", "txtlastname"] },
    { val: profile.firstName, keys: ["firstname", "first_name", "txtfirstname"] },
    { val: profile.fullName, keys: ["name", "applicant", "student", "full_name"] },
    { val: profile.dob, keys: ["dob", "birth", "date_of_birth", "txtdob"] },
    { val: profile.mobile, keys: ["mobile", "phone", "contact", "txtmobile"] },
    { val: profile.email, keys: ["email", "mail", "txtemail"] },
    { val: profile.aadhaar, keys: ["aadhaar", "uid", "aadhar", "txtaadhaar"] },
  ];

  let filled = 0;
  document.querySelectorAll("input, textarea").forEach((input) => {
    if (input.type === "hidden" || input.type === "submit" || input.type === "button") return;
    if (input.type === "checkbox") {
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      filled++;
      return;
    }
    const name = (input.name || input.id || input.placeholder || "").toLowerCase();
    for (const m of matchers) {
      if (m.keys.some((k) => name.includes(k)) && !input.value) {
        input.value = m.val;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.style.border = "2px solid #10b981";
        input.style.boxShadow = "0 0 10px rgba(16, 185, 129, 0.4)";
        filled++;
        break;
      }
    }
  });

  console.log(`✓ Seva Saarthi autofilled ${filled} fields.`);
})();
