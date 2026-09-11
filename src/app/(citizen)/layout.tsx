import React from "react";
import { CitizenLayout } from "@/components/citizen/CitizenLayout";

export default function CitizenRootLayout({ children }: { children: React.ReactNode }) {
  return <CitizenLayout>{children}</CitizenLayout>;
}
