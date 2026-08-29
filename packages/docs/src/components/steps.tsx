const STEPS = [
  {
    title: "Define components, functions",
    body: "Your design system and your endpoints, each behind a schema. Together they are the model's menu — a closed set it cannot step outside.",
  },
  {
    title: "AI generates",
    body: "One JSON object per line, streamed. Derived values, visibility and event handling are short JavaScript expressions, checked before they run.",
  },
  {
    title: "Get a stateful app",
    body: "Every line mounts as it lands, against a reactive store. Clicks fire callbacks, callbacks call your functions — a working app, not a static render.",
  },
];

/** The three-step summary under the hero. One column on phones, three from `sm`. */
export function Steps() {
  return (
    <div className="mb-12 grid gap-8 sm:grid-cols-3 sm:gap-6">
      {STEPS.map(({ title, body }, i) => (
        <div key={title}>
          <p className="font-mono text-xs text-muted-foreground">
            {String(i + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-2 text-balance font-semibold text-base">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        </div>
      ))}
    </div>
  );
}
