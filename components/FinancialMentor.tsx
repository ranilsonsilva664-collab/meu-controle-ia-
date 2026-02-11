
import React, { useState, useEffect } from 'react';
import { Transaction, MentorFeedback } from '../types';
import { getMentorMentorship, simulateDecision } from '../geminiService';

interface FinancialMentorProps {
  transactions: Transaction[];
  balance: number;
  userName: string;
  goal: number;
}

const FinancialMentor: React.FC<FinancialMentorProps> = ({ transactions, balance, userName, goal }) => {
  const [mentorship, setMentorship] = useState<MentorFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [simulation, setSimulation] = useState<{ text: string; sources?: any[] } | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [coolDown, setCoolDown] = useState(0);

  // Timer para Cool Down
  useEffect(() => {
    if (coolDown > 0) {
      const timer = setTimeout(() => setCoolDown(coolDown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [coolDown]);

  useEffect(() => {
    // Tentar carregar do Cache primeiro silenciosamente
    const cacheKey = `mentorship_${userName}_${transactions.length}_${balance.toFixed(0)}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        // Only load if cache is still fresh (e.g., within 30 minutes)
        const cacheAge = Date.now() - (parsed.timestamp || 0);
        if (cacheAge < 1000 * 60 * 30) { // 30 min cache
          setMentorship(parsed.data);
        } else {
          localStorage.removeItem(cacheKey); // Cache expired
        }
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }
  }, [userName, transactions.length, balance.toFixed(0)]);

  const fetchMentorship = async () => {
    if (loading || coolDown > 0) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getMentorMentorship(transactions, balance, userName, goal);
      setMentorship(data);
      const cacheKey = `mentor_cache_${transactions.length}_${balance.toFixed(0)}_${goal}`;
      localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao carregar mentoria");
      if (err.message?.includes("LIMITE_EXCEDIDO")) setCoolDown(90);
    } finally {
      setLoading(false);
    }
  };

  // REMOVIDO: O gatilho automático foi removido para poupar a cota de uso (Erro 429)
  // Agora a análise só acontece quando o usuário clica no botão "Gerar Análise Completa"

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || simLoading || coolDown > 0) return;

    setSimLoading(true);
    try {
      const res = await simulateDecision(query, balance, goal);
      setSimulation(res);
      setQuery('');
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("LIMITE_EXCEDIDO")) {
        setCoolDown(60);
      }
      setSimulation({
        text: `Aviso do Mentor: ${err.message || 'Erro desconhecido'}`
      });
    } finally {
      setSimLoading(false);
    }
  };

  const stageColors = {
    iniciante: 'bg-blue-500',
    poupador: 'bg-emerald-500',
    investidor: 'bg-indigo-600',
    mestre: 'bg-amber-500'
  };

  return (
    <div className="space-y-8 pb-20">
      {/* SEÇÃO 1: CHAT COM O MENTOR (Sempre Visível) */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 px-2 flex items-center gap-2 uppercase tracking-tighter">
          <span>💬</span> Chat Direto com o Mentor
        </h3>
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <span className="text-6xl">✨</span>
          </div>
          <p className="text-slate-400 text-sm mb-6">Pergunte qualquer coisa sobre suas finanças, compras ou investimentos.</p>

          <form onSubmit={handleSimulate} className="space-y-4">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: Posso comprar uma pizza hoje sem quebrar meus 100k?"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-emerald-500 outline-none resize-none transition-all h-24"
            />
            <button
              disabled={simLoading || !query.trim() || coolDown > 0}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-900 font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {simLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  Mentor está pensando...
                </>
              ) : coolDown > 0 ? (
                <>⏳ Aguarde {coolDown}s (Limite Google)</>
              ) : 'Enviar Pergunta ao Mentor'}
            </button>
          </form>

          {simulation && (
            <div className="mt-6 p-5 bg-white/5 border border-white/10 rounded-2xl text-sm leading-relaxed animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="text-emerald-400 font-black mb-2 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                <span>✨</span> Parecer do Mentor
              </div>
              <div className="prose prose-invert prose-sm">
                {simulation.text.split('\n').map((line, i) => <p key={i} className="mb-2 text-slate-200">{line}</p>)}
              </div>
            </div>
          )}
        </div>
      </section>

      <hr className="border-slate-100 dark:border-slate-800" />

      {/* SEÇÃO 2: ANÁLISE DE PERFIL (Condicional ou Manual) */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 px-2 flex items-center gap-2 uppercase tracking-tighter">
          <span>🧙‍♂️</span> Análise Estratégica de Perfil
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 animate-pulse bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <div className="text-6xl mb-4 text-emerald-500">🧠</div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-center">O Mentor está analisando seu perfil...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-[2rem] border border-red-100 dark:border-red-900/20 shadow-xl">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-6">{error}</p>
            <button
              onClick={fetchMentorship}
              disabled={coolDown > 0}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-all"
            >
              {coolDown > 0 ? `Liberando em ${coolDown}s...` : 'Tentar novamente'}
            </button>
          </div>
        ) : !mentorship ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700 text-center">
            <div className="text-4xl mb-4 opacity-30">📊</div>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Clique abaixo para gerar uma análise profunda do seu estágio rumo aos 100k.</p>
            <button
              onClick={fetchMentorship}
              disabled={coolDown > 0}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-600 dark:text-slate-300 px-8 py-3 rounded-xl font-bold transition-all active:scale-95"
            >
              {coolDown > 0 ? `Aguarde ${coolDown}s...` : 'Gerar Análise Completa'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Mentoria */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full -mr-10 -mt-10 ${stageColors[mentorship.stage]}`}></div>
              <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-3xl shadow-lg">
                  {mentorship.stage === 'mestre' ? '🏆' : '🧙‍♂️'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase text-white ${stageColors[mentorship.stage]}`}>
                      {mentorship.stage}
                    </span>
                    <button onClick={fetchMentorship} disabled={coolDown > 0} className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">
                      {coolDown > 0 ? `${coolDown}s` : '🔄 Atualizar'}
                    </button>
                  </div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white mb-4 leading-tight">
                    {mentorship.message}
                  </h2>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                    <p className="text-emerald-700 dark:text-emerald-400 text-sm font-bold flex items-center gap-2">
                      <span>🎯 Desafio:</span> {mentorship.challenge}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mentorship.insights.map((insight, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition-all">
                  <div className={`w-8 h-8 rounded-lg mb-3 flex items-center justify-center text-xs ${insight.impact === 'positive' ? 'bg-emerald-500/10 text-emerald-500' :
                    insight.impact === 'negative' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                    {insight.impact === 'positive' ? '↑' : insight.impact === 'negative' ? '↓' : '→'}
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-sm">{insight.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{insight.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default FinancialMentor;
