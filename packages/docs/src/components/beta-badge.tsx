/**
 * Pre-1.0 tag, worn by both wordmarks — the navbar and the front-page hero.
 * Sized in `em`, so it follows whatever type it sits next to, down to a floor
 * that keeps it readable in the navbar.
 *
 * The outer span carries the nudge: `uicast` is all lowercase, so its optical
 * centre is the x-height band, a touch below where flexbox centres the pill.
 * Nesting keeps that offset in the wordmark's em rather than the pill's own,
 * so it stays right at both sizes.
 */
export function BetaBadge() {
  return (
    <span className="inline-flex translate-y-[0.09em]">
      <span className="rounded-full border border-current px-[0.6em] py-[0.18em] text-[max(0.32em,0.5rem)] font-semibold uppercase leading-none tracking-[0.16em] text-muted-foreground">
        beta
      </span>
    </span>
  );
}
