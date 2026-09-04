import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import { TabsContent } from "../../components/ui/tabs";
import { TabContentDef } from "./def";

export const TabContentImpl = createComponentImplementation({
  def: TabContentDef,
  render: ({ value, children}, { entry }) => {
    return (
      <TabsContent value={value} data-key={entry.key}>
        {children}
      </TabsContent>
    );
  },
  placeholder: ({ children }: PlaceholderComponentProps) => <div className="flex flex-col gap-2">{children}</div>,
});
