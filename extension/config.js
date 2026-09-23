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
 * Dynamically resolves the active SevaSaarthi Vault origin.
 * Priority:
 * 1. User/Admin custom origin in chrome.storage.local (if set)
 * 2. Localhost detection (if running on or connecting to local testbed)
 * 3. Default Production origin
 */
async function getSevaSaarthiOrigin() {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    try {
      const stored = await chrome.storage.local.get(["customApiOrigin"]);
      if (stored && stored.customApiOrigin) {
        return stored.customApiOrigin.replace(/\/$/, "");
      }
    } catch (e) {}
  }

  // Automatic local development detection
  if (typeof window !== "undefined" && window.location) {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.")) {
      return SEVASAARTHI_CONFIG.LOCAL_ORIGIN;
    }
  }

  return SEVASAARTHI_CONFIG.PRODUCTION_ORIGIN;
}

/**
 * Validates whether a target portal domain is authorized for document transfer.
 */
function isTargetDomainAuthorized(hostname) {
  if (!hostname) return false;
  const lowerHost = hostname.toLowerCase();

  // Exact match
  if (SEVASAARTHI_CONFIG.AUTHORIZED_TARGET_DOMAINS.includes(lowerHost)) {
    return true;
  }

  // Suffix match for sovereign digital public infrastructure (.gov.in, .nic.in, etc.)
  for (const suffix of SEVASAARTHI_CONFIG.AUTHORIZED_DOMAIN_SUFFIXES) {
    if (lowerHost.endsWith(suffix)) {
      return true;
    }
  }

  return false;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SEVASAARTHI_CONFIG, getSevaSaarthiOrigin, isTargetDomainAuthorized };
}
