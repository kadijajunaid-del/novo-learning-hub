"use client";

import { useState } from "react";
import { CdcLogo } from "./logo";

/**
 * Shows the official logo file from /public if present, otherwise falls back
 * to the drawn CdcLogo so nothing looks broken before the asset is added.
 * Drop the artwork at public/cdc-turkiye-logo.png (or .svg) to use it exactly.
 */
export default function BrandLogo({ height = 56 }: { height?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <CdcLogo height={height} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/cdc-turkiye-logo.png"
      alt="CDC Türkiye"
      style={{ height, width: "auto" }}
      onError={() => setFailed(true)}
    />
  );
}
