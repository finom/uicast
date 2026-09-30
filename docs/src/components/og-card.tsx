// The social card, 1280×640, in `next/og`'s subset of CSS: the lockup, one line of text and a footer over a faint grid.
// A page in a sidebar section reads "Section / Page".
export function OgCard({
  lockup,
  section,
  text,
  footer,
}: {
  lockup: string;
  section?: string;
  text: string;
  footer: string;
}) {
  return (
    <div
      style={{
        width: 1280,
        height: 640,
        display: "flex",
        position: "relative",
        backgroundColor: "#0c0c0d",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        fontFamily: "Geist",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 0,
          height: 640,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 36,
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: next/og draws plain elements only. */}
        <img src={lockup} alt="uicast" width={487} height={96} />
        <div
          style={{ display: "flex", flexWrap: "wrap", maxWidth: 700, fontSize: 34, lineHeight: 1.4, color: "#a1a1aa" }}
        >
          {section && <span style={{ color: "#6b6b73" }}>{section}</span>}
          {section && <span style={{ padding: "0 18px", color: "#9d8cff" }}>/</span>}
          <span style={{ maxWidth: 620 }}>{text}</span>
        </div>
      </div>
      <svg
        width={600}
        height={600}
        viewBox="0 0 24 24"
        fill="#f4f4f2"
        style={{ position: "absolute", right: -60, top: 20, opacity: 0.07 }}
      >
        <title>uicast</title>
        {[
          [3, 3],
          [16, 3],
          [3, 9.5],
          [16, 9.5],
          [3, 16],
          [9.5, 16],
          [16, 16],
        ].map(([x, y]) => (
          <rect key={`${x}:${y}`} x={x} y={y} width={5} height={5} rx={1.25} />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 96,
          bottom: 48,
          fontFamily: "Geist Mono",
          fontWeight: 500,
          fontSize: 22,
          color: "#6b6b73",
        }}
      >
        {footer}
      </div>
    </div>
  );
}
