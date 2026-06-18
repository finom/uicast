import { createComponentImplementation } from "@ui-fired/react";
import { Tabs as ShadcnTabs } from "../../components/ui/tabs";
import { TabsDef } from "./def";

export const TabsImpl = createComponentImplementation({
  def: TabsDef,
  render: ({
    value,
    defaultValue,
    children,
    onValueChange,
    generatedKey,
  }) => {
    return (
      <ShadcnTabs
        value={value}
        defaultValue={defaultValue}
        onValueChange={(v) => onValueChange?.({ value: v })}
        data-key={generatedKey}
      >
        {children}
      </ShadcnTabs>
    );
  },
});
