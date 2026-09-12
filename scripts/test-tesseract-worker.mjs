import { createWorker } from "tesseract.js";
import fs from "fs";

async function test() {
  console.log("Creating singleton worker...");
  const t0 = Date.now();
  const worker = await createWorker("eng");
  console.log("Worker initialized in", Date.now() - t0, "ms");

  // Let's create a real test image file or buffer
  // We can write a quick sample or test an actual image
  // Let's create a 150x50 canvas buffer or test with buffer
  console.log("Testing with Buffer...");
  // Let's test with a valid PNG buffer
  const validBase64 = "iVBORw0KGgoAAAANSUhEUgAAAEAAAAAcCAYAAADCq6YAAAABbGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyI+CiAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iPgogICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KPD94cGFja2V0IGVuZD0idyI/Pqh1mD0AAAA7SURBVEiJ7c0xEQAACAMw+DeNZ0xCC8Cgq5PtWw0AAAAAAAAAAAAAAAAAAADwBf6vAgAAAPg/qgAAAAD+rwIAAN62Ad2ZASd2t/t8AAAAAElFTkSuQmCC";
  const buffer = Buffer.from(validBase64, "base64");
  const t1 = Date.now();
  const res = await worker.recognize(buffer);
  console.log("Recognition took", Date.now() - t1, "ms. Text:", res.data.text);
  await worker.terminate();
}

test();
