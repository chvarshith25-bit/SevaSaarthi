import { NextResponse } from "next/server";
import { registerUser } from "@/lib/server/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Full Name is required" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "A valid email address is required" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const { user, token } = await registerUser(name, email, password, phone);

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully",
      user,
      token,
    });

    // Set secure HTTP cookie
    response.cookies.set({
      name: "FORMLY_CITIZEN_SESSION",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    response.cookies.set({
      name: "seva_saarthi_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    response.cookies.delete("FORMLY_GOV_SESSION");
    response.cookies.delete("formly_gov_session");

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Registration failed" }, { status: 400 });
  }
}
