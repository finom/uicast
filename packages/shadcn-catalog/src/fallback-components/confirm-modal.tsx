"use client";
import type { ConfirmComponentProps } from "@uicast/react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

// Shadcn confirm modal — the visual half of the confirm flow. Wire it up as
// `<RendererConfigProvider fallbackComponents={{ confirm: ConfirmModal }}>`;
// stateless, the engine drives `open`/`message` and settles via
// `onConfirm`/`onCancel`.
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
