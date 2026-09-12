// SevaSaarthi Extension — Background Service Worker

const PORTAL_API = "http://localhost:3000/api/agent/solve-captcha";

chrome.runtime.onInstalled.addListener(() => {
  console.log("🇮🇳 [SevaSaarthi] Background service worker registered.");
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SOLVE_CAPTCHA") {
    handleSolveCaptcha(request)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }
});

async function handleSolveCaptcha({ imageSrc }) {
  if (!imageSrc) {
    return { success: false, error: "No image source provided" };
  }

  try {
    let base64Data = imageSrc;

    // If imageSrc is a URL (not data:), fetch it from background (no CORS restrictions)
    if (!imageSrc.startsWith("data:")) {
      try {
        const fetchRes = await fetch(imageSrc);
        const blob = await fetchRes.blob();
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (fetchErr) {
        console.warn("Could not fetch remote image directly:", fetchErr);
      }
    }

    // Call SevaSaarthi backend CAPTCHA OCR service
    const response = await fetch(PORTAL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64Data }),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SevaSaarthi] Background CAPTCHA solve error:", err);
    return { success: false, error: err.message };
  }
}
