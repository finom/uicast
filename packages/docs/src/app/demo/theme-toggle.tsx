"use client";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@uicast/shadcn-catalog/ui/dropdown-menu";

const THEMES = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "system", label: "System", Icon: MonitorIcon },
] as const;

/**
 * Theme switcher covering all three next-themes modes — Light, Dark, and System
 * (follow the OS). A plain light/dark toggle can't express "System", so once
 * clicked the user could never get back to following the OS; the menu makes all
 * three reachable and the radio group marks the active one.
 *
 * The trigger shows the icon of the *chosen* mode (so "System" is visible at a
 * glance, not hidden behind whatever it resolved to). The chosen theme is only
 * known on the client, so the trigger icon stays invisible until mounted — that
 * keeps SSR and the first client render identical (no hydration mismatch). The
 * menu items live in a portal that only renders on open, so they don't affect
 * hydration.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const TriggerIcon = THEMES.find((t) => t.value === theme)?.Icon ?? SunIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label="Theme" title="Theme">
          <TriggerIcon className={mounted ? undefined : "opacity-0"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          {THEMES.map(({ value, label, Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon className="mr-2 size-4" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
