import { NextRequest, NextResponse } from "next/server";
import { getExceptions, resolveException } from "@/lib/server/db";
import { validateGovSession, unauthorizedResponse, forbiddenResponse } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await validateGovSession(request);
    if (!auth.success) {
      return auth.error?.toLowerCase().includes("forbidden")
        ? forbiddenResponse(auth.error!)
        : unauthorizedResponse(auth.error!);
    }

    const exceptions = await getExceptions();
    return NextResponse.json({ success: true, exceptions, count: exceptions.length });
  } catch (error: any) {
    console.error("[API gov/exceptions GET]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await validateGovSession(request);
    if (!auth.success) {
      return auth.error?.toLowerCase().includes("forbidden")
        ? forbiddenResponse(auth.error!)
        : unauthorizedResponse(auth.error!);
    }

    const body = await request.json();
    const { exceptionId, resolution } = body;

    if (!exceptionId || !resolution) {
      return NextResponse.json(
        { success: false, error: "Missing exceptionId or resolution" },
        { status: 400 }
      );
    }

    const ok = await resolveException(exceptionId, resolution);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Exception not found" }, { status: 404 });
    }

    const updatedList = await getExceptions();
    return NextResponse.json({ success: true, exceptions: updatedList });
  } catch (error: any) {
    console.error("[API gov/exceptions POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
