/**
 * Client-Side Document & Image Compressor for Official Government Portals
 * Compliant with strict DPI and KB restrictions across Indian e-Gov platforms:
 * (PAN Card Protean/NSDL, NSP Scholarships, Passport Seva, UPSC/SSC, State e-District)
 */

export interface PortalPreset {
  id: string;
  name: string;
  portal: string;
  category: "PAN" | "SCHOLARSHIP" | "PASSPORT" | "UPSC" | "STATE" | "CUSTOM";
  targetMaxKb: number;
  format: "image/jpeg" | "image/png" | "application/pdf";
  description: string;
  recommendedDimensions?: { width: number; height: number };
}

export const PORTAL_PRESETS: PortalPreset[] = [
  {
    id: "pan-photo",
    name: "PAN Card - Applicant Photo",
    portal: "Protean (NSDL) / UTIITSL",
    category: "PAN",
    targetMaxKb: 50,
    format: "image/jpeg",
    description: "Max 50 KB, Color JPEG, 200 DPI (approx 213x213 or 3.5x2.5cm)",
    recommendedDimensions: { width: 600, height: 600 },
  },
  {
    id: "pan-signature",
    name: "PAN Card - Signature Scan",
    portal: "Protean (NSDL) / UTIITSL",
    category: "PAN",
    targetMaxKb: 50,
    format: "image/jpeg",
    description: "Max 50 KB, JPEG on white background, 200 DPI",
    recommendedDimensions: { width: 800, height: 400 },
  },
  {
    id: "pan-doc",
    name: "PAN Card - Supporting Proof / Aadhaar",
    portal: "Protean (NSDL) / UTIITSL",
    category: "PAN",
    targetMaxKb: 300,
    format: "image/jpeg",
    description: "Max 300 KB per supporting document (Identity / Address Proof)",
  },
  {
    id: "nsp-scholarship",
    name: "NSP Scholarship - Marksheet / Bonafide",
    portal: "National Scholarship Portal (NSP)",
    category: "SCHOLARSHIP",
    targetMaxKb: 200,
    format: "image/jpeg",
    description: "Max 200 KB per certificate or passbook page",
  },
  {
    id: "state-edistrict-100",
    name: "State Portal / MeeSeva - Certificate (100 KB)",
    portal: "e-District / MeeSeva / Seva Sindhu",
    category: "STATE",
    targetMaxKb: 100,
    format: "image/jpeg",
    description: "Strict 100 KB limit for Tahsildar Income / Caste certificates",
  },
  {
    id: "upsc-photo",
    name: "UPSC / SSC - Photograph",
    portal: "UPSC / SSC OTR Portal",
    category: "UPSC",
    targetMaxKb: 50,
    format: "image/jpeg",
    description: "Between 20 KB and 50 KB, clear white background",
    recommendedDimensions: { width: 450, height: 550 },
  },
  {
    id: "upsc-signature",
    name: "UPSC / SSC - Signature",
    portal: "UPSC / SSC OTR Portal",
    category: "UPSC",
    targetMaxKb: 20,
    format: "image/jpeg",
    description: "Between 10 KB and 20 KB in JPEG format",
    recommendedDimensions: { width: 400, height: 200 },
  },
  {
    id: "passport-doc",
    name: "Passport Seva - Identity / Address Proof",
    portal: "Passport Seva Kendra (MEA)",
    category: "PASSPORT",
    targetMaxKb: 1024,
    format: "image/jpeg",
    description: "Max 1 MB (1024 KB) supporting document",
  },
];

export interface CompressionResult {
  compressedBlob: Blob;
  compressedFile: File;
  originalSizeKb: number;
  compressedSizeKb: number;
  compressionRatioPercent: number;
  width: number;
  height: number;
  dataUrl: string;
}

/**
 * Compresses an image file to be under targetMaxKb using Canvas scaling and JPEG quality reduction.
 */
export async function compressImageToTargetSize(
  file: File | Blob,
  targetMaxKb: number,
  outputFormat: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
  filename: string = "compressed_document.jpg"
): Promise<CompressionResult> {
  const originalSizeKb = Math.round((file.size / 1024) * 10) / 10;
  const targetBytes = targetMaxKb * 1024;

  // Load image
  const img = await loadImage(file);
  let currentWidth = img.naturalWidth || img.width;
  let currentHeight = img.naturalHeight || img.height;

  // Setup canvas
  const canvas = document.createElement("canvas");
  canvas.width = currentWidth;
  canvas.height = currentHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas 2D context");

  // Draw initial image with white background for transparency safety
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, currentWidth, currentHeight);
  ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

  // If format is PNG and user target is low, we fallback to JPEG for compression ratio
  const format = outputFormat === "image/png" && targetMaxKb < 300 ? "image/jpeg" : outputFormat;

  let quality = 0.92;
  let bestBlob: Blob | null = null;
  let iteration = 0;

  // Step 1: Quality reduction loop
  while (iteration < 8) {
    const blob = await canvasToBlob(canvas, format, quality);
    bestBlob = blob;

    if (blob.size <= targetBytes) {
      break;
    }

    // Step down quality
    quality -= 0.15;
    if (quality < 0.2) {
      break;
    }
    iteration++;
  }

  // Step 2: If still exceeding target size after quality drop, downscale resolution
  let scaleIteration = 0;
  while (bestBlob && bestBlob.size > targetBytes && scaleIteration < 8) {
    currentWidth = Math.max(150, Math.floor(currentWidth * 0.85));
    currentHeight = Math.max(150, Math.floor(currentHeight * 0.85));

    canvas.width = currentWidth;
    canvas.height = currentHeight;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, currentWidth, currentHeight);
    ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

    const blob = await canvasToBlob(canvas, format, Math.max(0.4, quality));
    bestBlob = blob;
    scaleIteration++;
  }

  if (!bestBlob) {
    throw new Error("Failed to compress document.");
  }

  const compressedSizeKb = Math.round((bestBlob.size / 1024) * 10) / 10;
  const compressionRatioPercent = Math.max(
    0,
    Math.round(((file.size - bestBlob.size) / file.size) * 100)
  );

  const compressedFile = new File([bestBlob], filename, {
    type: bestBlob.type,
    lastModified: Date.now(),
  });

  const dataUrl = await blobToDataUrl(bestBlob);

  return {
    compressedBlob: bestBlob,
    compressedFile,
    originalSizeKb,
    compressedSizeKb,
    compressionRatioPercent,
    width: currentWidth,
    height: currentHeight,
    dataUrl,
  };
}

function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to load document as image for compression."));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas to Blob conversion failed"));
      },
      format,
      quality
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Triggers a browser download for the compressed file
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
