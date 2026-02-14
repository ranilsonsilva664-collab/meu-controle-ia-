
import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { getMentorFeedback, getQuickAnswer, getWeeklyMissions, calculateMonthlySummary, Mission } from '../src/mentor';

interface FinancialMentorProps {
  transactions: Transaction[];
  balance: number;
  userName: string;
  goal: number;
}

const FinancialMentor: React.FC<FinancialMentorProps> = ({ transactions, balance, userName, goal }) => {
  const [mentorship, setMentorship] = useState<any>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedFAQ, setSelectedFAQ] = useState<string | null>(null);
  const [faqAnswer, setFaqAnswer] = useState<string>('');
  const [isRefreshingMentorship, setIsRefreshingMentorship] = useState(false);
  const [isRefreshingMissions, setIsRefreshingMissions] = useState(false);

  useEffect(() => {
    // Carregar feedback do mentor (instantâneo)
    const feedback = getMentorFeedback(transactions, balance, userName, goal);
    setMentorship(feedback);

    // Carregar missões semanais
    const weeklyMissions = getWeeklyMissions(transactions);
    setMissions(weeklyMissions);
  }, [transactions, balance, userName, goal]);

  const handleFAQClick = (question: string) => {
    setSelectedFAQ(question);
    const summary = calculateMonthlySummary(transactions);
    const answer = getQuickAnswer(question, balance, { ...summary, balance }, goal);
    setFaqAnswer(answer.text);
  };

  const refreshMentorship = () => {
    setIsRefreshingMentorship(true);
    const feedback = getMentorFeedback(transactions, balance, userName, goal);
    setMentorship(feedback);
    setTimeout(() => setIsRefreshingMentorship(false), 600);
  };

  const refreshMissions = () => {
    setIsRefreshingMissions(true);
    const weeklyMissions = getWeeklyMissions(transactions, true);
    setMissions(weeklyMissions);
    setTimeout(() => setIsRefreshingMissions(false), 600);
  };

  const stageColors = {
    iniciante: 'bg-blue-500',
    poupador: 'bg-emerald-500',
    investidor: 'bg-indigo-600',
    mestre: 'bg-amber-500'
  };

  const faqQuestions = [
    'Posso comprar algo de R$ 100?',
    'Como economizar mais dinheiro?',
    'Quando atingirei minha meta?',
    'Como devo investir meu dinheiro?'
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* SEÇÃO 1: FAQ RÁPIDO */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 px-2 flex items-center gap-2 uppercase tracking-tighter">
          <span>💬</span> Perguntas Rápidas
        </h3>
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <span className="text-6xl">✨</span>
          </div>
          <p className="text-slate-400 text-sm mb-6">Clique em uma pergunta para ver a resposta personalizada.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {faqQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleFAQClick(q)}
                className={`p-4 rounded-xl text-left transition-all ${selectedFAQ === q
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
              >
                <span className="text-sm font-medium">{q}</span>
              </button>
            ))}
          </div>

          {faqAnswer && (
            <div className="mt-6 p-5 bg-white/5 border border-white/10 rounded-2xl text-sm leading-relaxed animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="text-emerald-400 font-black mb-2 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                <span>✨</span> Resposta do Mentor
              </div>
              <div className="prose prose-invert prose-sm">
                {faqAnswer.split('\n').map((line, i) => <p key={i} className="mb-2 text-slate-200">{line}</p>)}
              </div>
            </div>
          )}
        </div>
      </section>

      <hr className="border-slate-100 dark:border-slate-800" />

      {/* SEÇÃO 2: MISSÕES DA SEMANA */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase tracking-tighter">
            <span>🎯</span> Missões da Semana
          </h3>
          <button
            onClick={refreshMissions}
            className={`text-[10px] font-bold text-emerald-500 uppercase tracking-tighter hover:text-emerald-600 transition-all ${isRefreshingMissions ? 'animate-spin' : ''}`}
            disabled={isRefreshingMissions}
          >
            🔄 {isRefreshingMissions ? 'Renovando...' : 'Renovar'}
          </button>
        </div>

        {missions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700">
            <div className="text-4xl mb-4 opacity-30">🎯</div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Adicione transações para gerar missões personalizadas!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missions.map((mission) => (
              <div
                key={mission.id}
                className={`p-6 rounded-2xl border transition-all ${mission.status === 'completed'
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl">
                    {mission.status === 'completed' ? '✅' : mission.type === 'savings' ? '💰' : mission.type === 'reduction' ? '📉' : mission.type === 'tracking' ? '📊' : '🔍'}
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${mission.status === 'completed' ? 'bg-emerald-500 text-white' :
                    mission.status === 'failed' ? 'bg-red-500 text-white' :
                      'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                    {mission.status === 'completed' ? 'Completa' : mission.status === 'failed' ? 'Expirada' : 'Ativa'}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{mission.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{mission.description}</p>

                {/* Barra de progresso */}
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-emerald-600 dark:text-emerald-400">
                        {mission.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      style={{ width: `${mission.progress}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-500"
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <hr className="border-slate-100 dark:border-slate-800" />

      {/* SEÇÃO 3: ANÁLISE DE PERFIL */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase tracking-tighter">
            <span>🧙‍♂️</span> Análise de Perfil
          </h3>
          <button
            onClick={refreshMentorship}
            className={`text-[10px] font-bold text-emerald-500 uppercase tracking-tighter hover:text-emerald-600 transition-all ${isRefreshingMentorship ? 'animate-spin' : ''}`}
            disabled={isRefreshingMentorship}
          >
            🔄 {isRefreshingMentorship ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {mentorship && (
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
              {mentorship.insights.slice(0, 3).map((insight: any, idx: number) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition-all">
                  <div className="text-3xl mb-3">{insight.icon}</div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-sm">{insight.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{insight.body}</p>
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
