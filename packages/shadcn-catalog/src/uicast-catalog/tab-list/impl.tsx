import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { TabsList } from "../../components/ui/tabs";
import { TabListDef } from "./def";

export const TabListImpl = createComponentImplementation({
  def: TabListDef,
  render: ({ children }, { entry }) => <TabsList data-key={entry.key}>{children}</TabsList>,
  skeleton: () => (
    <>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} style={{ width: 60, height: 20 }} />
      ))}
    </>
  ),
});
