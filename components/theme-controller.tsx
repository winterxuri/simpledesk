"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";

export function ThemeController() {
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}
