"use client";
import type { ConfirmComponentProps } from "@ui-fired/react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

/**
 * Shadcn-styled confirm modal — the plug-and-play visual half of the confirm
 * flow. Pass it as `<Renderer components={{ confirm: ConfirmModal }}>` and
 * every `confirm:` carried by a generated callback resolves through this
 * dialog instead of the browser-native `window.confirm`. Stateless by design:
 * the engine owns the pending-confirm state and drives these props (see
 * `ConfirmComponentProps`). Bring your own component to use a different modal.
 */
export const ConfirmModal = ({
  open,
  message,
  onConfirm,
  onCancel,
}: ConfirmComponentProps) => (
  <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogDescription>{message}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Confirm
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
