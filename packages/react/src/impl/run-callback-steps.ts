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

// A bad address fails classified before any step runs.
const parseSteps = (steps: CallbackValueSourceAssignment[], elementKey: string): Step[] =>
  steps.map((step) => ({ ...step, target: step.set ? parseSetAddress(step.set, elementKey) : null }));

// Every step at once, with no debounce. Resolves `false` when the user declined a `confirm`.
export const runStepsNow = ({ steps, ...run }: Run & { steps: CallbackValueSourceAssignment[] }): Promise<boolean> =>
  runWaves(parseSteps(steps, run.elementKey), run, () => true);

// The newest run of each callback, per element (its `debouncers`).
const newestRuns = new WeakMap<Debouncers, Map<string, symbol>>();

// `confirm` and host calls are barriers; a declined `confirm` resolves early. From the first `debounce` step on,
// the steps wait `CALLBACK_DEBOUNCE_MS` of quiet, and a newer call of the same callback replaces a pending run.
// A newer call also stops a run already past its wait: an older answer that lands later is dropped.
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
  const parsed = parseSteps(steps, run.elementKey);
  const debounceAt = parsed.findIndex((step) => step.debounce);
  const now = debounceAt === -1 ? parsed : parsed.slice(0, debounceAt);
  const later = debounceAt === -1 ? [] : parsed.slice(debounceAt);

  const runs = newestRuns.get(debouncers) ?? new Map<string, symbol>();
  newestRuns.set(debouncers, runs);
  const token = Symbol(callbackName);
  runs.set(callbackName, token);
  const isNewest = () => runs.get(callbackName) === token;

  if (!(await runWaves(now, run, isNewest))) return;
  if (later.length === 0) return;

  debouncers.get(callbackName)?.cancel();
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      debouncers.delete(callbackName);
      runWaves(later, run, isNewest).then(() => resolve(), reject);
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

// Resolves `false` when the run stopped: a declined `confirm`, or a newer run of the callback.
async function runWaves(
  steps: Step[],
  { payload, scopes, confirm, evaluator, elementKey }: Run,
  isNewest: () => boolean,
): Promise<boolean> {
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
      if (!confirmed || !isNewest()) return false;
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
    if (!isNewest()) return false;
    let firstError: unknown = null;
    settled.forEach((result, i) => {
      if (result.status === "fulfilled") {
        const { write } = evaluated[i];
        if (write) write.scope.$set(write.field, result.value);
      } else if (firstError === null) {
        firstError = result.reason;
      }
    });
    if (firstError !== null) throw firstError;
  }
  return true;
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
