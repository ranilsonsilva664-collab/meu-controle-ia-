/**
 * Motor de templates dinâmicos para mensagens do mentor
 */

export function formatCurrency(value: number): string {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
}

export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR');
}

/**
 * Renderiza um template substituindo placeholders por valores
 * Exemplo: "Você gastou {amount} em {category}" -> "Você gastou R$ 150,00 em Lazer"
 */
export function renderTemplate(template: string, vars: Record<string, any>): string {
    let result = template;

    Object.entries(vars).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        let formattedValue = value;

        // Auto-formatação baseada no tipo
        if (typeof value === 'number') {
            // Se a chave contém 'percent', formatar como percentual
            if (key.toLowerCase().includes('percent') || key.toLowerCase().includes('pct')) {
                formattedValue = formatPercent(value);
            }
            // Caso contrário, formatar como moeda
            else if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('value') ||
                key.toLowerCase().includes('gasto') || key.toLowerCase().includes('renda')) {
                formattedValue = formatCurrency(value);
            }
            else {
                formattedValue = value.toFixed(2);
            }
        }

        result = result.replace(new RegExp(placeholder, 'g'), String(formattedValue));
    });

    return result;
}

/**
 * Biblioteca de templates prontos para mensagens do mentor
 */
export const MessageTemplates = {
    // Alertas de déficit
    DEFICIT_CRITICAL: 'Alerta! Você gastou {expenseAmount} mas sua renda foi apenas {incomeAmount}. Déficit de {deficitAmount}.',
    DEFICIT_WARNING: 'Atenção! Seus gastos ({expensePercent}) estão muito próximos da sua renda. Cuidado para não entrar no vermelho.',

    // Categorias específicas
    LEISURE_HIGH: 'Você gastou {amount} em {category} ({percent} da sua renda). Meta recomendada: até 30%.',
    FOOD_OUT_HIGH: 'Gastos com alimentação fora de casa: {amount} ({percent}). Considere cozinhar mais em casa para economizar.',
    SUBSCRIPTIONS_HIGH: 'Você tem {amount} em assinaturas ({percent} da renda). Revise quais são realmente necessárias.',
    TRANSPORT_HIGH: 'Transporte consumiu {amount} ({percent}). Avalie alternativas como transporte público ou carona.',
    DELIVERY_HIGH: 'Delivery: {amount} ({percent}). Reduzir pedidos pode gerar economia significativa.',

    // Comportamento
    CONSECUTIVE_SPENDING: 'Detectamos gastos diários em {category} por {days} dias seguidos. Atenção ao padrão!',
    LARGE_PURCHASE: 'Grande compra detectada: {description} ({percent} da sua renda mensal). Avalie o impacto na sua meta.',
    HIGH_FREQUENCY: '{count} transações em {category} nos últimos 7 dias. Considere reduzir a frequência.',
    NIGHT_SPENDING: '{count} gastos noturnos detectados. Compras noturnas tendem a ser por impulso.',

    // Poupança
    LOW_SAVINGS: 'Sua poupança está em {savingsPercent}. Meta recomendada: pelo menos 10% da renda.',
    NO_INVESTMENTS: 'Nenhum investimento registrado este mês. Comece pequeno, mas comece!',
    EXCELLENT_SAVINGS: 'Parabéns! Você poupou {savingsPercent} da sua renda. Disciplina exemplar! 🎉',

    // Dívidas
    DEBT_DETECTED: 'Dívidas/juros detectados: {amount}. Priorize eliminar dívidas antes de novos gastos.',
    HIGH_INSTALLMENTS: 'Parcelamentos comprometem {percent} da sua renda. Evite novos compromissos.',

    // Progresso na meta
    SLOW_PROGRESS: 'Progresso de apenas {progressPercent} em 30 dias. Acelere seus aportes para atingir {goal}!',
    GOOD_PROGRESS: 'Excelente ritmo! {progressPercent} de progresso em 30 dias. Continue assim!',
    MILESTONE_50: 'Você está na metade do caminho! {balance} de {goal} conquistados. 🎯',
    MILESTONE_75: 'Quase lá! Faltam apenas {remaining} para sua meta de {goal}. 🚀',
    MILESTONE_90: 'Reta final! Você está a {percent} da sua meta. A conquista está próxima! 💪',
    GOAL_ACHIEVED: '🏆 PARABÉNS! Meta de {goal} conquistada! Você é um mestre das finanças!',

    // Outros
    NO_TRANSACTIONS: 'Nenhuma transação registrada nos últimos 7 dias. Lembre-se de registrar todos os gastos!',
    UNCATEGORIZED_HIGH: 'Muitos gastos em "Outros" ({percent}). Categorize melhor para ter insights mais precisos.',

    // Mensagens positivas
    GOOD_BALANCE: 'Saldo positivo de {balance}! Você está no caminho certo. 💚',
    CONSISTENT_TRACKING: 'Ótimo! {count} transações registradas este mês. Controle é poder!',
};

