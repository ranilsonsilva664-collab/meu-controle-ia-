import { Transaction, TransactionType, Category } from '../../types';
import { FinanceSummary, SpendingPattern } from './types';

/**
 * Calcula o resumo financeiro do mês atual
 */
export function calculateMonthlySummary(transactions: Transaction[]): FinanceSummary {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filtrar transações do mês atual
    const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Calcular totais
    const incomeMonth = monthTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenseMonth = monthTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const savingsMonth = incomeMonth - expenseMonth;
    const balance = transactions
        .reduce((sum, t) => sum + (t.type === TransactionType.INCOME ? Number(t.amount) : -Number(t.amount)), 0);

    // Calcular por categoria
    const expenseByCategory: Record<string, number> = {};
    const percentByCategory: Record<string, number> = {};

    monthTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .forEach(t => {
            const cat = t.category || Category.OTHERS;
            expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(t.amount);
        });

    // Calcular percentuais
    Object.keys(expenseByCategory).forEach(cat => {
        percentByCategory[cat] = incomeMonth > 0
            ? (expenseByCategory[cat] / incomeMonth) * 100
            : 0;
    });

    // Top 3 categorias
    const topCategories = Object.entries(expenseByCategory)
        .map(([category, amount]) => ({
            category,
            amount,
            percent: percentByCategory[category]
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);

    const transactionCount = monthTransactions.length;
    const averageExpense = transactionCount > 0 ? expenseMonth / transactionCount : 0;

    return {
        incomeMonth,
        expenseMonth,
        savingsMonth,
        balance,
        expenseByCategory,
        percentByCategory,
        transactionCount,
        averageExpense,
        topCategories
    };
}

/**
 * Compara o resumo atual com o mês anterior
 */
export function compareWithPreviousMonth(
    transactions: Transaction[]
): { current: FinanceSummary; previous: FinanceSummary; changes: Record<string, number> } {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const previousTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
    });

    const current = calculateMonthlySummary(transactions);
    const previous = calculateMonthlySummaryForTransactions(previousTransactions);

    const changes = {
        income: current.incomeMonth - previous.incomeMonth,
        expense: current.expenseMonth - previous.expenseMonth,
        savings: current.savingsMonth - previous.savingsMonth
    };

    return { current, previous, changes };
}

function calculateMonthlySummaryForTransactions(transactions: Transaction[]): FinanceSummary {
    const incomeMonth = transactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenseMonth = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const savingsMonth = incomeMonth - expenseMonth;

    const expenseByCategory: Record<string, number> = {};
    const percentByCategory: Record<string, number> = {};

    transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .forEach(t => {
            const cat = t.category || Category.OTHERS;
            expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(t.amount);
        });

    Object.keys(expenseByCategory).forEach(cat => {
        percentByCategory[cat] = incomeMonth > 0
            ? (expenseByCategory[cat] / incomeMonth) * 100
            : 0;
    });

    const topCategories = Object.entries(expenseByCategory)
        .map(([category, amount]) => ({
            category,
            amount,
            percent: percentByCategory[category]
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);

    return {
        incomeMonth,
        expenseMonth,
        savingsMonth,
        balance: 0,
        expenseByCategory,
        percentByCategory,
        transactionCount: transactions.length,
        averageExpense: transactions.length > 0 ? expenseMonth / transactions.length : 0,
        topCategories
    };
}

/**
 * Detecta padrões de gasto problemáticos
 */
export function detectSpendingPatterns(transactions: Transaction[]): SpendingPattern[] {
    const patterns: SpendingPattern[] = [];
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= last7Days);

    // Padrão 1: Gastos consecutivos na mesma categoria
    const categoryDays: Record<string, Set<string>> = {};
    recentTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .forEach(t => {
            const cat = t.category || Category.OTHERS;
            const day = new Date(t.date).toISOString().split('T')[0];
            if (!categoryDays[cat]) categoryDays[cat] = new Set();
            categoryDays[cat].add(day);
        });

    Object.entries(categoryDays).forEach(([category, days]) => {
        if (days.size >= 7) {
            patterns.push({
                type: 'consecutive',
                category: category as Category,
                description: `Gastos diários em ${category} por 7+ dias consecutivos`,
                severity: 'high',
                transactions: recentTransactions.filter(t => t.category === category)
            });
        }
    });

    // Padrão 2: Compras grandes (> 20% da renda mensal)
    const summary = calculateMonthlySummary(transactions);
    const largeThreshold = summary.incomeMonth * 0.2;

    recentTransactions
        .filter(t => t.type === TransactionType.EXPENSE && Number(t.amount) > largeThreshold)
        .forEach(t => {
            patterns.push({
                type: 'large-purchase',
                category: t.category,
                description: `Compra grande: ${t.description} (${((Number(t.amount) / summary.incomeMonth) * 100).toFixed(1)}% da renda)`,
                severity: 'medium',
                transactions: [t]
            });
        });

    // Padrão 3: Alta frequência em restaurantes/delivery
    const restaurantCategories = [Category.RESTAURANTS, Category.DELIVERY];
    const restaurantTransactions = recentTransactions.filter(t =>
        t.type === TransactionType.EXPENSE &&
        restaurantCategories.includes(t.category)
    );

    if (restaurantTransactions.length >= 15) { // 15+ em 7 dias = mais de 2/dia
        patterns.push({
            type: 'high-frequency',
            category: Category.RESTAURANTS,
            description: `${restaurantTransactions.length} transações em restaurantes/delivery em 7 dias`,
            severity: 'high',
            transactions: restaurantTransactions
        });
    }

    // Padrão 4: Gastos noturnos (22h-2h) - possível impulso
    const nightTransactions = recentTransactions.filter(t => {
        const hour = new Date(t.date).getHours();
        return t.type === TransactionType.EXPENSE && (hour >= 22 || hour <= 2);
    });

    if (nightTransactions.length >= 5) {
        patterns.push({
            type: 'impulse',
            description: `${nightTransactions.length} gastos noturnos detectados (possível compra por impulso)`,
            severity: 'medium',
            transactions: nightTransactions
        });
    }

    return patterns;
}

/**
 * Calcula progresso em direção à meta
 */
export function calculateGoalProgress(balance: number, goal: number): {
    percent: number;
    remaining: number;
    stage: 'iniciante' | 'poupador' | 'investidor' | 'mestre';
} {
    const percent = Math.max(0, Math.min((balance / goal) * 100, 100));
    const remaining = Math.max(0, goal - balance);

    let stage: 'iniciante' | 'poupador' | 'investidor' | 'mestre';
    if (percent < 5) stage = 'iniciante';
    else if (percent < 25) stage = 'poupador';
    else if (percent < 75) stage = 'investidor';
    else stage = 'mestre';

    return { percent, remaining, stage };
}
