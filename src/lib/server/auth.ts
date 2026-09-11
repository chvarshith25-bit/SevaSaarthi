import { NextRequest, NextResponse } from "next/server";
import { authenticateSession, getEmployeeBySession, UserRecord, EmployeeRecord } from "./db";

export interface GovAuthContext {
  user: Omit<UserRecord, "passwordHash" | "salt">;
  employee: EmployeeRecord;
}

export type GovSessionResult =
  | { success: true; user: GovAuthContext["user"]; employee: EmployeeRecord; error?: undefined }
  | { success: false; user?: undefined; employee?: undefined; error: string; status: number };

export interface CitizenAuthContext {
  user: Omit<UserRecord, "passwordHash" | "salt">;
}

export type CitizenSessionResult =
  | { success: true; user: CitizenAuthContext["user"]; error?: undefined }
  | { success: false; user?: undefined; error: string; status: number };

export async function validateCitizenSession(request: NextRequest): Promise<CitizenSessionResult> {
  const sessionToken =
    request.cookies.get("FORMLY_CITIZEN_SESSION")?.value ||
    request.cookies.get("formly_citizen_session")?.value ||
    request.cookies.get("seva_saarthi_session")?.value;

  if (!sessionToken) {
    return { success: false, status: 401, error: "Unauthorized: No citizen session found" };
  }

  const user = await authenticateSession(sessionToken);
  if (!user) {
    return { success: false, status: 401, error: "Unauthorized: Invalid or expired citizen session" };
  }

  return { success: true, user };
}

export async function validateGovSession(request: NextRequest): Promise<GovSessionResult> {
  const sessionToken =
    request.cookies.get("FORMLY_GOV_SESSION")?.value ||
    request.cookies.get("formly_gov_session")?.value;

  if (!sessionToken) {
    return { success: false, status: 401, error: "Unauthorized: No government session found" };
  }

  const user = await authenticateSession(sessionToken);
  if (!user) {
    return { success: false, status: 401, error: "Unauthorized: Invalid or expired government session" };
  }

  // Derive employee identity from server-side session
  const employee = await getEmployeeBySession(sessionToken);
  if (!employee) {
    return {
      success: false,
      status: 403,
      error: "Forbidden: No authorized employee profile bound to this account",
    };
  }

  if (!employee.is_active) {
    return {
      success: false,
      status: 403,
      error: "Forbidden: Employee account is suspended or inactive",
    };
  }

  const validRoles = ["DEPARTMENT_OFFICER", "DEPARTMENT_ADMIN", "SYSTEM_ADMIN"];
  if (!validRoles.includes(employee.role)) {
    return {
      success: false,
      status: 403,
      error: "Forbidden: Insufficient role privileges for statutory government operations",
    };
  }

  return { success: true, user, employee };
}

export async function validateGovRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<GovSessionResult> {
  const auth = await validateGovSession(request);
  if (!auth.success) return auth;

  if (!allowedRoles.includes(auth.employee.role)) {
    return {
      success: false,
      status: 403,
      error: `Forbidden: This action requires one of the following roles: ${allowedRoles.join(", ")}`,
    };
  }

  return auth;
}

export function unauthorizedResponse(error: string = "Unauthorized") {
  return NextResponse.json({ success: false, error }, { status: 401 });
}

export function forbiddenResponse(error: string = "Forbidden") {
  return NextResponse.json({ success: false, error }, { status: 403 });
}
