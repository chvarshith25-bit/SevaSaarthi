import fetch from "node-fetch";

async function run() {
  try {
    const res = await fetch("http://localhost:3000/api/agent/solve-captcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Minimal 1x1 png or sample
        imageBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      })
    });
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response:", json);
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
