import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import { Tabs as ShadcnTabs } from "../../components/ui/tabs";
import { TabsDef } from "./def";

export const TabsImpl = createComponentImplementation({
  def: TabsDef,
  render: ({ value, children, onChange}, { entry }) => {
    return (
      <ShadcnTabs
        value={value}
        onValueChange={(v) => onChange({ value: v })}
        data-key={entry.key}
      >
        {children}
      </ShadcnTabs>
    );
  },
  placeholder: ({ children }: PlaceholderComponentProps) => <div className="flex flex-col gap-2">{children}</div>,
});
