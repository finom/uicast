import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { RelativeTimeDef } from "./def";

function getRelativeTime(dateStr: string, suffix: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return `just now`;
  if (diffMin < 60)
    return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ${suffix}`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ${suffix}`;
  if (diffDay < 30)
    return `${diffDay} day${diffDay !== 1 ? "s" : ""} ${suffix}`;
  if (diffMonth < 12)
    return `${diffMonth} month${diffMonth !== 1 ? "s" : ""} ${suffix}`;
  return `${diffYear} year${diffYear !== 1 ? "s" : ""} ${suffix}`;
}

export const RelativeTimeRenderer = createAIComponentRenderer({
  def: RelativeTimeDef,
  renderer: ({ date, prefix, suffix = "ago", generatedKey }) => {
    const relativeStr = getRelativeTime(date, suffix);
    const dateObj = new Date(date);

    return (
      <time
        dateTime={dateObj.toISOString()}
        title={dateObj.toLocaleString()}
        className="text-sm text-muted-foreground"
        data-key={generatedKey}
      >
        {prefix && `${prefix} `}
        {relativeStr}
      </time>
    );
  },
});
