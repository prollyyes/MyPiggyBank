'use client';

import { useEffect, useState } from 'react';
import LiquidGlass from './LiquidGlass';

interface Props {
  checked:  boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function LiquidGlassSwitch({ checked, onChange, disabled = false }: Props) {
  const targetX = checked ? 26 : 2;
  const [x, setX] = useState(targetX);

  // Smooth easing animation loop for the lens position
  useEffect(() => {
    let frameId: number;
    const step = () => {
      setX((prev) => {
        const diff = targetX - prev;
        if (Math.abs(diff) < 0.05) {
          return targetX;
        }
        return prev + diff * 0.28; // Snappy ease-out
      });

      if (x !== targetX) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [targetX, x]);

  function handleToggle() {
    if (disabled) return;
    onChange(!checked);
  }

  // Switch size: 50x26
  // Thumb size: 22x22
  const lens = {
    x,
    y: 2,
    width: 22,
    height: 22,
    radius: 999,
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleToggle}
      className={`
        relative w-[50px] h-[26px] rounded-full overflow-hidden
        focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40
        transition-all duration-300 ease-out select-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <LiquidGlass
        radius={999}
        blur={12}
        saturate={150}
        lens={lens}
        className="w-full h-full"
        contentClassName="w-full h-full relative"
      >
        {/* Switch track content (gets refracted by the sliding lens) */}
        <div
          className={`
            w-full h-full transition-colors duration-300 flex items-center justify-between px-2.5
            ${checked
              ? 'bg-gradient-to-r from-burgundy to-amber'
              : 'bg-black/15 dark:bg-white/10'
            }
          `}
        >
          {/* Inactive state indicator (dot) */}
          <div
            className={`
              w-1.5 h-1.5 rounded-full bg-charcoal/30 dark:bg-white/30 transition-opacity duration-200
              ${checked ? 'opacity-0' : 'opacity-100'}
            `}
          />

          {/* Active state indicator (dot) */}
          <div
            className={`
              w-1.5 h-1.5 rounded-full bg-white/80 transition-opacity duration-200
              ${checked ? 'opacity-100' : 'opacity-0'}
            `}
          />
        </div>
      </LiquidGlass>
    </button>
  );
}
