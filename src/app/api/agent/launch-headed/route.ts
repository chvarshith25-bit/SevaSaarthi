import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import { authenticateSession, getUserProfileFields } from "@/lib/server/db";
import { cookies } from "next/headers";

async function getAuthenticatedUser(request: Request) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("seva_saarthi_session")?.value ||
    (request.headers.get("Authorization")?.startsWith("Bearer ")
      ? request.headers.get("Authorization")?.substring(7)
      : null);

  if (!token) return null;
  return authenticateSession(token);
}

export async function POST(request: Request) {
  try {
    let portalUrl = "https://scholarships.gov.in";
    try {
      const body = await request.json();
      if (body.portalUrl) portalUrl = body.portalUrl;
    } catch {
      // default URL
    }

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Statutory Safeguard: Prohibit unauthorized headless browser automation against sovereign portals
    if (process.env.ALLOW_LIVE_PORTAL_AUTOMATION !== "true") {
      return NextResponse.json({
        success: false,
        error: "Live browser scraping against external government portals is disabled in compliance with DPDP Act 2023 and IT Act Section 43/66. All sovereign interactions must route through authenticated Formly Gateway Connectors.",
        statutory_notice: "Section 43/66 Information Technology Act Compliance Safeguard",
      }, { status: 403 });
    }

    const fields = await getUserProfileFields(user.id);
    const getVal = (name: string) => (fields as any[]).find((f: any) => f.field_name === name)?.value || "";

    const userProfile = {
      fullName: getVal("full_name") || user?.name || "Citizen Applicant",
      firstName: (getVal("full_name") || user?.name || "Citizen").split(" ")[0],
      lastName: (getVal("full_name") || user?.name || "").split(" ").slice(1).join(" "),
      dob: getVal("date_of_birth"),
      gender: getVal("gender") || "Male",
      aadhaarNo: getVal("aadhaar_number"),
      mobile: getVal("phone_number") || user?.phone || "",
      email: getVal("email") || user?.email || "",
      domicileState: getVal("location") || "Delhi",
      college: getVal("college_name"),
      course: getVal("education_degree"),
      rollNo: getVal("roll_number"),
      annualIncome: getVal("annual_income"),
      bankAccount: getVal("bank_account_no"),
      bankIfsc: getVal("bank_ifsc"),
      category: getVal("caste_category") || "General",
    };

    const scriptPath = path.resolve(process.cwd(), "scripts", "run-live-agent.mjs");

    console.log(`[Seva Saarthi Server] Launching Playwright Desktop Agent with profile (${userProfile.fullName}) on: ${portalUrl}`);

    // Spawn detached Node process running the Playwright script
    const child = spawn(process.execPath, [scriptPath], {
      detached: true,
      stdio: "ignore",
      env: {
        ...process.env,
        TARGET_URL: portalUrl,
        USER_PROFILE_JSON: JSON.stringify(userProfile),
      },
    });

    child.unref();

    return NextResponse.json({
      success: true,
      message: `Launched Google Chrome for ${userProfile.fullName} on ${portalUrl}. The browser window is now visible on your desktop.`,
      targetUrl: portalUrl,
      applicant: userProfile.fullName,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to launch browser" }, { status: 500 });
  }
}
