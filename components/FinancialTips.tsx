
import React, { useState, useEffect } from 'react';
import { Transaction, Tip } from '../types';
import { generateFinancialTips } from '../geminiService';

interface FinancialTipsProps {
  transactions: Transaction[];
  balance: number;
  goal: number;
}

const FinancialTips: React.FC<FinancialTipsProps> = ({ transactions, balance, goal }) => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cacheKey = `financial_tips_${transactions.length}_${balance.toFixed(0)}_${goal}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 1000 * 60 * 60) { // 1h cache
          setTips(parsed.data);
          return;
        }
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }
  }, [transactions.length, balance.toFixed(0), goal]);

  const fetchTips = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const aiTips = await generateFinancialTips(transactions, balance, goal);
      setTips(aiTips);
      const cacheKey = `financial_tips_${transactions.length}_${balance.toFixed(0)}_${goal}`;
      localStorage.setItem(cacheKey, JSON.stringify({ data: aiTips, timestamp: Date.now() }));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao gerar dicas");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">O Mentor está processando novos insights...</p>
      </div>
    );
  }

  if (tips.length === 0 && !loading) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600">
        <div className="text-4xl mb-4 opacity-30">💡</div>
        <p className="font-bold text-sm mb-6 text-slate-500">O Mentor tem dicas exclusivas para acelerar seus 100k.</p>
        <button
          onClick={fetchTips}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-all active:scale-95 text-sm"
        >
          Gerar Dicas Estratégicas
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end px-2">
        <button
          onClick={fetchTips}
          disabled={loading}
          className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter hover:text-emerald-600"
        >
          {loading ? 'Refazendo...' : '🔄 Atualizar Estratégia'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tips.map((tip, idx) => (
          <div key={idx} className={`p-8 rounded-[2rem] border transition-all hover:scale-[1.02] shadow-sm ${tip.severity === 'high' ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30' :
            tip.severity === 'medium' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30' :
              'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
            }`}>
            <div className="text-3xl mb-4">
              {tip.severity === 'high' ? '🚀' : tip.severity === 'medium' ? '⚠️' : '✅'}
            </div>
            <h3 className="font-black text-slate-800 dark:text-slate-100 mb-3 text-lg">{tip.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{tip.content}</p>
          </div>
        ))}
      </div>

      <div className="bg-emerald-600 p-8 md:p-10 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none text-9xl">🧠</div>
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-black mb-4 uppercase tracking-tight italic">Mentalidade de Riqueza</h3>
          <p className="text-emerald-50 mb-6 text-lg leading-relaxed font-medium">
            "Não é sobre quanto você ganha, mas sobre quanto você mantém e como faz esse dinheiro trabalhar para você."
          </p>
          <div className="flex items-center gap-4 text-[10px] font-black text-emerald-200 uppercase tracking-widest">
            <span className="bg-white/20 px-3 py-1 rounded-full">Disciplina</span>
            <span className="bg-white/20 px-3 py-1 rounded-full">Consistência</span>
            <span className="bg-white/20 px-3 py-1 rounded-full">Rumo100k</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialTips;
