// The landing's badge: a tinted pill in mono capitals.
export function BetaBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-(--uc-tint) px-[9px] py-[2px] font-(family-name:--x-font-mono) text-[11px] uppercase leading-[1.6] font-normal tracking-[0.08em] text-(--uc-accent-text)">
      beta
    </span>
  );
}
