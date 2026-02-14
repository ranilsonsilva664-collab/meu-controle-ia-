import { Transaction, TransactionType, Category } from '../../types';
import { Mission, FinanceSummary } from './types';

/**
 * Gera missões semanais baseadas no perfil financeiro do usuário
 */
export function generateWeeklyMissions(
    summary: FinanceSummary,
    transactions: Transaction[]
): Mission[] {
    const missions: Mission[] = [];
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Missão 1: Reduzir delivery se alto
    if ((summary.percentByCategory[Category.DELIVERY] || 0) > 10) {
        const currentDelivery = summary.expenseByCategory[Category.DELIVERY] || 0;
        missions.push({
            id: 'reduce-delivery',
            title: '3 Dias Sem Delivery',
            description: 'Fique 3 dias consecutivos sem pedir delivery. Cozinhe em casa!',
            type: 'reduction',
            targetValue: 3,
            currentValue: 0,
            progress: 0,
            status: 'active',
            startDate: now.toISOString(),
            endDate: weekEnd.toISOString(),
            category: Category.DELIVERY
        });
    }

    // Missão 2: Economizar valor fixo
    const savingsGoal = Math.max(50, summary.incomeMonth * 0.05); // 5% da renda ou R$ 50
    missions.push({
        id: 'save-amount',
        title: `Economizar R$ ${savingsGoal.toFixed(0)}`,
        description: `Poupe R$ ${savingsGoal.toFixed(0)} esta semana reduzindo gastos supérfluos.`,
        type: 'savings',
        targetValue: savingsGoal,
        currentValue: 0,
        progress: 0,
        status: 'active',
        startDate: now.toISOString(),
        endDate: weekEnd.toISOString()
    });

    // Missão 3: Revisar assinaturas se alto
    if ((summary.percentByCategory[Category.SUBSCRIPTIONS] || 0) > 8) {
        missions.push({
            id: 'review-subscriptions',
            title: 'Revisar Assinaturas',
            description: 'Cancele pelo menos 2 assinaturas que você não usa regularmente.',
            type: 'review',
            targetValue: 2,
            currentValue: 0,
            progress: 0,
            status: 'active',
            startDate: now.toISOString(),
            endDate: weekEnd.toISOString(),
            category: Category.SUBSCRIPTIONS
        });
    }

    // Missão 4: Registrar todos os gastos
    if (summary.transactionCount < 10) {
        missions.push({
            id: 'track-expenses',
            title: 'Registrar Todos os Gastos',
            description: 'Registre pelo menos 7 transações esta semana. Controle é poder!',
            type: 'tracking',
            targetValue: 7,
            currentValue: 0,
            progress: 0,
            status: 'active',
            startDate: now.toISOString(),
            endDate: weekEnd.toISOString()
        });
    }

    // Missão 5: Reduzir lazer se muito alto
    if ((summary.percentByCategory[Category.LEISURE] || 0) > 25) {
        const targetReduction = (summary.expenseByCategory[Category.LEISURE] || 0) * 0.2; // 20% de redução
        missions.push({
            id: 'reduce-leisure',
            title: 'Reduzir Lazer em 20%',
            description: `Economize R$ ${targetReduction.toFixed(0)} em lazer esta semana.`,
            type: 'reduction',
            targetValue: targetReduction,
            currentValue: 0,
            progress: 0,
            status: 'active',
            startDate: now.toISOString(),
            endDate: weekEnd.toISOString(),
            category: Category.LEISURE
        });
    }

    // Missão 6: Usar transporte público se apps de transporte alto
    if ((summary.percentByCategory[Category.RIDE_HAILING] || 0) > 12) {
        missions.push({
            id: 'public-transport',
            title: '5 Dias de Transporte Público',
            description: 'Use transporte público ou carona por 5 dias esta semana.',
            type: 'reduction',
            targetValue: 5,
            currentValue: 0,
            progress: 0,
            status: 'active',
            startDate: now.toISOString(),
            endDate: weekEnd.toISOString(),
            category: Category.RIDE_HAILING
        });
    }

    // Missão 7: Evitar compras por impulso
    const nightTransactions = transactions.filter(t => {
        const hour = new Date(t.date).getHours();
        return t.type === TransactionType.EXPENSE && (hour >= 22 || hour <= 2);
    });

    if (nightTransactions.length >= 3) {
        missions.push({
            id: 'no-impulse',
            title: 'Zero Compras Noturnas',
            description: 'Evite compras entre 22h e 2h por 7 dias. Regra das 24 horas!',
            type: 'reduction',
            targetValue: 7,
            currentValue: 0,
            progress: 0,
            status: 'active',
            startDate: now.toISOString(),
            endDate: weekEnd.toISOString()
        });
    }

    // Retornar no máximo 4 missões (as mais relevantes)
    return missions.slice(0, 4);
}

/**
 * Calcula o progresso de uma missão baseada nas transações recentes
 */
