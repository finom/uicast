import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import { TabsList } from "ui-fired/catalog/components/ui/tabs";
import Skeleton from "react-loading-skeleton";
import { TabListDef } from "./def";

export const TabListRenderer = createAIComponentRenderer({
  def: TabListDef,
  renderer: ({ children, generatedKey }) => {
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
