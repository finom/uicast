"use client";

import { useMemo, useRef } from "react";
import type { RenderFailure } from "@uicast/core/prompt";
import type { ErrorComponentProps, FallbackComponents } from "@uicast/react";
import { ConfirmModal } from "@uicast/shadcn-catalog/fallback-components";
import { RecoverableRenderError } from "@/components/recoverable-render-error";

// One identity for the component's life: a new one would remount every UI block. The ref keeps `onRecover` current.
export function useRendererDefaults(onRecover: (failure: RenderFailure) => void): FallbackComponents {
  const recoverRef = useRef(onRecover);
  recoverRef.current = onRecover;
  return useMemo(
    () => ({
      confirm: ConfirmModal,
      error: ({ error, elementKey }: ErrorComponentProps) => (
        <RecoverableRenderError
          error={error}
          elementKey={elementKey}
          onRecover={
            elementKey ? () => recoverRef.current({ key: elementKey, message: error.message }) : undefined
          }
        />
      ),
    }),
    [],
  );
}
