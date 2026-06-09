'use client';

import {
  useEffect, useState,
  type CSSProperties, type ReactNode,
} from 'react';

function useIsDark(): boolean {
  const [dark, setDark] = useState(false);
  
  useEffect(() => {
    // Run only on client to prevent hydration mismatch
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
    
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  
  return dark;
}

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
  lens?:             { x: number; y: number; width: number; height: number; radius: number };
}

export default function LiquidGlass({
  children,
  className        = '',
  contentClassName = '',
  style,
  radius           = 999,
  blur             = 32,
  saturate         = 200,
  lens,
}: Props) {
  const dark = useIsDark();
  const br = `${radius}px`;

  // True Liquid Glass relies on pristine compositing of blur, saturation, 
  // precise specular borders, inner depth shadows, and organic noise.
  // This approach is hardware-accelerated, bug-free on Safari/Samsung, and perfectly mimics Apple's VisionOS glass.

  const bd = `blur(${blur}px) saturate(${saturate}%)`;

  // The base glass body
  const bg = dark
    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.70) 0%, rgba(255, 255, 255, 0.35) 100%)';

  // The outer rim creates the physical boundary
  const border = dark
    ? '1px solid rgba(255, 255, 255, 0.12)'
    : '1px solid rgba(255, 255, 255, 0.4)';

  // Complex inset shadows simulate glass thickness and light bouncing inside the material
  const innerShadow = dark
    ? 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 1px rgba(0, 0, 0, 0.3), inset 1px 0 0 rgba(255, 255, 255, 0.05)'
    : 'inset 0 1.5px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 1px rgba(0, 0, 0, 0.05), inset 1px 0 0 rgba(255, 255, 255, 0.5)';

  // Static SVG noise adds the micro-texture needed to make digital blur feel like physical glass
  // Base64 encoded fractal noise
  const noiseUrl = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E\")";

  return (
    <div 
      className={className} 
      style={{ 
        position: 'relative', 
        borderRadius: br, 
        // -webkit-mask-image forces WebKit to clip children cleanly to the border radius
        // without triggering the rectangular bounding box artifact of overflow:hidden + backdrop-filter
        WebkitMaskImage: '-webkit-radial-gradient(white, black)',
        ...style 
      }}
    >
      {/* Layer 1: The optical frosted base */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: br,
        background: bg,
        backdropFilter: bd,
        WebkitBackdropFilter: bd,
        border: border,
        boxShadow: innerShadow,
        // translateZ(0) forces hardware acceleration layer, fixing mobile browser artifacting
        transform: 'translateZ(0)',
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        {/* Layer 2: The physical material grain (Noise) */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: noiseUrl,
          opacity: dark ? 0.06 : 0.04,
          mixBlendMode: dark ? 'screen' : 'overlay',
          borderRadius: 'inherit',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Layer 3: Content */}
      <div className={contentClassName} style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>

      {/* Layer 4: Optional moving lens highlight (for switches) */}
      {lens && (
        <div
          style={{
            position: 'absolute',
            left: lens.x,
            top: lens.y,
            width: lens.width,
            height: lens.height,
            borderRadius: lens.radius,
            border: border,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.4)',
            background: dark 
              ? 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 100%)',
            pointerEvents: 'none',
            zIndex: 4,
            transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1), top 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}
    </div>
  );
}
