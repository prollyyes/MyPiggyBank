import type { Goal, Entry, Alert, Settings } from './types';

const KEYS = {
  goals:    'mpb.goals',
  entries:  'mpb.entries',
  alerts:   'mpb.alerts',
  settings: 'mpb.settings',
} as const;

export const DEFAULT_SETTINGS: Settings = {
  primaryCurrency: 'EUR',
  managedCurrencies: [],
  theme: 'light',
  colorPalette: 'amalfi',
  onboardingComplete: false,
  name: '',
  monthlyBudget: 0,
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getGoals:     () => load<Goal[]>(KEYS.goals, []),
  saveGoals:    (g: Goal[]) => save(KEYS.goals, g),

  getEntries:   () => load<Entry[]>(KEYS.entries, []),
  saveEntries:  (e: Entry[]) => save(KEYS.entries, e),

  getAlerts:    () => load<Alert[]>(KEYS.alerts, []),
  saveAlerts:   (a: Alert[]) => save(KEYS.alerts, a),

  getSettings:  () => load<Settings>(KEYS.settings, DEFAULT_SETTINGS),
  saveSettings: (s: Settings) => save(KEYS.settings, s),

  clear: () => Object.values(KEYS).forEach(k => localStorage.removeItem(k)),
};
