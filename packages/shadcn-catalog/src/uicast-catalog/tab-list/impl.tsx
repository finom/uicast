import { createComponentImplementation } from "@uicast/react";
import { TabsList } from "../../components/ui/tabs";
import { Skeleton } from "../../components/ui/skeleton";
import { TabListDef } from "./def";

export const TabListImpl = createComponentImplementation({
  def: TabListDef,
  render: ({ children }, { entry }) => {
    return <TabsList data-key={entry.key}>{children}</TabsList>;
  },
  skeleton: () => (
    <>
      <Skeleton style={{ width: 60, height: 20 }} />
      <Skeleton style={{ width: 60, height: 20 }} />
      <Skeleton style={{ width: 60, height: 20 }} />
    </>
  ),
});
