import { createComponentImplementation } from "@ui-fired/react";
import { TabsTrigger } from "@ui-fired/catalog/components/ui/tabs";
import { TabTriggerDef } from "./def";

export const TabTriggerImpl = createComponentImplementation({
  def: TabTriggerDef,
  render: ({ value, children, generatedKey }) => {
    return (
      <TabsTrigger value={value} data-key={generatedKey}>
        {String(children ?? value)}
      </TabsTrigger>
    );
  },
});
