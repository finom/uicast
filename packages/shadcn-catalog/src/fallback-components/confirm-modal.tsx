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

/**
 * A shadcn dialog for `confirm` steps, for `fallbackComponents.confirm`.
 *
 * @example
 * const fallbackComponents = { confirm: ConfirmModal, error: RenderError }; // for <RendererProvider>
 */
export const ConfirmModal = ({ open, message, onConfirm, onCancel }: ConfirmComponentProps) => (
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
