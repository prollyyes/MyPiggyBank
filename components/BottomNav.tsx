'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Plus, Bell, Settings } from 'lucide-react';

const TABS = [
  { href: '/',         Icon: Home,     label: 'Home'     },
  { href: '/charts',   Icon: BarChart2, label: 'Charts'  },
  { href: '/entries/new', Icon: null,  label: ''         }, // FAB
  { href: '/alerts',   Icon: Bell,     label: 'Alerts'   },
  { href: '/settings', Icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="glass-strong flex items-center gap-1 px-3 py-2 rounded-full shadow-2xl shadow-black/20">
        {TABS.map((tab, i) => {
          if (!tab.Icon) {
            return (
              <Link
                key="fab"
                href={tab.href}
                className="
                  -mt-5 mx-1 flex h-14 w-14 items-center justify-center rounded-full
                  bg-burgundy text-white shadow-lg shadow-burgundy/40
                  active:scale-[0.90] transition-all duration-200 ease-out
                  select-none
                "
                aria-label="Add entry"
              >
                <Plus size={24} strokeWidth={2.5} />
              </Link>
            );
          }

          const isActive = tab.href === '/'
            ? path === '/'
            : path.startsWith(tab.href);

          const Icon = tab.Icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex flex-col items-center justify-center gap-0.5
                w-14 h-12 rounded-full text-xs font-medium
                transition-all duration-250 ease-out select-none
                active:scale-[0.90]
                ${isActive
                  ? 'bg-black/8 dark:bg-white/12 text-charcoal dark:text-white'
                  : 'text-warmgray dark:text-neutral-500'
                }
              `}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span className="text-[9px] leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
