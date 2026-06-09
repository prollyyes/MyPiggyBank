export type GoalPriority = 'high' | 'medium' | 'low';
export type EntryType = 'expense' | 'income' | 'savings';
export type AlertType = 'pace' | 'deadline' | 'milestone';
export type Theme = 'light' | 'dark';
export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'PLN' | 'CHF';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: CurrencyCode;
  deadline: string; // ISO date string YYYY-MM-DD
  priority: GoalPriority;
  color: string;   // hex, e.g. "#70001C"
  emoji: string;
  createdAt: string;
}

export interface Entry {
  id: string;
  type: EntryType;
  amount: number;
  currency: CurrencyCode;
  category: string;
  goalId?: string;
  note?: string;
  date: string; // YYYY-MM-DD
}

export interface Alert {
  id: string;
  goalId: string;
  type: AlertType;
  message: string;
  createdAt: string;
  dismissed: boolean;
}

export interface Settings {
  primaryCurrency: CurrencyCode;
  managedCurrencies: CurrencyCode[];
  theme: Theme;
  colorPalette: 'amalfi' | 'santorini' | 'tuscany';
  onboardingComplete: boolean;
  name: string;
  monthlyBudget: number;
}
