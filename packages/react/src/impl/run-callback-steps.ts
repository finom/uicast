import type { CallbackValueSourceAssignment, ExpressionEvaluator, ReactiveProxy } from "@uicast/core";
import {
  CALLBACK_DEBOUNCE_MS,
  evaluate,
  getForwardTargets,
  parseSetAddress,
  planStepWaves,
} from "@uicast/core/internal";
import { requireScope } from "../guards";
import type { ConfirmFn, Debouncers, Scopes } from "../types";

type Step = CallbackValueSourceAssignment & { target: { scope: string; field: string } | null };

type Run = {
  payload: unknown;
  scopes: Scopes;
  confirm: ConfirmFn;
  evaluator: ExpressionEvaluator;
  elementKey: string;
};

// `confirm` and host calls are barriers; a declined `confirm` resolves early. From the first `debounce` step on,
// the steps wait `CALLBACK_DEBOUNCE_MS` of quiet, and a newer call of the same callback replaces a pending run.
export async function runCallbackSteps({
  steps,
  callbackName,
  debouncers,
  ...run
}: Run & {
  steps: CallbackValueSourceAssignment[];
  callbackName: string;
  debouncers: Debouncers;
}): Promise<void> {
  // A bad address fails classified before any step runs.
  const parsed: Step[] = steps.map((step) => ({
    ...step,
    target: step.set ? parseSetAddress(step.set, run.elementKey) : null,
  }));
  const debounceAt = parsed.findIndex((step) => step.debounce);
  const now = debounceAt === -1 ? parsed : parsed.slice(0, debounceAt);
  const later = debounceAt === -1 ? [] : parsed.slice(debounceAt);

  await runWaves(now, run);
  if (later.length === 0) return;

  debouncers.get(callbackName)?.cancel();
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      debouncers.delete(callbackName);
      runWaves(later, run).then(resolve, reject);
    }, CALLBACK_DEBOUNCE_MS);
    // A replaced or unmounted run resolves as done: nothing ran, nothing failed.
    debouncers.set(callbackName, {
      cancel: () => {
        clearTimeout(timer);
        debouncers.delete(callbackName);
        resolve();
      },
    });
  });
}

async function runWaves(steps: Step[], { payload, scopes, confirm, evaluator, elementKey }: Run): Promise<void> {
  // An invalid expression is no barrier: it fails classified when evaluated.
  const callsHostFunction = (expr: string | undefined): boolean => {
    if (!expr) return false;
    try {
      return evaluator.validate(expr).toolCalls.length > 0;
    } catch {
      return false;
    }
  };
  const waves = planStepWaves(
    steps,
    evaluator,
    (step) => callsHostFunction("expr" in step ? step.expr : undefined),
    // A row write also wakes the fields its list's `each` reads.
    (step) => (step.target ? forwardedFields(scopes, step.target.scope) : []),
  );

  for (const wave of waves) {
    if (wave[0].confirm) {
      const confirmed = await confirm(wave[0].confirm);
      if (!confirmed) return;
    }
    const evaluated = wave.map((step) => {
      const write = step.target && {
        scope: requireScope(scopes, step.target.scope, elementKey),
        field: step.target.field,
      };
      const currentValue = write ? write.scope[write.field] : undefined;
      // A synchronous throw becomes a rejection, so allSettled observes every step.
      return {
        write,
        value: (async () => evaluate(step, { evt: payload, scopes, currentValue }, evaluator))(),
      };
    });
    // Successful writes land in step order before the first rejection fails the run.
    const settled = await Promise.allSettled(evaluated.map((e) => e.value));
    let firstError: unknown = null;
    settled.forEach((result, i) => {
      if (result.status === "fulfilled") {
        const { write } = evaluated[i];
        if (write) write.scope.$$set(write.field, result.value);
      } else if (firstError === null) {
        firstError = result.reason;
      }
    });
    if (firstError !== null) throw firstError;
  }
}

// Every field a write to `scope` also emits on, transitively.
function forwardedFields(scopes: Scopes, scope: string): string[] {
  const out: string[] = [];
  const visit = (proxy: ReactiveProxy | undefined) => {
    if (!proxy) return;
    for (const t of getForwardTargets(proxy)) {
      const name = Object.keys(scopes).find((k) => scopes[k] === t.scope);
      const key = `scopes.${name}.${t.field}`;
      if (name && !out.includes(key)) {
        out.push(key);
        visit(t.scope);
      }
    }
  };
  visit(scopes[scope]);
  return out;
}
