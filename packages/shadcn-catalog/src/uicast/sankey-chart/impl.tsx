import { createComponentImplementation } from "@uicast/react";
import { Sankey, Tooltip, ResponsiveContainer } from "recharts";
import { SankeyChartDef } from "./def";

export const SankeyChartImpl = createComponentImplementation({
  def: SankeyChartDef,
  render: ({ nodes = [], links = [], height, generatedKey }) => {
    const sankeyData = { nodes, links };

    return (
      <div className="w-full min-w-0" data-key={generatedKey}>
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
});
