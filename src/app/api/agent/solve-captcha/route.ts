import { NextResponse } from "next/server";

// Basic CORS headers for Chrome Extension and web client access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Fast heuristic glyph feature extractor for government alphanumeric image CAPTCHAs
function parseBase64Image(dataUri: string): { width: number; height: number; data: Buffer } | null {
  try {
    const base64Clean = dataUri.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Clean, "base64");
    return { width: 160, height: 50, data: buffer };
  } catch (e) {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64, imageUrl } = body;

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json(
        { success: false, error: "Image base64 or URL is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const imageInput = imageBase64 || imageUrl;

    // Timeout guard: Maximum 2.5 seconds to prevent any hanging
    const solvePromise = new Promise<{ text: string; confidence: number }>(async (resolve, reject) => {
      try {
        // Dynamically load Tesseract with worker options and timeout
        const Tesseract = (await import("tesseract.js")).default;
        const result = await Tesseract.recognize(imageInput, "eng", {
          errorHandler: (err) => console.warn("Tesseract error:", err),
        });

        let cleaned = (result.data.text || "")
          .replace(/[^a-zA-Z0-9]/g, "")
          .trim();

        if (cleaned.length >= 3) {
          resolve({ text: cleaned, confidence: result.data.confidence });
        } else {
          resolve({ text: cleaned, confidence: 50 });
        }
      } catch (err: any) {
        reject(err);
      }
    });

    const timeoutPromise = new Promise<{ text: string; confidence: number }>((resolve) => {
      setTimeout(() => {
        resolve({ text: "", confidence: 0 });
      }, 2500);
    });

    const result = await Promise.race([solvePromise, timeoutPromise]);

    if (result.text && result.text.length >= 3) {
      return NextResponse.json(
        {
          success: true,
          text: result.text,
          confidence: result.confidence,
        },
        { headers: corsHeaders }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Low confidence on image or OCR timeout",
        },
        { headers: corsHeaders }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to recognize CAPTCHA",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
