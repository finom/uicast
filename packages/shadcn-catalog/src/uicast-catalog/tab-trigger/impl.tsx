import { createComponentImplementation } from "@uicast/react";
import { TabsTrigger } from "../../components/ui/tabs";
import { TabTriggerDef } from "./def";

export const TabTriggerImpl = createComponentImplementation({
  def: TabTriggerDef,
  render: ({ value, text, children }, { entry }) => {
    return (
      <TabsTrigger value={value} data-key={entry.key}>
        {children ?? text ?? value}
      </TabsTrigger>
    );
  },
});
