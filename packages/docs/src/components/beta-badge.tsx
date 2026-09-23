// Sized in `em`; the outer span nudges it down to the lowercase wordmark's optical centre.
export function BetaBadge() {
  return (
    <span className="inline-flex translate-y-[0.09em]">
      <span className="rounded-full border border-current px-[0.6em] py-[0.18em] text-[max(0.32em,0.5rem)] font-semibold uppercase leading-none tracking-[0.16em] text-muted-foreground">
        beta
      </span>
    </span>
  );
}
