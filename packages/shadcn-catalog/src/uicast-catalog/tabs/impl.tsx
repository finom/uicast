import { createComponentImplementation } from "@uicast/react";
import { Tabs as ShadcnTabs } from "../../components/ui/tabs";
import { StackSkeleton } from "../../lib/skeletons";
import { TabsDef } from "./def";

export const TabsImpl = createComponentImplementation({
  def: TabsDef,
  render: ({ value, children, onChange }, { entry }) => (
    <ShadcnTabs
      value={value}
      onValueChange={(v) => onChange({ value: v })}
      data-key={entry.key}
    >
      {children}
    </ShadcnTabs>
  ),
  skeleton: StackSkeleton,
});
