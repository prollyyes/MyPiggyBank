export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

export function pct(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const CATEGORIES = [
  { id: 'food',       label: 'Food',       emoji: '🍕' },
  { id: 'transport',  label: 'Transport',  emoji: '🚇' },
  { id: 'housing',    label: 'Housing',    emoji: '🏠' },
  { id: 'health',     label: 'Health',     emoji: '💊' },
  { id: 'shopping',   label: 'Shopping',   emoji: '🛍️' },
  { id: 'travel',     label: 'Travel',     emoji: '✈️' },
  { id: 'savings',    label: 'Savings',    emoji: '🐷' },
  { id: 'other',      label: 'Other',      emoji: '📦' },
];

export const GOAL_COLORS = [
  '#CC5C44', // terra
  '#A46726', // amber
  '#54709C', // sapphire
  '#8A4826', // copper
  '#B87A5A', // warm blush-copper
  '#3A5880', // deep sapphire
  '#7A5238', // dark copper
  '#6B8EAA', // pale sapphire
];

export const GOAL_EMOJIS = ['🐷','🏖️','🚗','🏠','💍','🎓','✈️','💻','🎸','⚽','📚','🌍'];
