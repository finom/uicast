const STEPS = [
  {
    title: "Define components, functions",
    body: "Your design system and your endpoints, each behind a schema: the closed set the model builds from.",
  },
  {
    title: "AI generates",
    body: "Derived values, visibility and events are short JavaScript expressions, checked before they run.",
  },
  {
    title: "Get an app, logic included",
    body: "Elements mount as they arrive. Clicks run callbacks that call your functions and write reactive state.",
  },
];

export function Steps() {
  return (
    <div className="mb-12 grid gap-8 sm:grid-cols-3 sm:gap-6">
      {STEPS.map(({ title, body }, i) => (
        <div key={title}>
          <p className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
          <h3 className="mt-2 text-balance font-semibold text-base">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        </div>
      ))}
    </div>
  );
}
