import { Activity, type ReactNode } from "react";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import {
  parseScope,
  evaluate,
  type ComponentEntry,
  type CombinedSpec,
  type ComponentDefinition,
} from "@ui-fired/core";
import { useConfirm } from "../visuals/confirm";
import { useRendererRegistry } from "../store/renderer-registry";
import type { ComponentImplementation } from "../types";

type CallbacksToFunctions<T extends Record<string, CombinedSpec>> = {
  [K in keyof T]: (args: StandardSchemaV1.InferOutput<T[K]>) => Promise<void>;
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
    chunk: ComponentEntry;
    children: ReactNode;
    scopes: Record<string, any>;
  }) => {
    const { chunk, children } = myprops;
    const confirm = useConfirm();
    const { functions } = useRendererRegistry();
    const props: StandardSchemaV1.InferOutput<TProps> = chunk.props
      ? (evaluate(
          chunk.props,
          { scopes: myprops.scopes },
          { functions },
        ) as StandardSchemaV1.InferOutput<TProps>)
      : ({} as StandardSchemaV1.InferOutput<TProps>);
    const hidden = chunk.hidden
      ? evaluate(
          // `hidden` is a bare expr string — wrap as expr for `evaluate`, like `each`.
          { expr: chunk.hidden },
          { scopes: myprops.scopes },
          { functions },
        )
      : false;
    const chunkCallbacks = chunk.callbacks ? chunk.callbacks : {};
    const callbacks = Object.fromEntries(
      Object.keys(chunkCallbacks).map((key) => [
        key,
        async (evt: unknown) => {
          for (const setExpr of chunkCallbacks[key]) {
            if (setExpr.confirm) {
              const confirmed = await confirm(setExpr.confirm);
              if (!confirmed) return;
            }
            const result = await evaluate(
              setExpr,
              { evt, scopes: myprops.scopes },
              { functions },
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

    // Empty arrays are truthy in JS, so `children ? …` would happily spread
    // a zero-length children array on top of any `children` supplied via
    // `chunk.props` (e.g. an evaluated expression like
    // `({ children: scopes.inv.item.name })`). RecursiveRenderer already
    // collapses missing/empty `element.children` to `null` upstream — this
    // is belt-and-suspenders for any non-recursive entry path.
    const hasReactChildren = Array.isArray(children)
      ? children.length > 0
      : Boolean(children);
    const result = render({
      ...(props as object),
      ...(hasReactChildren ? { children } : {}),
      ...callbacks,
      generatedKey: chunk.key,
    });

    if (chunk.hidden) {
      return <Activity mode={hidden ? "hidden" : "visible"}>{result}</Activity>;
    }

    return result;
  };

  return { component, placeholder: placeholder ?? null, ...def };
};
