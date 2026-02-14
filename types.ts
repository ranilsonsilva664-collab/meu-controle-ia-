
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum Category {
  RESTAURANTS = 'Restaurantes',
  DELIVERY = 'Delivery',
  MARKET = 'Mercado',
  PUBLIC_TRANSPORT = 'Transporte Público',
  RIDE_HAILING = 'Apps de Transporte',
  FUEL = 'Combustível',
  LEISURE = 'Lazer',
  INVESTMENT = 'Investimentos',
  HOUSING = 'Moradia',
  EDUCATION = 'Educação',
  HEALTH = 'Saúde',
  SUBSCRIPTIONS = 'Assinaturas',
  SALARY = 'Salário',
  OTHERS = 'Outros'
}

export interface Transaction {
  id: string;
  description: string;
  vendor?: string;
  amount: number;
  date: string;
  category: Category;
  type: TransactionType;
  receipt_url?: string;
}

export interface FinancialStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  progressPercent: number;
}

export interface MentorFeedback {
  stage: 'iniciante' | 'poupador' | 'investidor' | 'mestre';
  message: string;
  challenge: string;
  insights: { title: string; detail: string; impact: 'positive' | 'negative' | 'neutral' }[];
}

export interface Tip {
  title: string;
  content: string;
  severity: 'low' | 'medium' | 'high';
}

export type AppState = 'auth' | 'dashboard' | 'transactions' | 'mentor' | 'goals';
