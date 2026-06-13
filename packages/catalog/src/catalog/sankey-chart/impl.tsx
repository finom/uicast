import { createComponentImplementation } from "@ui-fired/react";
import { Sankey, Tooltip, ResponsiveContainer } from "recharts";
import { SankeyChartDef } from "./def";

export const SankeyChartImpl = createComponentImplementation({
  def: SankeyChartDef,
  render: ({ nodes = [], links = [], height = 400, generatedKey }) => {
    const sankeyData = { nodes, links };

    return (
      <ResponsiveContainer width="100%" height={height} data-key={generatedKey}>
        <Sankey
          data={sankeyData}
          nodePadding={30}
          nodeWidth={10}
          linkCurvature={0.5}
        >
          <Tooltip />
        </Sankey>
      </ResponsiveContainer>
    );
  },
});
