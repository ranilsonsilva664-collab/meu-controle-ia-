/**
 * API Principal do Mentor Offline
 * Substitui completamente o geminiService.ts
 */

import { Transaction } from '../../types';
import { MentorMessage, Mission, FinanceSummary } from './types';
import { calculateMonthlySummary, calculateGoalProgress } from './financeCalculator';
import { evaluateRules } from './ruleEngine';
import { generateWeeklyMissions, calculateMissionProgress } from './missionGenerator';
import { loadMissions, saveMissions, loadEnabledRules, cleanupOldMissions } from './storage';
import { FAQResponses } from './templateEngine';

/**
 * Obtém feedback do mentor baseado nas transações
 * Substitui: getMentorMentorship()
 */
export function getMentorFeedback(
    transactions: Transaction[],
    balance: number,
    userName: string,
    goal: number = 100000
): {
    stage: 'iniciante' | 'poupador' | 'investidor' | 'mestre';
    message: string;
    challenge: string;
    insights: MentorMessage[];
} {
    // Calcular resumo financeiro
    const summary: FinanceSummary = {
        ...calculateMonthlySummary(transactions),
        balance
    };

    // Calcular progresso
    const { stage } = calculateGoalProgress(balance, goal);

    // Avaliar regras
    const enabledRules = loadEnabledRules();
    const insights = evaluateRules(summary, transactions, goal, enabledRules || undefined);

    // Mensagem principal baseada no estágio
    const messages = {
        iniciante: `Olá, ${userName}! Você está no início da jornada. Foco total em construir disciplina e registrar todos os gastos.`,
        poupador: `${userName}, você está progredindo! Continue poupando consistentemente e evite gastos desnecessários.`,
        investidor: `Excelente trabalho, ${userName}! Você está no caminho certo. Agora é hora de otimizar e acelerar.`,
        mestre: `🏆 ${userName}, você é um mestre! Sua disciplina financeira é exemplar. Continue assim!`
    };

    // Desafio baseado no estágio e insights
    const challenges = {
        iniciante: 'Registre todos os seus gastos por 7 dias consecutivos.',
        poupador: 'Economize 15% da sua renda este mês.',
        investidor: 'Reduza seus gastos em 10% sem perder qualidade de vida.',
        mestre: 'Ajude alguém a começar sua jornada financeira!'
    };

    return {
        stage,
        message: messages[stage],
        challenge: challenges[stage],
        insights
    };
}

/**
 * Obtém dicas financeiras baseadas no perfil
 * Substitui: generateFinancialTips()
 */
export function getFinancialTips(
    transactions: Transaction[],
    balance: number,
    goal: number = 100000
): Array<{ title: string; content: string; severity: 'low' | 'medium' | 'high' }> {
    const summary: FinanceSummary = {
        ...calculateMonthlySummary(transactions),
        balance
    };

    const tips: Array<{ title: string; content: string; severity: 'low' | 'medium' | 'high' }> = [];

    // Dica 1: Baseada na categoria de maior gasto
    if (summary.topCategories.length > 0) {
        const top = summary.topCategories[0];
        if (top.percent > 20) {
            tips.push({
                title: `Reduza ${top.category}`,
                content: `Você gastou ${top.percent.toFixed(1)}% da sua renda em ${top.category}. Reduzir 20% geraria economia de R$ ${(top.amount * 0.2).toFixed(2)}.`,
                severity: 'high'
            });
        }
    }

    // Dica 2: Baseada na taxa de poupança
    const savingsRate = summary.incomeMonth > 0 ? (summary.savingsMonth / summary.incomeMonth) * 100 : 0;
    if (savingsRate < 10) {
        tips.push({
            title: 'Aumente sua Poupança',
            content: `Você está poupando apenas ${savingsRate.toFixed(1)}%. Tente atingir pelo menos 10% da renda. Comece cortando pequenos gastos diários.`,
            severity: 'high'
        });
    } else if (savingsRate > 20) {
        tips.push({
            title: 'Parabéns pela Disciplina!',
            content: `Você está poupando ${savingsRate.toFixed(1)}% da renda! Considere investir parte desse dinheiro para acelerar o crescimento.`,
            severity: 'low'
        });
    }

    // Dica 3: Baseada no progresso da meta
    const { percent, remaining } = calculateGoalProgress(balance, goal);
    if (percent < 25) {
        tips.push({
            title: 'Acelere Seus Aportes',
            content: `Faltam R$ ${remaining.toFixed(2)} para sua meta. Aumentar sua poupança mensal em R$ 100 pode reduzir significativamente o tempo para atingir o objetivo.`,
            severity: 'medium'
        });
    } else if (percent > 75) {
        tips.push({
            title: 'Reta Final!',
            content: `Você está a ${(100 - percent).toFixed(1)}% da sua meta! Mantenha o foco e evite gastos desnecessários nesta reta final.`,
            severity: 'low'
        });
    }

    // Garantir pelo menos 3 dicas
    if (tips.length < 3) {
        tips.push({
            title: 'Revise Gastos Fixos',
            content: 'Assinaturas, planos e serviços fixos podem estar consumindo mais do que você imagina. Revise e cancele o que não usa.',
            severity: 'medium'
        });
    }

    return tips.slice(0, 3);
}

