// SevaSaarthi Chrome Extension — Production & Environment Configuration
// Provides seamless switching between Local Development and Production Deployments

const SEVASAARTHI_CONFIG = {
  // Production portal origin (Used when deployed or configured in production)
  PRODUCTION_ORIGIN: "https://sevasaarthi.gov.in",

  // Local development origin (Used during local testing & SIH evaluation)
  LOCAL_ORIGIN: "http://localhost:3000",

  // Ephemeral single-use ticket validity window (60 seconds)
  TICKET_TTL_MS: 60000,

  // Authorized Government & Institutional Portal Domains
  AUTHORIZED_TARGET_DOMAINS: [
    "localhost",
    "127.0.0.1",
    "services.india.gov.in",
    "scholarships.gov.in",
    "onlineservices.nsdl.com",
    "tin.tin.nsdl.com",
    "protean-tinpan.com",
    "uidai.gov.in",
    "digilocker.gov.in",
    "pmkisan.gov.in",
    "eshram.gov.in",
    "vahan.parivahan.gov.in",
    "sarathi.parivahan.gov.in",
  ],

  // Wildcard domain matchers (.gov.in, .nic.in, .ac.in, .edu.in)
  AUTHORIZED_DOMAIN_SUFFIXES: [
    ".gov.in",
    ".nic.in",
    ".ac.in",
    ".edu.in",
    ".res.in",
  ],
};

/**
 * Dynamically resolves the active SevaSaarthi Vault origin with fail-closed security.
 */
async function getSevaSaarthiOrigin() {
  // 1. Check for valid user/admin configured origin
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    try {
      const stored = await chrome.storage.local.get(["customApiOrigin"]);
      if (stored && stored.customApiOrigin) {
        const candidate = stored.customApiOrigin.trim().replace(/\/$/, "");
        try {
          const parsed = new URL(candidate);
          // In production, enforce HTTPS (allow HTTP only on local loopback)
          if (parsed.protocol === "https:" || parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
            return candidate;
          }
        } catch {
          console.warn("[SevaSaarthi Config] Invalid customApiOrigin rejected, failing closed to default origin.");
        }
      }
    } catch (e) {}
  }

  // 2. Automatic local development detection
  if (typeof window !== "undefined" && window.location) {
    const host = (window.location.hostname || "").toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      return SEVASAARTHI_CONFIG.LOCAL_ORIGIN;
    }
  }

  // 3. Fail-closed production origin
  return SEVASAARTHI_CONFIG.PRODUCTION_ORIGIN;
}

/**
 * Validates whether a target portal domain is an authorized government/educational destination.
 * Uses strict DNS boundary checking to prevent crafted domain bypasses.
 */
function isTargetDomainAuthorized(rawHostname) {
  if (!rawHostname || typeof rawHostname !== "string") return false;
  
  // Clean hostname (strip port, trailing dots, convert to lowercase)
  const hostname = rawHostname.split(":")[0].replace(/\.+$/, "").toLowerCase().trim();
  if (!hostname) return false;

  // 1. Exact match against authorized portal whitelist
  if (SEVASAARTHI_CONFIG.AUTHORIZED_TARGET_DOMAINS.includes(hostname)) {
    return true;
  }

  // 2. Boundary-safe suffix matching for sovereign ccTLD domains (.gov.in, .nic.in, etc.)
  for (const rawSuffix of SEVASAARTHI_CONFIG.AUTHORIZED_DOMAIN_SUFFIXES) {
    const suffix = rawSuffix.toLowerCase();
    const bareSuffix = suffix.startsWith(".") ? suffix.slice(1) : suffix;
    const dotSuffix = suffix.startsWith(".") ? suffix : `.${suffix}`;

    // Exact match or strict dot boundary match (prevents false positives like evilgov.in)
    if (hostname === bareSuffix || hostname.endsWith(dotSuffix)) {
      return true;
    }
  }

  return false;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SEVASAARTHI_CONFIG, getSevaSaarthiOrigin, isTargetDomainAuthorized };
}
