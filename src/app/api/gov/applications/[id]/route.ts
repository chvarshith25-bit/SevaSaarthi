import { NextRequest, NextResponse } from "next/server";
import {
  getApplicationById,
  updatePanApplication,
  officerAcceptApplication,
  officerReturnApplication,
  officerRejectApplication,
  advancePhysicalPipelineStage,
  citizenResubmitCorrection,
  retryApplicationVerification,
  getAuditLogs,
} from "@/lib/server/db";
import { validateGovSession, unauthorizedResponse, forbiddenResponse } from "@/lib/server/auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateGovSession(request);
    if (!auth.success) {
      return auth.error?.toLowerCase().includes("forbidden")
        ? forbiddenResponse(auth.error!)
        : unauthorizedResponse(auth.error!);
    }

    const { id } = await context.params;
    const app = await getApplicationById(id);

    if (!app) {
      return NextResponse.json({ success: false, error: `Application not found: ${id}` }, { status: 404 });
    }

    const logs = await getAuditLogs(id);
    return NextResponse.json({ success: true, application: app, auditLogs: logs });
  } catch (error: any) {
    console.error("[API gov/applications/[id] GET]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateGovSession(request);
    if (!auth.success) {
      return auth.error?.toLowerCase().includes("forbidden")
        ? forbiddenResponse(auth.error!)
        : unauthorizedResponse(auth.error!);
    }

    const { id } = await context.params;
    const app = await getApplicationById(id);

    if (!app) {
      return NextResponse.json({ success: false, error: `Application not found: ${id}` }, { status: 404 });
    }

    // RBAC & Department Boundary Check
    const { employee } = auth;
    const isSystemAdmin = employee.role === "SYSTEM_ADMIN";
    const isDeptAdmin = employee.role === "DEPARTMENT_ADMIN" && employee.department_id === app.department_id;
    const isAssignedOfficer = employee.role === "DEPARTMENT_OFFICER" && employee.id === app.assigned_employee_id;

    if (!isSystemAdmin && !isDeptAdmin && !isAssignedOfficer) {
      return forbiddenResponse("You are not authorized to access or modify this application. It is either assigned to another officer or belongs to a different department.");
    }

    const body = await request.json();
    const { action, remarks, reason, updatedFields } = body;

    let result = null;

    switch (action) {
      case "ACCEPT":
        result = await officerAcceptApplication(
          id,
          auth.user.id,
          auth.user.name,
          remarks
        );
        break;

      case "RETURN":
        if (!reason || !reason.trim()) {
          return NextResponse.json(
            { success: false, error: "Mandatory return reason is required" },
            { status: 400 }
          );
        }
        result = await officerReturnApplication(
          id,
          auth.user.id,
          auth.user.name,
          reason
        );
        break;

      case "REJECT":
        if (!reason || !reason.trim()) {
          return NextResponse.json(
            { success: false, error: "Mandatory rejection reason is required" },
            { status: 400 }
          );
        }
        result = await officerRejectApplication(
          id,
          auth.user.id,
          auth.user.name,
          reason
        );
        break;

      case "ADVANCE_STAGE":
        result = await advancePhysicalPipelineStage(id);
        break;

      case "RETRY_VERIFICATION":
        result = await retryApplicationVerification(id);
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Invalid or unsupported action: ${action}. Generic updates are forbidden.` },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json({ success: false, error: `Failed to process action ${action}` }, { status: 400 });
    }

    const logs = await getAuditLogs(id);
    return NextResponse.json({ success: true, application: result, auditLogs: logs });
  } catch (error: any) {
    console.error("[API gov/applications/[id] PATCH]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
