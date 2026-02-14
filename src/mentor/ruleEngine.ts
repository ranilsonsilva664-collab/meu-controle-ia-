import { Transaction, Category } from '../../types';
import { FinanceSummary, Rule, MentorMessage } from './types';
import { renderTemplate, MessageTemplates } from './templateEngine';
import { detectSpendingPatterns } from './financeCalculator';

/**
 * Todas as regras financeiras do mentor (26 regras)
 */
export const ALL_RULES: Rule[] = [
    // REGRAS DE ALERTA (Déficit/Excesso)
    {
        id: 'deficit-critical',
        name: 'Déficit Crítico',
        description: 'Gasto total maior que a renda',
        condition: (summary) => summary.expenseMonth > summary.incomeMonth && summary.incomeMonth > 0,
        messageTemplate: MessageTemplates.DEFICIT_CRITICAL,
        severity: 'alert',
        priority: 10,
        enabled: true
    },
    {
        id: 'deficit-warning',
        name: 'Atenção ao Limite',
        description: 'Gasto total > 90% da renda',
        condition: (summary) => {
            const percent = summary.incomeMonth > 0 ? (summary.expenseMonth / summary.incomeMonth) * 100 : 0;
            return percent > 90 && percent <= 100;
        },
        messageTemplate: MessageTemplates.DEFICIT_WARNING,
        severity: 'warn',
        priority: 9,
        enabled: true
    },
    {
        id: 'negative-balance',
        name: 'Saldo Negativo',
        description: 'Saldo total negativo',
        condition: (summary) => summary.balance < 0,
        messageTemplate: 'Emergência! Seu saldo está negativo: {balance}. Priorize eliminar dívidas urgentemente.',
        severity: 'alert',
        priority: 10,
        enabled: true
    },

    // REGRAS POR CATEGORIA
    {
        id: 'leisure-high',
        name: 'Lazer Alto',
        description: 'Lazer > 30% da renda',
        condition: (summary) => (summary.percentByCategory[Category.LEISURE] || 0) > 30,
        messageTemplate: MessageTemplates.LEISURE_HIGH,
        severity: 'warn',
        priority: 6,
        enabled: true
    },
    {
        id: 'food-out-high',
        name: 'Alimentação Fora Alta',
        description: 'Restaurantes > 15% da renda',
        condition: (summary) => (summary.percentByCategory[Category.RESTAURANTS] || 0) > 15,
        messageTemplate: MessageTemplates.FOOD_OUT_HIGH,
        severity: 'warn',
        priority: 7,
        enabled: true
    },
    {
        id: 'subscriptions-high',
        name: 'Assinaturas Altas',
        description: 'Assinaturas > 10% da renda',
        condition: (summary) => (summary.percentByCategory[Category.SUBSCRIPTIONS] || 0) > 10,
        messageTemplate: MessageTemplates.SUBSCRIPTIONS_HIGH,
        severity: 'warn',
        priority: 6,
        enabled: true
    },
    {
        id: 'transport-high',
        name: 'Transporte Alto',
        description: 'Transporte > 20% da renda',
        condition: (summary) => {
            const total = (summary.percentByCategory[Category.PUBLIC_TRANSPORT] || 0) +
                (summary.percentByCategory[Category.RIDE_HAILING] || 0) +
                (summary.percentByCategory[Category.FUEL] || 0);
            return total > 20;
        },
        messageTemplate: MessageTemplates.TRANSPORT_HIGH,
        severity: 'warn',
        priority: 6,
        enabled: true
    },
    {
        id: 'delivery-high',
        name: 'Delivery Alto',
        description: 'Delivery > 10% da renda',
        condition: (summary) => (summary.percentByCategory[Category.DELIVERY] || 0) > 10,
        messageTemplate: MessageTemplates.DELIVERY_HIGH,
        severity: 'warn',
        priority: 7,
        enabled: true
    },
    {
        id: 'ride-hailing-high',
        name: 'Apps de Transporte Alto',
        description: 'Apps de transporte > 15% da renda',
        condition: (summary) => (summary.percentByCategory[Category.RIDE_HAILING] || 0) > 15,
        messageTemplate: 'Apps de transporte: {amount} ({percent}). Considere transporte público para economizar.',
        severity: 'warn',
        priority: 6,
        enabled: true
    },

    // REGRAS DE POUPANÇA
    {
        id: 'low-savings',
        name: 'Poupança Baixa',
        description: 'Poupança < 10% da renda',
        condition: (summary) => {
            const savingsPercent = summary.incomeMonth > 0 ? (summary.savingsMonth / summary.incomeMonth) * 100 : 0;
            return savingsPercent < 10 && savingsPercent >= 0;
        },
        messageTemplate: MessageTemplates.LOW_SAVINGS,
        severity: 'warn',
        priority: 7,
        enabled: true
    },
    {
        id: 'no-investments',
        name: 'Sem Investimentos',
        description: 'Nenhum investimento no mês',
        condition: (summary) => (summary.expenseByCategory[Category.INVESTMENT] || 0) === 0,
        messageTemplate: MessageTemplates.NO_INVESTMENTS,
        severity: 'info',
        priority: 5,
        enabled: true
    },
    {
        id: 'excellent-savings',
        name: 'Poupança Excelente',
        description: 'Poupança > 30% da renda',
        condition: (summary) => {
            const savingsPercent = summary.incomeMonth > 0 ? (summary.savingsMonth / summary.incomeMonth) * 100 : 0;
            return savingsPercent > 30;
        },
        messageTemplate: MessageTemplates.EXCELLENT_SAVINGS,
        severity: 'success',
        priority: 8,
        enabled: true
    },

    // REGRAS DE META
    {
        id: 'slow-progress',
        name: 'Progresso Lento',
        description: 'Progresso < 5% em 30 dias',
        condition: (summary, transactions, goal) => {
            // Simplificado: verifica se poupança mensal é < 5% da meta
            const monthlyProgress = (summary.savingsMonth / goal) * 100;
            return monthlyProgress < 5 && monthlyProgress > 0;
        },
        messageTemplate: MessageTemplates.SLOW_PROGRESS,
        severity: 'warn',
        priority: 6,
        enabled: true
    },
    {
        id: 'good-progress',
        name: 'Bom Progresso',
        description: 'Progresso > 10% em 30 dias',
        condition: (summary, transactions, goal) => {
            const monthlyProgress = (summary.savingsMonth / goal) * 100;
            return monthlyProgress > 10;
        },
        messageTemplate: MessageTemplates.GOOD_PROGRESS,
        severity: 'success',
        priority: 7,
        enabled: true
    },
    {
        id: 'milestone-50',
        name: 'Metade da Meta',
        description: '50% da meta atingida',
        condition: (summary, transactions, goal) => {
            const percent = (summary.balance / goal) * 100;
            return percent >= 50 && percent < 55;
        },
        messageTemplate: MessageTemplates.MILESTONE_50,
        severity: 'success',
        priority: 8,
        enabled: true
    },
    {
        id: 'milestone-75',
        name: '75% da Meta',
        description: '75% da meta atingida',
        condition: (summary, transactions, goal) => {
            const percent = (summary.balance / goal) * 100;
            return percent >= 75 && percent < 80;
        },
        messageTemplate: MessageTemplates.MILESTONE_75,
        severity: 'success',
        priority: 9,
        enabled: true
    },
    {
        id: 'milestone-90',
        name: '90% da Meta',
        description: '90% da meta atingida',
        condition: (summary, transactions, goal) => {
            const percent = (summary.balance / goal) * 100;
            return percent >= 90 && percent < 100;
        },
        messageTemplate: MessageTemplates.MILESTONE_90,
        severity: 'success',
        priority: 9,
        enabled: true
    },
    {
        id: 'goal-achieved',
        name: 'Meta Conquistada',
        description: 'Meta 100% atingida',
        condition: (summary, transactions, goal) => summary.balance >= goal,
        messageTemplate: MessageTemplates.GOAL_ACHIEVED,
        severity: 'success',
        priority: 10,
        enabled: true
    },

    // REGRAS EXTRAS
    {
        id: 'no-transactions',
        name: 'Sem Transações',
        description: 'Nenhuma transação em 7 dias',
        condition: (summary, transactions) => {
            const now = new Date();
            const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const recentCount = transactions.filter(t => new Date(t.date) >= last7Days).length;
            return recentCount === 0;
        },
        messageTemplate: MessageTemplates.NO_TRANSACTIONS,
        severity: 'info',
        priority: 4,
        enabled: true
    },
    {
        id: 'uncategorized-high',
        name: 'Muitos "Outros"',
        description: 'Categoria "Outros" > 20%',
        condition: (summary) => (summary.percentByCategory[Category.OTHERS] || 0) > 20,
        messageTemplate: MessageTemplates.UNCATEGORIZED_HIGH,
        severity: 'info',
        priority: 5,
        enabled: true
    },
    {
        id: 'good-balance',
        name: 'Saldo Positivo',
        description: 'Saldo > 0 e crescendo',
        condition: (summary) => summary.balance > 0 && summary.savingsMonth > 0,
        messageTemplate: MessageTemplates.GOOD_BALANCE,
        severity: 'success',
        priority: 6,
        enabled: true
    },
    {
        id: 'consistent-tracking',
        name: 'Controle Consistente',
        description: '10+ transações no mês',
        condition: (summary) => summary.transactionCount >= 10,
        messageTemplate: MessageTemplates.CONSISTENT_TRACKING,
        severity: 'success',
        priority: 5,
        enabled: true
    },

    // REGRAS DE COMPORTAMENTO (baseadas em padrões)
    {
        id: 'consecutive-spending',
        name: 'Gastos Consecutivos',
        description: '7+ dias consecutivos na mesma categoria',
        condition: (summary, transactions) => {
            const patterns = detectSpendingPatterns(transactions);
            return patterns.some(p => p.type === 'consecutive');
        },
        messageTemplate: 'Detectamos um padrão de gastos diários consecutivos. Atenção ao hábito!',
        severity: 'warn',
        priority: 7,
        enabled: true
    },
    {
        id: 'large-purchase',
        name: 'Compra Grande',
        description: 'Gasto único > 20% da renda',
        condition: (summary, transactions) => {
            const patterns = detectSpendingPatterns(transactions);
            return patterns.some(p => p.type === 'large-purchase');
        },
        messageTemplate: 'Grande compra detectada. Avalie o impacto na sua meta de longo prazo.',
        severity: 'warn',
        priority: 7,
        enabled: true
    },
    {
        id: 'high-frequency',
        name: 'Alta Frequência',
        description: '3+ transações/dia em restaurantes',
        condition: (summary, transactions) => {
            const patterns = detectSpendingPatterns(transactions);
            return patterns.some(p => p.type === 'high-frequency');
        },
        messageTemplate: MessageTemplates.HIGH_FREQUENCY,
        severity: 'warn',
        priority: 7,
        enabled: true
    },
    {
        id: 'night-spending',
        name: 'Gastos Noturnos',
        description: 'Gastos frequentes entre 22h-2h',
        condition: (summary, transactions) => {
            const patterns = detectSpendingPatterns(transactions);
            return patterns.some(p => p.type === 'impulse');
        },
        messageTemplate: MessageTemplates.NIGHT_SPENDING,
        severity: 'warn',
        priority: 6,
        enabled: true
    }
];

