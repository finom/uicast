import { clsx, type ClassValue } from "clsx";
import type { KeyboardEvent } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const busyClass = (busy: boolean): string => (busy ? "animate-pulse opacity-60 pointer-events-none" : "");

// For an element that handles clicks: Tab reaches it, and Enter or Space clicks it. Keys from a control inside it pass by.
export const clickByKeyboard = (active: boolean) =>
  active
    ? {
        tabIndex: 0,
        onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
          if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
          e.preventDefault();
          e.currentTarget.click();
        },
      }
    : {};
