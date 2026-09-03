import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// The busy look for a refreshing element: its content stays, dimmed and pulsing.
export const busy = (loading: boolean): string => (loading ? "animate-pulse opacity-60 pointer-events-none" : "");
