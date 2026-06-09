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

// ── Convex-lens displacement map using SDF rounded rect math ─────────────────

interface LensConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

function generateLensMap(w: number, h: number, lens: LensConfig, strength: number): string {
  const canvas = document.createElement('canvas');
  canvas.width  = w;
  canvas.height = h;
  const ctx  = canvas.getContext('2d')!;
  const data = ctx.createImageData(w, h);

  const halfW = lens.width / 2;
  const halfH = lens.height / 2;
  const lcx = lens.x + halfW;
  const lcy = lens.y + halfH;
  const r = Math.min(lens.radius, halfW, halfH);
  const maxDist = Math.min(halfW, halfH);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;

      // 1. Coordinates relative to lens center
      const px = x - lcx;
      const py = y - lcy;

      // 2. Signed Distance Field (SDF) of rounded rectangle
      const dx = Math.abs(px) - (halfW - r);
      const dy = Math.abs(py) - (halfH - r);

      let dist;
      if (dx > 0 && dy > 0) {
        dist = Math.sqrt(dx * dx + dy * dy) - r;
      } else {
        dist = Math.max(dx, dy) - r;
      }

      if (dist >= 0) {
        // Outside the lens: neutral 128
        data.data[i]     = 128;
        data.data[i + 1] = 128;
        data.data[i + 2] = 128;
        data.data[i + 3] = 255;
      } else {
        // Inside the lens: refract based on distance from boundary
        const distFromEdge = -dist;
        const t = Math.min(1, distFromEdge / maxDist);

        // Dome slope / refraction amplitude
        const amp = (1 - t) * strength;

        // Normal vector pointing outward
        let nx = 0;
        let ny = 0;
        if (dx > 0 && dy > 0) {
          const len = Math.sqrt(dx * dx + dy * dy);
          nx = (dx / len) * Math.sign(px);
          ny = (dy / len) * Math.sign(py);
        } else if (dx > dy) {
          nx = Math.sign(px);
          ny = 0;
        } else {
          nx = 0;
          ny = Math.sign(py);
        }

        // Displacement vector (points inward to magnify)
        const dispX = -nx * amp;
        const dispY = -ny * amp;

        data.data[i]     = Math.max(0, Math.min(255, Math.round(128 + dispX * 127)));
        data.data[i + 1] = Math.max(0, Math.min(255, Math.round(128 + dispY * 127)));
        data.data[i + 2] = 128;
        data.data[i + 3] = 255;
      }
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
  lens?:             LensConfig; // Optional refraction lens
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
  lens,
}: Props) {
  const uid = useId().replace(/:/g, '');
  const dark = useIsDark();

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [mapUrl, setMapUrl] = useState('');
  const [filterVersion, setFilterVersion] = useState(0);

  // ResizeObserver to track container boundaries
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 4 && height > 4) {
        setSize({ w: Math.round(width), h: Math.round(height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const lx = lens?.x;
  const ly = lens?.y;
  const lw = lens?.width;
  const lh = lens?.height;
  const lr = lens?.radius;

  // Generate displacement map when size, lens, or strength changes
  useEffect(() => {
    if (lx === undefined || ly === undefined || lw === undefined || lh === undefined || lr === undefined) {
      setMapUrl('');
      return;
    }
    if (size.w <= 4 || size.h <= 4) return;

    setMapUrl(generateLensMap(size.w, size.h, {
      x: lx,
      y: ly,
      width: lw,
      height: lh,
      radius: lr,
    }, strength));
  }, [size, lx, ly, lw, lh, lr, strength]);

  // Bypass Safari SVG filter caching by incrementing version on map changes
  useEffect(() => {
    if (mapUrl) {
      setFilterVersion(v => v + 1);
    }
  }, [mapUrl]);

  const filterId = `lg-${uid}-${filterVersion}`;

  const br = `${radius}px`;
  const bd = `blur(${blur}px) saturate(${saturate}%) brightness(${dark ? 88 : 112}%)`;

  // Tinted multi-layer background
  const specular = dark
    ? 'linear-gradient(130deg,rgba(255,255,255,0.10) 0%,rgba(255,255,255,0.04) 30%,transparent 55%)'
    : 'linear-gradient(130deg,rgba(255,255,255,0.44) 0%,rgba(255,255,255,0.16) 28%,transparent 52%,rgba(255,255,255,0.05) 100%)';
  const tint = dark
    ? 'linear-gradient(150deg,rgba(215,200,190,0.10) 0%,transparent 58%)'
    : 'linear-gradient(150deg,rgba(18,52,80,0.13) 0%,transparent 58%)';
  const base = dark ? 'rgba(14,9,5,0.60)' : 'rgba(255,255,255,0.44)';
  const bg = `${specular},${tint},${base}`;

  const rimBorder = dark
    ? '1.5px solid rgba(255,255,255,0.12)'
    : '1.5px solid rgba(255,255,255,0.44)';
  const rimShadow = dark
    ? 'inset 0 1.5px 0 rgba(255,255,255,0.14),inset 0 -1.5px 0 rgba(0,0,0,0.34),inset 1.5px 0 0 rgba(255,255,255,0.07),0 8px 40px rgba(0,0,0,0.52)'
    : 'inset 0 2.5px 0 rgba(255,255,255,0.84),inset 0 -1.5px 0 rgba(0,0,0,0.07),inset 1.5px 0 0 rgba(255,255,255,0.30),0 8px 40px rgba(0,0,0,0.10)';

  const lensFilter = mapUrl ? `url(#${filterId})` : undefined;

  return (
    <>
      {lensFilter && (
        <svg
          width="0" height="0"
          style={{ position: 'absolute', overflow: 'hidden', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <defs>
            <filter id={filterId} x="0%" y="0%" width="100%" height="100%"
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

        {/* Layer 1: background frosted fill + backdrop filter (blur/saturate) ONLY */}
        {/* Separated from displacement map to prevent the Chrome/Safari box outline bug */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: br,
          overflow: 'hidden',
          background: bg,
          backdropFilter: bd,
          WebkitBackdropFilter: bd,
          zIndex: 0,
        }} />

        {/* Layer 2: specular rim outline */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: br,
          border: rimBorder,
          boxShadow: rimShadow,
          pointerEvents: 'none',
          zIndex: 2,
        }} />

        {/* Layer 3: content — refracted by displacement map only when lens is active */}
        <div
          className={contentClassName}
          style={{
            position: 'relative',
            zIndex: 3,
            ...(lensFilter ? {
              filter: lensFilter,
              WebkitFilter: lensFilter,
            } : {}),
          }}
        >
          {children}
        </div>

        {/* Layer 4: specular overlay on the lens itself (optional) */}
        {lens && lx !== undefined && ly !== undefined && lw !== undefined && lh !== undefined && lr !== undefined && (
          <div
            style={{
              position: 'absolute',
              left: lx,
              top: ly,
              width: lw,
              height: lh,
              borderRadius: lr,
              border: rimBorder,
              boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.2), inset 0 -1.5px 0 rgba(0,0,0,0.15)',
              background: dark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.12)',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          />
        )}
      </div>
    </>
  );
}
