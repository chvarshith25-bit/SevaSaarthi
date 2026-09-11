import { NextRequest, NextResponse } from "next/server";
import { validateGovSession, unauthorizedResponse } from "@/lib/server/auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const auth = await validateGovSession(request);
    if (!auth.success) {
      return auth.error?.toLowerCase().includes("forbidden")
        ? NextResponse.json({ success: false, error: auth.error }, { status: 403 })
        : unauthorizedResponse(auth.error!);
    }

    const employee = auth.employee;

    return NextResponse.json({
      success: true,
      employee: {
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
        department: "Income Tax Department (CBDT) - PAN Division", // In a real system, fetch from db.departments
        office: "Regional Processing Cell, Hyderabad", // In a real system, fetch from db.offices
      }
    });
  } catch (error: any) {
    console.error("[API gov/me GET]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