/**
 * Obtém resposta rápida para perguntas comuns (FAQ)
 * Substitui: simulateDecision()
 */
export function getQuickAnswer(
    question: string,
    balance: number,
    summary: FinanceSummary,
    goal: number = 100000
): { text: string; sources?: any[] } {
    const lowerQuestion = question.toLowerCase();

    // Detectar tipo de pergunta
    if (lowerQuestion.includes('comprar') || lowerQuestion.includes('posso') || lowerQuestion.includes('compra')) {
        // Extrair valor se possível (simplificado)
        const match = question.match(/(\d+(?:[.,]\d+)?)/);
        const amount = match ? parseFloat(match[1].replace(',', '.')) : 100;

        return {
            text: FAQResponses.CAN_I_BUY(amount, balance, goal, summary.expenseMonth),
            sources: []
        };
    }

    if (lowerQuestion.includes('economizar') || lowerQuestion.includes('poupar') || lowerQuestion.includes('guardar')) {
        return {
            text: FAQResponses.HOW_TO_SAVE(summary.incomeMonth, summary.expenseMonth),
            sources: []
        };
    }

    if (lowerQuestion.includes('quando') || lowerQuestion.includes('meta') || lowerQuestion.includes('atingir')) {
        return {
            text: FAQResponses.WHEN_GOAL(balance, goal, summary.savingsMonth),
            sources: []
        };
    }

    if (lowerQuestion.includes('investir') || lowerQuestion.includes('investimento') || lowerQuestion.includes('aplicar')) {
        return {
            text: FAQResponses.HOW_TO_INVEST(balance),
            sources: []
        };
    }

    // Resposta padrão
    return {
        text: 'Desculpe, não entendi sua pergunta. Tente perguntas como: "Posso comprar X?", "Como economizar mais?", "Quando atingirei minha meta?" ou "Como investir?"',
        sources: []
    };
}

/**
 * Obtém missões semanais ativas
 */
export function getWeeklyMissions(
    transactions: Transaction[],
    forceRegenerate: boolean = false
): Mission[] {
    // Limpar missões antigas
    cleanupOldMissions();

    // Carregar missões existentes
    let missions = loadMissions();

    // Se não há missões ativas ou forçar regeneração
    const activeMissions = missions.filter(m => m.status === 'active');
    if (activeMissions.length === 0 || forceRegenerate) {
        const summary = calculateMonthlySummary(transactions);
        missions = generateWeeklyMissions(summary, transactions);
        saveMissions(missions);
    } else {
        // Atualizar progresso das missões existentes
        missions = missions.map(m => calculateMissionProgress(m, transactions));
        saveMissions(missions);
    }

    return missions;
}

/**
 * Atualiza o progresso de uma missão manualmente
 * (para missões que não podem ser calculadas automaticamente)
 */
export function updateMissionManually(missionId: string, currentValue: number): void {
    const missions = loadMissions();
    const updated = missions.map(m => {
        if (m.id === missionId) {
            const progress = m.targetValue ? Math.min((currentValue / m.targetValue) * 100, 100) : 0;
            const status = progress >= 100 ? 'completed' : m.status;
            return { ...m, currentValue, progress: Math.round(progress), status };
        }
        return m;
    });
    saveMissions(updated);
}

// Exportar tudo que pode ser útil
export * from './types';
export * from './financeCalculator';
export * from './ruleEngine';
export * from './missionGenerator';
export * from './storage';
export * from './templateEngine';
