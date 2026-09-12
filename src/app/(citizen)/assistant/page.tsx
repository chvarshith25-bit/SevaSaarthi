"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AutofillAssistant } from "@/components/assistant/AutofillAssistant";

export default function AssistantPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    router.push("/profile");
  };

  return (
    <div className="p-6">
      <AutofillAssistant isOpen={isOpen} onClose={handleClose} />
    </div>
  );
}
