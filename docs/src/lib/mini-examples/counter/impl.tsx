import { createComponentImplementation } from "@uicast/react";
import { Button } from "@/components/ui/button";
import { CounterDef } from "./def";

export const CounterImpl = createComponentImplementation({
  def: CounterDef,
  render: ({ count, onClick }) => (
    <Button variant="outline" onClick={() => onClick()}>
      Count: {count}
    </Button>
  ),
});
