export enum Category {
  SURVIVAL = 'Sobrevivência 🏠',
  LEISURE = 'Lazer e Vícios ☕',
  CULTURE = 'Cultura e Estudo 📚',
  EXTRAS = 'Extras 🛠️',
  UNCATEGORIZED = 'Não categorizado ❓'
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: Category;
  date: Date;
  isExpense: boolean;
}

export interface DiagnosisState {
  isOpen: boolean;
  message: string;
  advice: string;
}

export interface ReportState {
  isOpen: boolean;
  content: string;
  isLoading: boolean;
}

export interface SavingsLog {
  id: string;
  amount: number;
  description: string;
  date: Date;
}