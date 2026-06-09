'use client';

/**
 * LiquidGlass — SVG feDisplacementMap lens refraction.
 *
 * Three layers (all position:absolute):
 *   1. Backdrop+lens  — backdrop-filter (blur/saturate) AND filter:url(#id)
 *                       on the SAME element. The SVG feDisplacementMap distorts
 *                       the blurred-backdrop output. Combining both on one div
 *                       eliminates the transparent-layer box artifact that was
 *                       visible in the 4-layer design.
 *                       overflow:hidden + border-radius clips displaced pixels
 *                       to the correct shape.
 *   2. Specular rim   — border + inset box-shadow only; pointer-events:none.
 *                       Separate from layer 1 so the border is NOT distorted.
 *   3. Content        — children; no filter; z-index above both layers.
 *
 * Browser behaviour:
 *   Chrome / Edge  → backdrop-filter + SVG displacement → real refraction ✓
 *   Safari / iOS   → -webkit-backdrop-filter + -webkit-filter → same ✓
 *   Firefox 103+   → filter: + backdrop-filter on same element works in FF103+;
 *                     graceful fallback if not (just blur, no distortion)
 */

import {
  useEffect, useId, useRef, useState,
  type CSSProperties, type ReactNode,
} from 'react';

// ── Theme auto-detection ──────────────────────────────────────────────────────

function useIsDark(): boolean {
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ── Convex-lens displacement map ──────────────────────────────────────────────

function generateLensMap(w: number, h: number, strength: number): string {
  const canvas = document.createElement('canvas');
  canvas.width  = w;
  canvas.height = h;
  const ctx  = canvas.getContext('2d')!;
  const data = ctx.createImageData(w, h);
  const cx   = w / 2;
  const cy   = h / 2;
  const qw   = Math.ceil(cx);
  const qh   = Math.ceil(cy);
  const quad = new Uint8Array(qw * qh * 2);

  // Compute top-left quadrant only
  for (let y = 0; y < qh; y++) {
    for (let x = 0; x < qw; x++) {
      const nx = x / cx;
      const ny = y / cy;
      const falloff = Math.max(0, 1 - Math.sqrt(nx * nx + ny * ny)) ** 2;
      const amp  = falloff * strength;
      const qi   = (y * qw + x) * 2;
      quad[qi]     = Math.round(128 + (-nx * amp) * 127);
      quad[qi + 1] = Math.round(128 + (-ny * amp) * 127);
    }
  }

  // Mirror into all four quadrants
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const qx = x < cx ? Math.floor(x) : Math.floor(w - 1 - x);
      const qy = y < cy ? Math.floor(y) : Math.floor(h - 1 - y);
      const qi  = (Math.min(qy, qh - 1) * qw + Math.min(qx, qw - 1)) * 2;
      let r = quad[qi];
      let g = quad[qi + 1];
      if (x >= cx) r = 255 - r;
      if (y >= cy) g = 255 - g;
      const i = (y * w + x) * 4;
      data.data[i]     = Math.max(0, Math.min(255, r));
      data.data[i + 1] = Math.max(0, Math.min(255, g));
      data.data[i + 2] = 128;
      data.data[i + 3] = 255;
    }
  }

  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL('image/png');
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  children:          ReactNode;
  className?:        string;
  contentClassName?: string;
  style?:            CSSProperties;
  radius?:           number;
  strength?:         number;
  blur?:             number;
  saturate?:         number;
  scale?:            number;
}

export default function LiquidGlass({
  children,
  className        = '',
  contentClassName = '',
  style,
  radius           = 999,
  strength         = 0.28,
  blur             = 28,
  saturate         = 210,
  scale            = 10,
}: Props) {
  const uid      = useId().replace(/:/g, '');
  const filterId = `lg-${uid}`;
  const dark     = useIsDark();

  const containerRef = useRef<HTMLDivElement>(null);
  const [mapUrl, setMapUrl]   = useState('');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 4 && height > 4) {
        setMapUrl(generateLensMap(
          Math.max(4, Math.round(width  / 2) * 2),
          Math.max(4, Math.round(height / 2) * 2),
          strength
        ));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [strength]);

  const br  = `${radius}px`;
  const bd  = `blur(${blur}px) saturate(${saturate}%) brightness(${dark ? 88 : 112}%)`;

  // Tinted multi-layer background:
  //   specular sweep + complementary tint + base fill
  const specular = dark
    ? 'linear-gradient(130deg,rgba(255,255,255,0.10) 0%,rgba(255,255,255,0.04) 30%,transparent 55%)'
    : 'linear-gradient(130deg,rgba(255,255,255,0.44) 0%,rgba(255,255,255,0.16) 28%,transparent 52%,rgba(255,255,255,0.05) 100%)';
  const tint = dark
    ? 'linear-gradient(150deg,rgba(215,200,190,0.10) 0%,transparent 58%)'
    : 'linear-gradient(150deg,rgba(18,52,80,0.13) 0%,transparent 58%)';
  const base = dark ? 'rgba(14,9,5,0.60)' : 'rgba(255,255,255,0.44)';
  const bg   = `${specular},${tint},${base}`;

  const rimBorder = dark
    ? '1.5px solid rgba(255,255,255,0.12)'
    : '1.5px solid rgba(255,255,255,0.44)';
  const rimShadow = dark
    ? 'inset 0 1.5px 0 rgba(255,255,255,0.14),inset 0 -1.5px 0 rgba(0,0,0,0.34),inset 1.5px 0 0 rgba(255,255,255,0.07),0 8px 40px rgba(0,0,0,0.52)'
    : 'inset 0 2.5px 0 rgba(255,255,255,0.84),inset 0 -1.5px 0 rgba(0,0,0,0.07),inset 1.5px 0 0 rgba(255,255,255,0.30),0 8px 40px rgba(0,0,0,0.10)';

  const lensFilter = mapUrl ? `url(#${filterId})` : undefined;

  return (
    <>
      {mapUrl && (
        <svg
          width="0" height="0"
          style={{ position: 'absolute', overflow: 'hidden', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <defs>
            <filter id={filterId} x="-8%" y="-8%" width="116%" height="116%"
              colorInterpolationFilters="sRGB">
              <feImage href={mapUrl} result="map"
                x="0%" y="0%" width="100%" height="100%" preserveAspectRatio="none" />
              <feDisplacementMap in="SourceGraphic" in2="map"
                scale={scale} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
      )}

      <div ref={containerRef} className={className} style={{ position: 'relative', ...style }}>

        {/* Layer 1: backdrop blur + lens distortion on ONE element (no box artifact) */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: br,
          overflow: 'hidden',           // clips displaced pixels to shape
          background: bg,
          backdropFilter: bd,
          WebkitBackdropFilter: bd,
          ...(lensFilter ? {
            filter: lensFilter,
            WebkitFilter: lensFilter,
          } : {}),
          zIndex: 0,
        }} />

        {/* Layer 2: specular rim — separate so border is never distorted */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: br,
          border: rimBorder,
          boxShadow: rimShadow,
          pointerEvents: 'none',
          zIndex: 2,
        }} />

        {/* Layer 3: content — no filter */}
        <div className={contentClassName} style={{ position: 'relative', zIndex: 3 }}>
          {children}
        </div>
      </div>
    </>
  );
}
