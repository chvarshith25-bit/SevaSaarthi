import { NextResponse } from "next/server";
import Tesseract from "tesseract.js";

// Basic CORS headers for Chrome Extension and web client access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
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

    // Run OCR using Tesseract.js with alphanumeric whitelist
    const result = await Tesseract.recognize(imageInput, "eng", {
      logger: () => {},
    });

    // Clean up raw text (remove whitespace, newlines, special characters)
    let cleaned = (result.data.text || "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .trim();

    return NextResponse.json(
      {
        success: true,
        text: cleaned,
        confidence: result.data.confidence,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("CAPTCHA solver error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to recognize CAPTCHA",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
