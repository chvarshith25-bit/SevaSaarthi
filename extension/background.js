// SevaSaarthi Extension — Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log("🇮🇳 [SevaSaarthi] Background Service Worker active.");
});

// Fast Topological Alphanumeric Glyph Decoder on Raw ImageData
function solveCaptchaFromImageData(imgData) {
  try {
    const width = imgData.width;
    const height = imgData.height;
    const data = imgData.data;
    if (width < 30 || height < 15) return null;

    // 1. Binary grid: filter noise lines (pink/cyan) and white/light background
    const grid = [];
    for (let y = 0; y < height; y++) {
      grid[y] = [];
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        const isWhite = r > 215 && g > 215 && b > 215;
        const isPinkLine = r > g + 35 && r > 110;
        const isCyanLine = b > g + 35 && b > 110;
        const isChar = !isWhite && !isPinkLine && !isCyanLine && a > 40 && (g > 25 || (r < 160 && g < 160 && b < 160));

        grid[y][x] = isChar ? 1 : 0;
      }
    }

    // 2. Find horizontal span of characters
    const colDensity = [];
    for (let x = 0; x < width; x++) {
      let count = 0;
      for (let y = 0; y < height; y++) {
        if (grid[y][x]) count++;
      }
      colDensity[x] = count;
    }

    let minX = 0;
    while (minX < width && colDensity[minX] < 2) minX++;
    let maxX = width - 1;
    while (maxX > minX && colDensity[maxX] < 2) maxX--;

    const totalSpan = maxX - minX;
    if (totalSpan < 30) return null;

    // 3. Segment into 6 character columns
    const charWidth = totalSpan / 6;
    let predicted = "";

    for (let i = 0; i < 6; i++) {
      const startX = Math.round(minX + i * charWidth);
      const endX = Math.round(minX + (i + 1) * charWidth);

      let cMinY = height, cMaxY = 0, cMinX = endX, cMaxX = startX;
      let pixelCount = 0;

      for (let x = startX; x < endX; x++) {
        for (let y = 0; y < height; y++) {
          if (grid[y] && grid[y][x]) {
            pixelCount++;
            if (y < cMinY) cMinY = y;
            if (y > cMaxY) cMaxY = y;
            if (x < cMinX) cMinX = x;
            if (x > cMaxX) cMaxX = x;
          }
        }
      }

      if (pixelCount < 6 || cMinY >= cMaxY) {
        predicted += "5";
        continue;
      }

      const boxH = cMaxY - cMinY + 1;
      const boxW = cMaxX - cMinX + 1;
      const aspect = boxW / (boxH || 1);

      let topPixels = 0, bottomPixels = 0;
      const midY = Math.floor((cMinY + cMaxY) / 2);
      for (let x = cMinX; x <= cMaxX; x++) {
        for (let y = cMinY; y < midY; y++) if (grid[y] && grid[y][x]) topPixels++;
        for (let y = midY; y <= cMaxY; y++) if (grid[y] && grid[y][x]) bottomPixels++;
      }
      const topRatio = topPixels / (pixelCount || 1);

      let leftPixels = 0, rightPixels = 0;
      const midX = Math.floor((cMinX + cMaxX) / 2);
      for (let y = cMinY; y <= cMaxY; y++) {
        for (let x = cMinX; x < midX; x++) if (grid[y] && grid[y][x]) leftPixels++;
        for (let x = midX; x <= cMaxX; x++) if (grid[y] && grid[y][x]) rightPixels++;
      }
      const leftRatio = leftPixels / (pixelCount || 1);

      function countCrossings(yRow) {
        if (!grid[yRow]) return 0;
        let transitions = 0, inChar = false;
        for (let x = cMinX; x <= cMaxX; x++) {
          if (grid[yRow][x]) {
            if (!inChar) { transitions++; inChar = true; }
          } else {
            inChar = false;
          }
        }
        return transitions;
      }

      const cross33 = countCrossings(Math.floor(cMinY + boxH * 0.33));
      const cross50 = countCrossings(midY);
      const cross66 = countCrossings(Math.floor(cMinY + boxH * 0.66));

      let char = "8";

      if (cross50 >= 3 || cross33 >= 3) {
        char = aspect > 0.75 ? "m" : "w";
      } else if (cross50 === 2 && cross66 === 2 && cross33 === 2) {
        char = "8";
      } else if (cross50 === 2 && cross66 === 2) {
        char = leftRatio > 0.55 ? "b" : "d";
      } else if (cross33 === 2 && cross66 === 1) {
        char = "4";
      } else if (aspect < 0.45) {
        char = (cMaxY > height * 0.78) ? "j" : "i";
      } else if (topRatio < 0.42) {
        char = "2";
      } else if (topRatio > 0.56) {
        char = "5";
      } else if (leftRatio > 0.58) {
        char = "b";
      } else if (boxH > height * 0.7 && cMinY < height * 0.25) {
        char = "b";
      } else {
        char = (i % 2 === 0) ? "m" : "w";
      }

      predicted += char;
    }

    return predicted.length >= 4 ? predicted : null;
  } catch (e) {
    console.warn("[SevaSaarthi] Glyph decode error:", e);
    return null;
  }
}

// Handle message from content script
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
    return { success: false, error: "No image source" };
  }

  try {
    let blob = null;
    if (imageSrc.startsWith("data:")) {
      const res = await fetch(imageSrc);
      blob = await res.blob();
    } else {
      const res = await fetch(imageSrc, { cache: "no-cache" });
      blob = await res.blob();
    }

    if (!blob) {
      return { success: false, error: "Failed to load image blob" };
    }

    // Render onto OffscreenCanvas to bypass all cross-origin restrictions
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    const imgData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

    // Decode glyphs
    const text = solveCaptchaFromImageData(imgData);
    if (text && text.length >= 4) {
      console.log("✓ [SevaSaarthi Background] Decoded CAPTCHA:", text);
      return { success: true, text: text };
    }

    return { success: false, error: "Could not decode glyphs" };
  } catch (err) {
    console.warn("[SevaSaarthi Background] CAPTCHA solve error:", err);
    return { success: false, error: err.message };
  }
}
