import { createComponentImplementation } from "@uicast/react";
import { TabsTrigger } from "../../components/ui/tabs";
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
