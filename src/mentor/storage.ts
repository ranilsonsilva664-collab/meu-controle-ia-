import { Mission, MentorConfig, BudgetCategory } from './types';

const STORAGE_KEYS = {
    MISSIONS: 'mentor_missions',
    BUDGET_LIMITS: 'mentor_budget_limits',
    ENABLED_RULES: 'mentor_enabled_rules',
    CONFIG: 'mentor_config'
};

/**
 * Salva missões no localStorage
 */
export function saveMissions(missions: Mission[]): void {
    try {
        localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions));
    } catch (error) {
        console.error('Erro ao salvar missões:', error);
    }
}

/**
 * Carrega missões do localStorage
 */
export function loadMissions(): Mission[] {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.MISSIONS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Erro ao carregar missões:', error);
        return [];
    }
}

/**
 * Salva limites de orçamento por categoria
 */
export function saveBudgetLimits(limits: BudgetCategory[]): void {
    try {
        localStorage.setItem(STORAGE_KEYS.BUDGET_LIMITS, JSON.stringify(limits));
    } catch (error) {
        console.error('Erro ao salvar limites:', error);
    }
}

/**
 * Carrega limites de orçamento
 */
export function loadBudgetLimits(): BudgetCategory[] {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.BUDGET_LIMITS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Erro ao carregar limites:', error);
        return [];
    }
}

/**
 * Salva IDs das regras habilitadas
 */
export function saveEnabledRules(ruleIds: string[]): void {
    try {
        localStorage.setItem(STORAGE_KEYS.ENABLED_RULES, JSON.stringify(ruleIds));
    } catch (error) {
        console.error('Erro ao salvar regras:', error);
    }
}

/**
 * Carrega IDs das regras habilitadas
 */
export function loadEnabledRules(): string[] | null {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.ENABLED_RULES);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Erro ao carregar regras:', error);
        return null;
    }
}

/**
 * Salva configuração completa do mentor
 */
export function saveMentorConfig(config: MentorConfig): void {
    try {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch (error) {
        console.error('Erro ao salvar configuração:', error);
    }
}

/**
 * Carrega configuração do mentor
 */
export function loadMentorConfig(): MentorConfig | null {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Erro ao carregar configuração:', error);
        return null;
    }
}

/**
 * Limpa todas as missões
 */
export function clearMissions(): void {
    try {
        localStorage.removeItem(STORAGE_KEYS.MISSIONS);
    } catch (error) {
        console.error('Erro ao limpar missões:', error);
    }
}

/**
 * Limpa toda a configuração do mentor
 */
export function clearAllMentorData(): void {
    try {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    } catch (error) {
        console.error('Erro ao limpar dados do mentor:', error);
    }
}

/**
 * Atualiza o progresso de uma missão específica
 */
export function updateMissionProgress(missionId: string, currentValue: number): void {
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

/**
 * Marca uma missão como completada
 */
export function completeMission(missionId: string): void {
    const missions = loadMissions();
    const updated = missions.map(m =>
        m.id === missionId ? { ...m, progress: 100, status: 'completed' as const } : m
    );
    saveMissions(updated);
}

/**
 * Remove missões expiradas ou completadas
 */
export function cleanupOldMissions(): void {
    const missions = loadMissions();
    const now = new Date();
    const active = missions.filter(m => {
        const endDate = new Date(m.endDate);
        // Manter apenas missões ativas ou completadas nos últimos 7 dias
        if (m.status === 'completed') {
            const completedRecently = (now.getTime() - endDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
            return completedRecently;
        }
        return m.status === 'active' && endDate > now;
    });
    saveMissions(active);
}
