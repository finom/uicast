"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import { AppSidebar } from "./app-sidebar";

// Mobile drawer around the same sidebar; closes on navigation.
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // biome-ignore lint/correctness/useExhaustiveDependencies: close on route change by design
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="md:hidden">
      <Button variant="ghost" size="sm" aria-label="Menu" onClick={() => setOpen(true)}>
        <Menu className="size-5" />
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 flex h-full w-64 flex-col border-r bg-sidebar">
            <div className="flex justify-end p-2 pb-0">
              <Button variant="ghost" size="sm" aria-label="Close" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <AppSidebar mobile />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
