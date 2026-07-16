/** CDC Türkiye brand mark — a mosaic pinwheel of coloured squares. */
export function TopMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <g transform="rotate(45 24 24)">
        <rect x="19.5" y="4" width="9" height="9" fill="#F59E2D" />
        <rect x="30.5" y="9" width="8" height="8" fill="#31B7AF" />
        <rect x="34" y="19.5" width="9" height="9" fill="#2D9CDB" />
        <rect x="30.5" y="30.5" width="8" height="8" fill="#0B2F5E" />
        <rect x="19.5" y="34" width="9" height="9" fill="#E2574C" />
        <rect x="9" y="30.5" width="8" height="8" fill="#F59E2D" />
        <rect x="5" y="19.5" width="9" height="9" fill="#31B7AF" />
        <rect x="9" y="9" width="8" height="8" fill="#0B2F5E" />
        <rect x="19" y="19" width="10" height="10" fill="#2D9CDB" />
      </g>
    </svg>
  );
}

/** Full logo: mark + "CDC Türkiye" wordmark + portal name. */
export function TopLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <TopMark size={36} />
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[15px] font-extrabold tracking-tight">
            <span className="text-brand">CDC</span>{" "}
            <span className="text-primary">Türkiye</span>
          </span>
          <span className="block text-[11px] font-medium text-ink3">TOP Portal</span>
        </span>
      )}
    </span>
  );
}
