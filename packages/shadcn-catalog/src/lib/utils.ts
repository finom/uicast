import { clsx, type ClassValue } from "clsx";
import type { KeyboardEvent, MouseEvent } from "react";
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

const CONTROL =
  "a, button, input, select, textarea, label, summary, [contenteditable], [role=button], [role=checkbox], [role=switch], [role=radio], [role=tab], [role=slider], [role=combobox], [role=option], [role=menuitem], [role=menuitemcheckbox], [role=menuitemradio]";

// For a container that handles clicks: a click on a control inside it, or from a portal it opened (a menu, a dialog),
// belongs to that control.
export const ownClick =
  (onClick: (e: MouseEvent<HTMLElement>) => void) =>
  (e: MouseEvent<HTMLElement>): void => {
    const container = e.currentTarget;
    if (!(e.target instanceof Element) || !container.contains(e.target)) return;
    const control = e.target.closest(CONTROL);
    if (control && control !== container && container.contains(control)) return;
    onClick(e);
  };
