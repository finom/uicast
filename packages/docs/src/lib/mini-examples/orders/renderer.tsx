"use client";
import {
  EntriesRenderer,
  RendererProvider,
  type ConfirmComponentProps,
} from "@uicast/react";
import { Button } from "@/components/ui/button";
import {
  ButtonImpl,
  CardImpl,
  EditDialogImpl,
  HeadingImpl,
  ProductRowImpl,
} from "./impl";
import { listProducts, updateProduct } from "./tools";
import type { ComponentEntry } from "@uicast/core";
import { Evaluator } from "@uicast/expr";

const implementations = [
  CardImpl,
  HeadingImpl,
  ButtonImpl,
  ProductRowImpl,
  EditDialogImpl,
];
const functions = [listProducts, updateProduct];
const evaluator = new Evaluator({ functions });

// Answers every `confirm` step in every document; without it the engine falls
// back to window.confirm.
const fallbackComponents = {
  confirm: ({ open, message, onConfirm, onCancel }: ConfirmComponentProps) =>
    open ? (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40">
        <div className="grid w-64 gap-3 rounded-lg border bg-background p-4 shadow-lg">
          <div className="text-sm">{message}</div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={onConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </div>
    ) : null,
};

export function Products({ entries }: { entries: ComponentEntry[] }) {
  return (
    <RendererProvider
      implementations={implementations}
      evaluator={evaluator}
      fallbackComponents={fallbackComponents}
    >
      <EntriesRenderer entries={entries} />
    </RendererProvider>
  );
}
