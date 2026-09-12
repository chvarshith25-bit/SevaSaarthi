import Tesseract from "tesseract.js";

async function test() {
  console.log("Starting Tesseract test...");
  const start = Date.now();
  try {
    // Generate a simple test canvas or buffer with "HELLO"
    // Using an inline data URI of a text image
    const sampleImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGYzAAAOAA/587iFMAAAAASUVORK5CYII=";
    const res = await Tesseract.recognize(sampleImg, "eng", {
      logger: m => console.log(m.status, m.progress),
    });
    console.log("Success in", Date.now() - start, "ms. Text:", res.data.text);
  } catch (e) {
    console.error("Failed in", Date.now() - start, "ms. Error:", e);
  }
}

test();
