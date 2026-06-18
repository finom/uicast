import { createComponentImplementation } from "@ui-fired/react";
import { TabsList } from "../../components/ui/tabs";
import Skeleton from "react-loading-skeleton";
import { TabListDef } from "./def";

export const TabListImpl = createComponentImplementation({
  def: TabListDef,
  render: ({ children, generatedKey }) => {
    return <TabsList data-key={generatedKey}>{children}</TabsList>;
  },
  placeholder: () => (
    <>
      <Skeleton width={60} height={20} />
      <Skeleton width={60} height={20} />
      <Skeleton width={60} height={20} />
    </>
  ),
});