/**
 * Mensagens de FAQ (respostas prontas)
 */
export const FAQResponses = {
    CAN_I_BUY: (amount: number, balance: number, goal: number, monthlyExpense: number) => {
        const impactPercent = (amount / balance) * 100;
        const daysToRecover = monthlyExpense > 0 ? (amount / (monthlyExpense / 30)) : 0;

        if (impactPercent > 20) {
            return `Esta compra de ${formatCurrency(amount)} representa ${formatPercent(impactPercent)} do seu saldo atual. É um impacto significativo. Pergunte-se: isso é essencial? Você levaria cerca de ${Math.ceil(daysToRecover)} dias para recuperar esse valor.`;
        } else if (impactPercent > 10) {
            return `Compra de ${formatCurrency(amount)} (${formatPercent(impactPercent)} do saldo). É viável, mas avalie se não compromete suas metas de curto prazo.`;
        } else {
            return `Compra de ${formatCurrency(amount)} tem impacto baixo (${formatPercent(impactPercent)} do saldo). Se for algo que agrega valor, pode ir em frente!`;
        }
    },

    HOW_TO_SAVE: (income: number, expense: number) => {
        const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
        return `Atualmente você poupa ${formatPercent(savingsRate)} da sua renda. Para economizar mais: 1) Corte gastos supérfluos (delivery, assinaturas não usadas); 2) Defina um valor fixo para poupar logo que receber; 3) Evite compras por impulso (regra das 24h).`;
    },

    WHEN_GOAL: (balance: number, goal: number, monthlySavings: number) => {
        const remaining = goal - balance;
        const monthsNeeded = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : Infinity;

        if (monthsNeeded === Infinity || monthsNeeded > 120) {
            return `Com a economia atual, levaria muito tempo. Aumente seus aportes mensais! Cada R$ 100 a mais por mês faz diferença.`;
        } else if (monthsNeeded > 12) {
            return `Faltam ${formatCurrency(remaining)}. No ritmo atual (${formatCurrency(monthlySavings)}/mês), você atingirá sua meta em aproximadamente ${monthsNeeded} meses (${Math.floor(monthsNeeded / 12)} anos).`;
        } else {
            return `Faltam ${formatCurrency(remaining)}. No ritmo atual, você atingirá sua meta em aproximadamente ${monthsNeeded} meses! Continue firme! 🎯`;
        }
    },

    HOW_TO_INVEST: (balance: number) => {
        if (balance < 1000) {
            return `Com saldo de ${formatCurrency(balance)}, foque primeiro em construir uma reserva de emergência (3-6 meses de despesas). Depois, comece com Tesouro Direto ou CDBs de bancos digitais.`;
        } else if (balance < 10000) {
            return `Com ${formatCurrency(balance)}, você pode começar com Tesouro Selic (liquidez diária) e CDBs. Evite investimentos de alto risco até ter uma base sólida.`;
        } else {
            return `Com ${formatCurrency(balance)}, diversifique: Tesouro Direto (segurança), CDBs/LCIs (renda fixa), e considere fundos de índice (ações) para longo prazo. Estude antes de investir!`;
        }
    }
};
