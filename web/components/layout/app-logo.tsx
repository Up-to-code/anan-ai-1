"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const LOGO_LIGHT = "/logo.png";
const LOGO_DARK = "/logo_lighit.png";

interface AppLogoProps {
  className?: string;
  height?: number;
  width?: number;
}

export function AppLogo({ className, height = 32, width }: AppLogoProps) {
  const { resolvedTheme } = useTheme();
  const logoSrc = resolvedTheme === "dark" ? LOGO_DARK : LOGO_LIGHT;
  const w = width ?? 80;

  return (
    <Image
      src={logoSrc}
      alt="عنان"
      width={w}
      height={height}
      className={cn("object-contain", className)}
      priority
    />
  );
}
