import { createComponentImplementation } from "@uicast/react";
import { CounterDef } from "./def";

export const CounterImpl = createComponentImplementation({
  def: CounterDef,
  render: ({ count, onClick }) => (
    <button type="button" onClick={() => onClick()}>
      Count: {count}
    </button>
  ),
});
