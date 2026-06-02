import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { GaugeChartDef } from "./def";

export const GaugeChartRenderer = createAIComponentRenderer({
  def: GaugeChartDef,
  renderer: ({
    value,
    min = 0,
    max = 100,
    label,
    color = "#8884d8",
    height = 200,
    generatedKey,
  }) => {
    const range = max - min;
    const percentage = Math.min(Math.max((value - min) / range, 0), 1);
    const angle = percentage * 180;
    const radius = 80;
    const strokeWidth = 20;
    const cx = 100;
    const cy = 100;

    // SVG arc path for the gauge background (semicircle)
    const bgPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

    // Calculate the end point based on the angle
    const endAngle = Math.PI - (angle * Math.PI) / 180;
    const endX = cx + radius * Math.cos(endAngle);
    const endY = cy - radius * Math.sin(endAngle);
    const largeArc = angle > 180 ? 1 : 0;
    const valuePath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;

    return (
      <div className="flex flex-col items-center" data-key={generatedKey}>
        <svg width="200" height={height} viewBox="0 0 200 120">
          {/* Background arc */}
          <path
            d={bgPath}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d={valuePath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Center value text */}
          <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            className="text-2xl font-bold"
            fill="currentColor"
            fontSize="24"
          >
            {value}
          </text>
          {label && (
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              fill="currentColor"
              fontSize="12"
              opacity={0.6}
            >
              {label}
            </text>
          )}
        </svg>
      </div>
    );
  },
});