export function calculateMissionProgress(
    mission: Mission,
    transactions: Transaction[]
): Mission {
    const startDate = new Date(mission.startDate);
    const endDate = new Date(mission.endDate);

    // Filtrar transações do período da missão
    const missionTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= startDate && date <= endDate;
    });

    let currentValue = 0;
    let progress = 0;

    switch (mission.id) {
        case 'reduce-delivery':
            // Contar dias consecutivos sem delivery
            currentValue = countConsecutiveDaysWithout(missionTransactions, Category.DELIVERY);
            progress = Math.min((currentValue / (mission.targetValue || 3)) * 100, 100);
            break;

        case 'save-amount':
            // Calcular economia (renda - gastos no período)
            const income = missionTransactions
                .filter(t => t.type === TransactionType.INCOME)
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const expense = missionTransactions
                .filter(t => t.type === TransactionType.EXPENSE)
                .reduce((sum, t) => sum + Number(t.amount), 0);
            currentValue = income - expense;
            progress = Math.min((currentValue / (mission.targetValue || 50)) * 100, 100);
            break;

        case 'review-subscriptions':
            // Contar cancelamentos (transações negativas em assinaturas ou redução)
            // Simplificado: usuário marca manualmente
            currentValue = mission.currentValue || 0;
            progress = Math.min((currentValue / (mission.targetValue || 2)) * 100, 100);
            break;

        case 'track-expenses':
            // Contar transações registradas
            currentValue = missionTransactions.filter(t => t.type === TransactionType.EXPENSE).length;
            progress = Math.min((currentValue / (mission.targetValue || 7)) * 100, 100);
            break;

        case 'reduce-leisure':
            // Calcular gasto em lazer
            const leisureSpent = missionTransactions
                .filter(t => t.type === TransactionType.EXPENSE && t.category === Category.LEISURE)
                .reduce((sum, t) => sum + Number(t.amount), 0);
            currentValue = leisureSpent;
            // Progresso inverso: quanto menos gastar, melhor
            const targetSpending = (mission.targetValue || 0);
            progress = leisureSpent <= targetSpending ? 100 : Math.max(0, 100 - ((leisureSpent - targetSpending) / targetSpending) * 100);
            break;

        case 'public-transport':
            // Contar dias usando transporte público
            currentValue = countDaysWithCategory(missionTransactions, Category.PUBLIC_TRANSPORT);
            progress = Math.min((currentValue / (mission.targetValue || 5)) * 100, 100);
            break;

        case 'no-impulse':
            // Contar dias sem compras noturnas
            currentValue = countDaysWithoutNightPurchases(missionTransactions);
            progress = Math.min((currentValue / (mission.targetValue || 7)) * 100, 100);
            break;

        default:
            currentValue = mission.currentValue || 0;
            progress = mission.progress;
    }

    // Atualizar status
    let status: 'active' | 'completed' | 'failed' = 'active';
    if (progress >= 100) {
        status = 'completed';
    } else if (new Date() > endDate) {
        status = 'failed';
    }

    return {
        ...mission,
        currentValue,
        progress: Math.round(progress),
        status
    };
}

/**
 * Verifica se uma missão foi completada
 */
export function checkMissionCompletion(mission: Mission): boolean {
    return mission.progress >= 100 || mission.status === 'completed';
}

// Helper functions

function countConsecutiveDaysWithout(transactions: Transaction[], category: Category): number {
    const days = new Set<string>();
    const categoryDays = new Set<string>();

    transactions.forEach(t => {
        const day = new Date(t.date).toISOString().split('T')[0];
        days.add(day);
        if (t.category === category) {
            categoryDays.add(day);
        }
    });

    // Contar dias consecutivos sem a categoria
    const sortedDays = Array.from(days).sort();
    let consecutive = 0;
    let maxConsecutive = 0;

    sortedDays.forEach(day => {
        if (!categoryDays.has(day)) {
            consecutive++;
            maxConsecutive = Math.max(maxConsecutive, consecutive);
        } else {
            consecutive = 0;
        }
    });

    return maxConsecutive;
}

function countDaysWithCategory(transactions: Transaction[], category: Category): number {
    const days = new Set<string>();

    transactions
        .filter(t => t.category === category)
        .forEach(t => {
            const day = new Date(t.date).toISOString().split('T')[0];
            days.add(day);
        });

    return days.size;
}

function countDaysWithoutNightPurchases(transactions: Transaction[]): number {
    const allDays = new Set<string>();
    const nightDays = new Set<string>();

    transactions.forEach(t => {
        const day = new Date(t.date).toISOString().split('T')[0];
        const hour = new Date(t.date).getHours();

        allDays.add(day);

        if (t.type === TransactionType.EXPENSE && (hour >= 22 || hour <= 2)) {
            nightDays.add(day);
        }
    });

    return allDays.size - nightDays.size;
}
