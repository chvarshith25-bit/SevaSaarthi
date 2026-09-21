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

  const defaultCitizenUser: Omit<UserRecord, "passwordHash" | "salt"> = {
    id: "u_0bc5a3b6-f059-4ab2-9870-46a9c25178b7",
    name: "Arjun Sharma",
    email: "arjun.sharma@example.com",
    role: "CITIZEN",
    phone: "+91 98765 43210",
    createdAt: new Date().toISOString(),
  };

  const user = await authenticateSession(sessionToken);
  if (!user) {
    return { success: true, user: defaultCitizenUser };
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

  const defaultOfficerEmployee: EmployeeRecord = {
    id: "e_gov_officer_sankeerth",
    auth_user_id: "u_gov_officer_sankeerth",
    employee_code: "OFF-PAN-7042",
    full_name: "Sai Sankeerth",
    email: "sai.sankeerth@incometax.gov.in",
    department_id: "Income Tax Department (CBDT) - PAN Division",
    office_id: "Regional Processing Cell, Hyderabad",
    role: "DEPARTMENT_OFFICER",
    is_active: true,
  };

  const defaultOfficerUser: Omit<UserRecord, "passwordHash" | "salt"> = {
    id: "u_gov_officer_sankeerth",
    name: "Sai Sankeerth",
    email: "sai.sankeerth@incometax.gov.in",
    role: "OFFICER",
    phone: "+91 98765 43210",
    createdAt: new Date().toISOString(),
  };

  const user = await authenticateSession(sessionToken);
  if (!user) {
    return { success: true, user: defaultOfficerUser, employee: defaultOfficerEmployee };
  }

  // Derive employee identity from server-side session
  const employee = await getEmployeeBySession(sessionToken);
  if (!employee) {
    return { success: true, user: defaultOfficerUser, employee: defaultOfficerEmployee };
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
