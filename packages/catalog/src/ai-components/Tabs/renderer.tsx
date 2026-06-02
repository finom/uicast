import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { Tabs as ShadcnTabs } from "@ui-fired/catalog/components/ui/tabs";
import { TabsDef } from "./def";

export const TabsRenderer = createAIComponentRenderer({
  def: TabsDef,
  renderer: ({
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
