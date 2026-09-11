import { NextResponse } from "next/server";
import { loginUser, getEmployeeBySession } from "@/lib/server/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = body.employeeId || body.email;
    const { password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Employee ID or Email and password are required" },
        { status: 400 }
      );
    }

    // Authenticate credentials against authoritative database
    const { user, token } = await loginUser(identifier, password);

    // Verify employee record exists and is active
    const employee = await getEmployeeBySession(token);
    if (!employee || !employee.is_active) {
      return NextResponse.json(
        { success: false, error: "Employee account is not authorized or is inactive" },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: employee.employee_code,
        name: employee.full_name,
        email: employee.email,
        role: employee.role === "DEPARTMENT_OFFICER" ? "OFFICER" : employee.role,
        roleTitle:
          employee.role === "DEPARTMENT_OFFICER"
            ? "Department Officer"
            : employee.role === "DEPARTMENT_ADMIN"
            ? "Department Administrator"
            : "System Administrator",
        department: "Income Tax Department (CBDT) - PAN Division",
        office: "Regional Processing Cell, Hyderabad",
      },
      message: `Authenticated as ${employee.full_name} (${employee.employee_code})`,
    });

    // Set secure server-side government session cookie
    response.cookies.set({
      name: "FORMLY_GOV_SESSION",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 3600, // 8-hour shift
      path: "/",
    });

    response.cookies.set({
      name: "formly_gov_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 3600, // 8-hour shift
      path: "/",
    });

    // Enforce strict separation: clear citizen session if present
    response.cookies.delete("FORMLY_CITIZEN_SESSION");
    response.cookies.delete("formly_citizen_session");
    response.cookies.delete("seva_saarthi_session");

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to authenticate government employee" },
      { status: 401 }
    );
  }
}
