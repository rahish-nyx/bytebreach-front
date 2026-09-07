export function AdSlot({ label = "sponsored learning tools" }: { label?: string }) {
  return <div className="flex min-h-[74px] items-center justify-center rounded-2xl border border-dashed border-line bg-white/[.015] text-[10px] uppercase tracking-[.2em] text-muted/60">{label}</div>;
}
