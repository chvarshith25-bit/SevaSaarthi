// SevaSaarthi Extension — Background Service Worker

const PORTAL_API = "http://localhost:3000/api/agent/solve-captcha";

chrome.runtime.onInstalled.addListener(() => {
  console.log("🇮🇳 [SevaSaarthi] Background service worker initialized.");
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SOLVE_CAPTCHA") {
    handleSolveCaptcha(request)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep message port open for async response
  }
});

async function handleSolveCaptcha({ imageSrc }) {
  if (!imageSrc) {
    return { success: false, error: "No image source provided" };
  }

  try {
    let base64Data = imageSrc;

    // If imageSrc is a URL (not data:), fetch it directly from background
    if (!imageSrc.startsWith("data:")) {
      try {
        const fetchRes = await fetch(imageSrc, { cache: "no-cache" });
        const blob = await fetchRes.blob();
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (fetchErr) {
        console.warn("[SevaSaarthi] Direct fetch error on captcha url:", fetchErr);
      }
    }

    // Call SevaSaarthi backend CAPTCHA OCR service with a 3s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(PORTAL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64Data }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();
    return data;
  } catch (err) {
    console.warn("[SevaSaarthi] Background solve error:", err.message);
    return { success: false, error: err.message };
  }
}
