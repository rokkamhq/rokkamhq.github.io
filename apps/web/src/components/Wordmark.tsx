export function Wordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-2 select-none">
      <span
        className={`font-display font-800 text-2xl leading-none tracking-tight ${
          inverted ? "text-paper" : "text-ink"
        }`}
        style={{ fontWeight: 800 }}
      >
        రొక్కం
      </span>
      <span
        className={`font-display text-lg leading-none tracking-wide uppercase ${
          inverted ? "text-sand" : "text-rokkam"
        }`}
        style={{ fontWeight: 700 }}
      >
        Rokkam
      </span>
    </span>
  );
}