/**
 * Avalia todas as regras e retorna mensagens do mentor
 */
export function evaluateRules(
    summary: FinanceSummary,
    transactions: Transaction[],
    goal: number,
    enabledRuleIds?: string[]
): MentorMessage[] {
    const messages: MentorMessage[] = [];

    // Filtrar apenas regras habilitadas
    const rulesToEvaluate = enabledRuleIds
        ? ALL_RULES.filter(r => r.enabled && enabledRuleIds.includes(r.id))
        : ALL_RULES.filter(r => r.enabled);

    // Avaliar cada regra
    rulesToEvaluate.forEach(rule => {
        try {
            if (rule.condition(summary, transactions, goal)) {
                // Preparar variáveis para o template
                const vars: Record<string, any> = {
                    balance: summary.balance,
                    incomeAmount: summary.incomeMonth,
                    expenseAmount: summary.expenseMonth,
                    savingsAmount: summary.savingsMonth,
                    savingsPercent: summary.incomeMonth > 0 ? (summary.savingsMonth / summary.incomeMonth) * 100 : 0,
                    expensePercent: summary.incomeMonth > 0 ? (summary.expenseMonth / summary.incomeMonth) * 100 : 0,
                    deficitAmount: summary.expenseMonth - summary.incomeMonth,
                    goal: goal,
                    remaining: Math.max(0, goal - summary.balance),
                    progressPercent: (summary.balance / goal) * 100,
                    count: summary.transactionCount
                };

                // Adicionar dados de categorias se relevante
                if (summary.topCategories.length > 0) {
                    const top = summary.topCategories[0];
                    vars.category = top.category;
                    vars.amount = top.amount;
                    vars.percent = top.percent;
                }

                const body = renderTemplate(rule.messageTemplate, vars);

                messages.push({
                    id: rule.id,
                    title: rule.name,
                    body,
                    severity: rule.severity,
                    icon: getSeverityIcon(rule.severity)
                });
            }
        } catch (error) {
            console.error(`Erro ao avaliar regra ${rule.id}:`, error);
        }
    });

    // Ordenar por prioridade (maior primeiro)
    messages.sort((a, b) => {
        const ruleA = ALL_RULES.find(r => r.id === a.id);
        const ruleB = ALL_RULES.find(r => r.id === b.id);
        return (ruleB?.priority || 0) - (ruleA?.priority || 0);
    });

    // Limitar a 5 mensagens mais importantes
    return messages.slice(0, 5);
}

