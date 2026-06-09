'use client';

/**
 * LiquidGlass — SVG feDisplacementMap refraction, Aave-style.
 *
 * Three-layer architecture:
 *   A. Backdrop blur layer   — backdrop-filter only (blur + saturate). Captures
 *      and blurs the content behind the element. No filter: here because
 *      Firefox does not support filter: + backdrop-filter on the same element.
 *   B. Displacement layer    — filter: url(#id) only, transparent background.
 *      Sits on top of A and distorts A's blurred output via feDisplacementMap.
 *      Because it has no background, it distorts whatever is under it (A).
 *   C. Tint + specular layer — the tinted gradient fill + inset rim highlights.
 *      Pointer-events none.
 *   D. Content layer         — children, z-index above all layers, no filter.
 *
 * Displacement map:
 *   Convex-lens PNG generated on canvas after mount. Red channel = Δx,
 *   green channel = Δy (128 neutral; four-fold symmetry for speed).
 *   A ResizeObserver regenerates it if the element is resized.
 *
 * Browser coverage:
 *   Chrome/Edge  — backdrop-filter ✓, SVG filter ✓ → full effect
 *   Safari/iOS   — -webkit-backdrop-filter ✓, -webkit-filter ✓ → full effect
 *   Firefox 103+ — backdrop-filter ✓, SVG filter ✓, split-layer fix → full effect
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

// ── Displacement map generator ────────────────────────────────────────────────

function generateLensMap(w: number, h: number, strength: number): string {
  const canvas = document.createElement('canvas');
  canvas.width  = w;
  canvas.height = h;
  const ctx  = canvas.getContext('2d')!;
  const data = ctx.createImageData(w, h);
  const cx   = w / 2;
  const cy   = h / 2;

  // Compute only the top-left quadrant, then mirror × 4 (Aave optimisation)
  const qw = Math.ceil(cx);
  const qh = Math.ceil(cy);
  const quad = new Uint8Array(qw * qh * 2); // [r, g] per pixel

  for (let y = 0; y < qh; y++) {
    for (let x = 0; x < qw; x++) {
      const nx = x / cx;         // 0 → 1
      const ny = y / cy;         // 0 → 1
      // Convex lens: strong displacement at the edge, zero at the centre.
      // Uses a squared falloff so the lens "rim" is the most distorted region.
      const falloff = Math.max(0, 1 - Math.sqrt(nx * nx + ny * ny)) ** 2;
      const amp  = falloff * strength;
      // Displacement inward toward centre → magnifying-glass barrel effect
      const dx   = -nx * amp;
      const dy   = -ny * amp;
      const qi   = (y * qw + x) * 2;
      quad[qi]     = Math.round(128 + dx * 127);
      quad[qi + 1] = Math.round(128 + dy * 127);
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const qx = x < cx ? Math.floor(x)     : Math.floor(w - 1 - x);
      const qy = y < cy ? Math.floor(y)     : Math.floor(h - 1 - y);
      const qi = (Math.min(qy, qh - 1) * qw + Math.min(qx, qw - 1)) * 2;
      let r = quad[qi];
      let g = quad[qi + 1];
      // Mirror: flip the sign of displacement across each axis
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
  children:         ReactNode;
  /** Classes on the outer container (sizing, display, cursor, etc.) */
  className?:       string;
  /** Classes on the inner content wrapper (flex layout, padding, gap) */
  contentClassName?: string;
  style?:           CSSProperties;
  /** Border-radius in px — 999 = pill (default) */
  radius?:          number;
  /** Lens strength, 0–1. Default 0.30 */
  strength?:        number;
  /** Backdrop blur in px. Default 28 */
  blur?:            number;
  /** backdrop-filter saturate %. Default 210 */
  saturate?:        number;
  /** SVG feDisplacementMap scale. Higher = stronger warp. Default 10 */
  scale?:           number;
}

