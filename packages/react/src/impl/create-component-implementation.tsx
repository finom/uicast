import { Activity, type ReactNode } from "react";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import {
  parseScope,
  evaluate,
  type ComponentEntry,
  type CombinedSpec,
  type ComponentDefinition,
} from "@ui-fired/core";
import { useConfirm } from "../providers/confirm";
import { useRendererRegistry } from "../store/renderer-registry";
import type { ComponentImplementation } from "../types";

// A `null` callback payload means "no event data": the handler is a no-arg
// function (`onClick()`), not `(evt: null)`.
type CallbackFn<S extends CombinedSpec> = [StandardSchemaV1.InferOutput<S>] extends [null]
  ? () => Promise<void>
  : (args: StandardSchemaV1.InferOutput<S>) => Promise<void>;

type CallbacksToFunctions<T extends Record<string, CombinedSpec>> = {
  [K in keyof T]: CallbackFn<T[K]>;
};

export const createComponentImplementation = <
  TProps extends CombinedSpec,
  TCallbacks extends Record<string, CombinedSpec>,
>({
  def,
  render,
  placeholder,
}: {
  def: ComponentDefinition<TProps, TCallbacks>;
  render: (
    props: {
      children?: ReactNode;
      generatedKey: string;
    } & StandardSchemaV1.InferOutput<TProps> &
      CallbacksToFunctions<TCallbacks>,
  ) => React.ReactElement;
  placeholder?: () => React.ReactElement;
}): ComponentImplementation<TProps, TCallbacks> => {
  const component = (myprops: {
    entry: ComponentEntry;
    children: ReactNode;
    scopes: Record<string, any>;
  }) => {
    const { entry, children } = myprops;
    const confirm = useConfirm();
    const { functions, allowedGlobals } = useRendererRegistry();
    const props: StandardSchemaV1.InferOutput<TProps> = entry.props
      ? (evaluate(
          entry.props,
          { scopes: myprops.scopes },
          { functions, allowedGlobals },
        ) as StandardSchemaV1.InferOutput<TProps>)
      : ({} as StandardSchemaV1.InferOutput<TProps>);
    const hidden = entry.hidden
      ? evaluate(
          { expr: entry.hidden },
          { scopes: myprops.scopes },
          { functions, allowedGlobals },
        )
      : false;
    const entryCallbacks = entry.callbacks ? entry.callbacks : {};
    const callbacks = Object.fromEntries(
      Object.keys(entryCallbacks).map((key) => [
        key,
        async (evt: unknown) => {
          for (const setExpr of entryCallbacks[key]) {
            if (setExpr.confirm) {
              const confirmed = await confirm(setExpr.confirm);
              if (!confirmed) return;
            }
            const result = await evaluate(
              setExpr,
              { evt, scopes: myprops.scopes },
              { functions, allowedGlobals },
            );
            if (setExpr.set) {
              const [targetScope, targetPath] = parseScope(setExpr.set);
              myprops.scopes[targetScope].$set(targetPath, result);
            }
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        },
      ]),
    ) as CallbacksToFunctions<TCallbacks>;

    const hasReactChildren = Array.isArray(children)
      ? children.length > 0
      : Boolean(children);
    const result = render({
      ...(props as object),
      ...(hasReactChildren ? { children } : {}),
      ...callbacks,
      generatedKey: entry.key,
    });

    if (entry.hidden) {
      return <Activity mode={hidden ? "hidden" : "visible"}>{result}</Activity>;
    }

    return result;
  };

  return { def, render: component, placeholder: placeholder ?? null };
};