function getSeverityIcon(severity: string): string {
    switch (severity) {
        case 'alert': return '🚨';
        case 'warn': return '⚠️';
        case 'success': return '✅';
        default: return 'ℹ️';
    }
}

/**
 * Obtém uma regra específica por ID
 */
export function getRuleById(id: string): Rule | undefined {
    return ALL_RULES.find(r => r.id === id);
}

/**
 * Obtém todas as regras agrupadas por categoria
 */
export function getRulesByCategory(): Record<string, Rule[]> {
    return {
        'Alertas': ALL_RULES.filter(r => r.id.includes('deficit') || r.id.includes('negative')),
        'Categorias': ALL_RULES.filter(r => r.id.includes('high') && !r.id.includes('frequency')),
        'Poupança': ALL_RULES.filter(r => r.id.includes('savings') || r.id.includes('investment')),
        'Meta': ALL_RULES.filter(r => r.id.includes('progress') || r.id.includes('milestone') || r.id.includes('goal')),
        'Comportamento': ALL_RULES.filter(r => r.id.includes('spending') || r.id.includes('purchase') || r.id.includes('frequency') || r.id.includes('night')),
        'Outros': ALL_RULES.filter(r => r.id.includes('transactions') || r.id.includes('uncategorized') || r.id.includes('balance') || r.id.includes('tracking'))
    };
}