export default function LiquidGlass({
  children,
  className       = '',
  contentClassName = '',
  style,
  radius          = 999,
  strength        = 0.30,
  blur            = 28,
  saturate        = 210,
  scale           = 10,
}: Props) {
  const uid      = useId().replace(/:/g, '');
  const filterId = `lg-${uid}`;
  const dark     = useIsDark();

  const containerRef = useRef<HTMLDivElement>(null);
  const [mapUrl, setMapUrl] = useState('');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 4 && height > 4) {
        const w = Math.max(4, Math.round(width  / 2) * 2);
        const h = Math.max(4, Math.round(height / 2) * 2);
        setMapUrl(generateLensMap(w, h, strength));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [strength]);

  const br = `${radius}px`;

  // ── Colour tokens ──
  const bd = dark
    ? `blur(${blur}px) saturate(${saturate}%) brightness(88%)`
    : `blur(${blur}px) saturate(${saturate}%) brightness(112%)`;

  // Tinted gradient: light = deep blue-slate (complementary of copper, hue ~205°)
  //                  dark  = warm cream-gray
  const tintGrad = dark
    ? 'linear-gradient(150deg, rgba(215,200,190,0.10) 0%, transparent 58%)'
    : 'linear-gradient(150deg, rgba(18,52,80,0.13) 0%, transparent 58%)';

  const specularGrad = dark
    ? 'linear-gradient(130deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 30%, transparent 55%)'
    : 'linear-gradient(130deg, rgba(255,255,255,0.44) 0%, rgba(255,255,255,0.16) 28%, transparent 52%, rgba(255,255,255,0.05) 100%)';

  const baseFill = dark ? 'rgba(14,9,5,0.60)' : 'rgba(255,255,255,0.44)';

  const rimBorder = dark
    ? '1.5px solid rgba(255,255,255,0.12)'
    : '1.5px solid rgba(255,255,255,0.44)';

  const rimShadow = dark
    ? [
        'inset 0 1.5px 0 rgba(255,255,255,0.14)',
        'inset 0 -1.5px 0 rgba(0,0,0,0.34)',
        'inset 1.5px 0 0 rgba(255,255,255,0.07)',
        '0 8px 40px rgba(0,0,0,0.52)',
      ].join(', ')
    : [
        'inset 0 2.5px 0 rgba(255,255,255,0.84)',
        'inset 0 -1.5px 0 rgba(0,0,0,0.07)',
        'inset 1.5px 0 0 rgba(255,255,255,0.30)',
        '0 8px 40px rgba(0,0,0,0.10)',
      ].join(', ');

  // Shared layer styles
  const layerBase: CSSProperties = {
    position:     'absolute',
    inset:        0,
    borderRadius: br,
    overflow:     'hidden',
  };

  return (
    <>
      {/* SVG filter — zero-size, out of layout flow */}
      {mapUrl && (
        <svg
          width="0" height="0"
          style={{ position: 'absolute', overflow: 'hidden', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <defs>
            <filter
              id={filterId}
              x="-8%" y="-8%" width="116%" height="116%"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                href={mapUrl}
                result="map"
                x="0%" y="0%" width="100%" height="100%"
                preserveAspectRatio="none"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={scale}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}

      {/* Outer container — sized by content */}
      <div
        ref={containerRef}
        className={className}
        style={{ position: 'relative', ...style }}
      >
        {/* ── A: Backdrop blur (no filter: — Firefox compat) ── */}
        <div
          style={{
            ...layerBase,
            backdropFilter:         bd,
            WebkitBackdropFilter:   bd,
            background:             'transparent',
            zIndex:                 0,
          }}
        />

        {/* ── B: Displacement lens (filter: only, no backdrop-filter) ── */}
        {mapUrl && (
          <div
            style={{
              ...layerBase,
              background:   'transparent',
              filter:        `url(#${filterId})`,
              WebkitFilter:  `url(#${filterId})`,
              zIndex:        1,
            }}
          />
        )}

        {/* ── C: Tint fill + specular (colours + rim shadow) ── */}
        <div
          style={{
            ...layerBase,
            background:  `${specularGrad}, ${tintGrad}, ${baseFill}`,
            border:      rimBorder,
            boxShadow:   rimShadow,
            pointerEvents: 'none',
            zIndex:      2,
          }}
        />

        {/* ── D: Content — no filter, always on top ── */}
        <div
          className={contentClassName}
          style={{ position: 'relative', zIndex: 3 }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
