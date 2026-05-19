'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

interface Props {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
  showThemeToggle?: boolean;
}

export default function PageHeader({ title, back, right, showThemeToggle }: Props) {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 pt-12 pb-3 px-4">
      <div className="glass-strong rounded-full flex items-center justify-between h-12 px-4 shadow-sm">
        {back ? (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm font-medium
              text-charcoal dark:text-neutral-200
              active:scale-[0.92] transition-transform duration-150 select-none"
            aria-label="Go back"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
            <span>Back</span>
          </button>
        ) : (
          <div className="w-16" />
        )}

        <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>

        <div className="w-16 flex justify-end gap-2 items-center">
          {right}
          {showThemeToggle && (
            <button
              onClick={toggle}
              className="w-8 h-8 flex items-center justify-center rounded-full
                active:scale-[0.88] transition-transform duration-150 select-none
                text-charcoal dark:text-neutral-200"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark'
                ? <Sun size={18} strokeWidth={1.75} />
                : <Moon size={18} strokeWidth={1.75} />
              }
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
