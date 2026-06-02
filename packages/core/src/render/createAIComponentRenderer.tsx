import { Activity, type ReactNode } from "react";
import type {
  AssignableWithConfirmExpr,
  ChunkComponent,
  CombinedSpec,
  ValueExpr,
} from "../types";
import type { AIComponentDef } from "./createAIComponentDef";
import { parseScope } from "../utils/utils";
import { evaluate } from "../eval/evaluate";
import { useConfirm } from "../components/ConfirmModal";
import { useRendererRegistry } from "./RendererRegistry";

type CallbacksToFunctions<T extends Record<string, CombinedSpec>> = {
  [K in keyof T]: (args: CombinedSpec.InferOutput<T[K]>) => Promise<void>;
};

export const createAIComponentRenderer = <
  TProps extends CombinedSpec,
  TCallbacks extends Record<string, CombinedSpec>,
>({
  def,
  renderer: render,
  placeholder,
}: {
  def: AIComponentDef & { props: TProps; callbacks?: TCallbacks };
  renderer: (
    props: {
      children?: ReactNode;
      generatedKey: string;
    } & CombinedSpec.InferOutput<TProps> &
      CallbacksToFunctions<TCallbacks>,
  ) => React.ReactElement;
  placeholder?: () => React.ReactElement;
}) => {
  const component = (myprops: {
    chunk: ChunkComponent;
    children: ReactNode;
    scopes: Record<string, any>;
  }) => {
    const { chunk, children } = myprops;
    const confirm = useConfirm();
    const { functions } = useRendererRegistry();
    const props: CombinedSpec.InferOutput<TProps> = chunk.props
      ? (evaluate<ValueExpr>(
          chunk.props,
          { scopes: myprops.scopes },
          { functions },
        ) as CombinedSpec.InferOutput<TProps>)
      : ({} as CombinedSpec.InferOutput<TProps>);
    const hidden = chunk.hidden
      ? evaluate<ValueExpr>(
          chunk.hidden,
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
            const result = await evaluate<AssignableWithConfirmExpr>(
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

export type AIComponentRenderer = ReturnType<typeof createAIComponentRenderer>;
