"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();
  const isChatRoute = pathname?.startsWith("/chat");

  if (isChatRoute) {
    return null;
  }

  return <Navbar />;
}

