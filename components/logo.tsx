/* CDC Türkiye brand assets. Colours taken from the official logo. */

const C = {
  teal: "#35B0A7",
  orange: "#F0952A",
  red: "#E2574C",
  navy: "#17375E",
  blue: "#4AA3D5",
  yellow: "#F2C14E",
};

/** The mosaic mark — a loose scatter of tilted coloured squares. */
export function TopMark({ size = 40 }: { size?: number }) {
  // Each tile: [x, y, side, rotationDeg, colour]
  const tiles: [number, number, number, number, string][] = [
    [20, 2, 10, 12, C.teal],
    [32, 6, 8, -8, C.orange],
    [30, 17, 9, 18, C.navy],
    [8, 10, 9, -14, C.blue],
    [19, 14, 9, 6, C.red],
    [10, 22, 8, 20, C.yellow],
    [21, 26, 8, -10, C.teal],
    [32, 27, 7, 14, C.blue],
    [3, 20, 7, 8, C.orange],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 44 40" aria-hidden="true">
      {tiles.map(([x, y, s, r, fill], i) => (
        <rect key={i} x={x} y={y} width={s} height={s} rx={1} fill={fill} transform={`rotate(${r} ${x + s / 2} ${y + s / 2})`} />
      ))}
    </svg>
  );
}

/** Full CDC Türkiye lockup for use on a light/white surface. */
export function CdcLogo({ height = 56 }: { height?: number }) {
  return (
    <span className="flex items-center gap-3" style={{ height }}>
      <span className="leading-none">
        <span className="block text-[2.1em] font-extrabold leading-[0.9] tracking-tight" style={{ color: C.navy, fontSize: height * 0.46 }}>
          CDC
        </span>
        <span className="block font-semibold leading-none" style={{ color: C.blue, fontSize: height * 0.34 }}>
          Türkiye
        </span>
      </span>
      <TopMark size={height * 0.72} />
    </span>
  );
}

/** Compact logo for the sidebar — the official CDC Türkiye logo + portal name.
 *  The PNG lives in /public and is always present, so no fallback is needed. */
export function TopLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex flex-col gap-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/cdc-turkiye-logo.png"
        alt="CDC Türkiye"
        className="h-10 w-auto rounded-md dark:bg-white dark:p-1"
      />
      {!compact && <span className="pl-0.5 text-[10px] font-bold uppercase tracking-wide text-ink3">TOP Portal</span>}
    </span>
  );
}
