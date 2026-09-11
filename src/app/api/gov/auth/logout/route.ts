import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logoutSession } from "@/lib/server/db";

export async function POST() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("FORMLY_GOV_SESSION")?.value ||
    cookieStore.get("formly_gov_session")?.value;
  if (token) {
    await logoutSession(token);
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out from Government Operations Console",
  });

  response.cookies.delete("FORMLY_GOV_SESSION");
  response.cookies.delete("formly_gov_session");
  return response;
}
