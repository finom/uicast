import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { busy, cn } from "../../lib/utils";
import { Sankey, Tooltip, ResponsiveContainer } from "recharts";
import { SankeyChartDef } from "./def";

export const SankeyChartImpl = createComponentImplementation({
  def: SankeyChartDef,
  render: ({ nodes = [], links = [], height}, { entry, loading }) => {
    const sankeyData = { nodes, links };

    return (
      <div className={cn("w-full min-w-0", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
        <ResponsiveContainer width="100%" height={height}>
          <Sankey
            data={sankeyData}
            nodePadding={30}
            nodeWidth={10}
            linkCurvature={0.5}
          >
            <Tooltip />
          </Sankey>
        </ResponsiveContainer>
      </div>
    );
  },
  placeholder: () => <Skeleton className="w-full" style={{ height: 300 }} />,
});
