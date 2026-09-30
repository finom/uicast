// Sized in `em`. The default nudge centres it on the lowercase wordmark; running text passes its own.
export function BetaBadge({ className = "translate-y-[0.09em]" }: { className?: string }) {
  return (
    <span className={`inline-flex align-middle ${className}`}>
      <span className="rounded-full border border-current px-[0.6em] py-[0.18em] text-[max(0.32em,0.5rem)] font-semibold uppercase leading-none tracking-[0.16em] text-muted-foreground">
        beta
      </span>
    </span>
  );
}
