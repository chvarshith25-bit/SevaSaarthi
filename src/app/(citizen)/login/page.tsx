import { headers } from "next/headers";
import { GovernmentLoginView } from "@/components/gov/GovernmentLoginView";
import CitizenLoginClient from "./CitizenLoginClient";

export default async function LoginPage() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const forwardedPort = headersList.get("x-forwarded-port") || "";
  const forwardedHost = headersList.get("x-forwarded-host") || "";
  const isGov =
    forwardedPort === "3001" ||
    host.endsWith(":3001") ||
    forwardedHost.endsWith(":3001") ||
    process.env.NEXT_PUBLIC_APP_PLATFORM === "government" ||
    process.env.PLATFORM === "government";

  if (isGov) {
    return <GovernmentLoginView />;
  }

  return <CitizenLoginClient />;
}
