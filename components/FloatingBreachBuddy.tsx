"use client";

import { usePathname } from "next/navigation";
import { AiAssistant } from "@/components/AiAssistant";

export function FloatingBreachBuddy() {
  const pathname = usePathname();

  // Hide on admin management console pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return <AiAssistant />;
}
