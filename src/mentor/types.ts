import { Transaction, Category } from '../../types';

// Resumo financeiro mensal
export interface FinanceSummary {
    incomeMonth: number;
    expenseMonth: number;
    savingsMonth: number;
    balance: number;
    expenseByCategory: Record<string, number>;
    percentByCategory: Record<string, number>;
    transactionCount: number;
    averageExpense: number;
    topCategories: Array<{ category: string; amount: number; percent: number }>;
}

// Mensagem do mentor
export interface MentorMessage {
    id: string;
    title: string;
    body: string;
    severity: 'info' | 'warn' | 'alert' | 'success';
    actionLabel?: string;
    actionRoute?: string;
    icon?: string;
}

// Missão semanal
export interface Mission {
    id: string;
    title: string;
    description: string;
    type: 'savings' | 'reduction' | 'tracking' | 'review';
    targetValue?: number;
    currentValue?: number;
    progress: number; // 0-100
    status: 'active' | 'completed' | 'failed';
    startDate: string;
    endDate: string;
    category?: Category;
}

// Categoria com limite
export interface BudgetCategory {
    category: Category;
    monthlyLimit?: number;
    percentLimit?: number; // % da renda
}

// Regra financeira
export interface Rule {
    id: string;
    name: string;
    description: string;
    condition: (summary: FinanceSummary, transactions: Transaction[], goal: number) => boolean;
    messageTemplate: string;
    severity: 'info' | 'warn' | 'alert' | 'success';
    priority: number; // 1-10, maior = mais importante
    enabled: boolean;
}

// Configuração do mentor
export interface MentorConfig {
    budgetLimits: BudgetCategory[];
    savingsGoalPercent: number; // % da renda para poupar
    enabledRuleIds: string[];
    notificationsEnabled: boolean;
}

// Padrão de gasto detectado
export interface SpendingPattern {
    type: 'consecutive' | 'impulse' | 'large-purchase' | 'high-frequency';
    category?: Category;
    description: string;
    severity: 'low' | 'medium' | 'high';
    transactions: Transaction[];
}
