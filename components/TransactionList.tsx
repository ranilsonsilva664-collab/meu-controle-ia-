
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

type DateFilter = 'all' | 'week' | 'month' | 'year';

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onEdit, onDelete }) => {
  const [filter, setFilter] = useState<'all' | TransactionType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const clearFilters = () => {
    setFilter('all');
    setDateFilter('all');
    setMinAmount('');
    setMaxAmount('');
    setSearchQuery('');
  };

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      // Filtro de Busca (Texto)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        t.description.toLowerCase().includes(searchLower) || 
        (t.vendor && t.vendor.toLowerCase().includes(searchLower));

      // Filtro de Tipo (Receita/Despesa)
      const matchesType = filter === 'all' || t.type === filter;
      
      // Filtro de Data (Lógica de Calendário)
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const tDate = new Date(t.date);
        const now = new Date();
        
        if (dateFilter === 'week') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          if (tDate < startOfWeek) matchesDate = false;
        } else if (dateFilter === 'month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          if (tDate < startOfMonth) matchesDate = false;
        } else if (dateFilter === 'year') {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          if (tDate < startOfYear) matchesDate = false;
        }
      }

      // Filtro de Valor
      const matchesMin = minAmount === '' || t.amount >= parseFloat(minAmount);
      const matchesMax = maxAmount === '' || t.amount <= parseFloat(maxAmount);

      return matchesSearch && matchesType && matchesDate && matchesMin && matchesMax;
    });
  }, [transactions, filter, dateFilter, minAmount, maxAmount, searchQuery]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Histórico Financeiro</h3>
            <p className="text-slate-500 text-sm">Gerencie e analise seus movimentos.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar transação..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-slate-200"
              />
            </div>
            {(filter !== 'all' || dateFilter !== 'all' || minAmount !== '' || maxAmount !== '' || searchQuery !== '') && (
              <button 
                onClick={clearFilters}
                className="text-xs font-black text-red-500 uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-950/20 px-4 py-3 rounded-2xl transition-all"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {/* Categorias de Tipo */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Fluxo</label>
            <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl">
              {['all', TransactionType.INCOME, TransactionType.EXPENSE].map((f) => (
                <button 
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                    filter === f 
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {f === 'all' ? 'Tudo' : f === TransactionType.INCOME ? 'Receitas' : 'Despesas'}
                </button>
              ))}
            </div>
          </div>

          {/* Períodos de Data */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Período</label>
            <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl">
              {(['all', 'week', 'month', 'year'] as DateFilter[]).map((df) => (
                <button
                  key={df}
                  onClick={() => setDateFilter(df)}
                  className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                    dateFilter === df
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {df === 'all' ? 'Tudo' : df === 'week' ? 'Semana' : df === 'month' ? 'Mês' : 'Ano'}
                </button>
              ))}
            </div>
          </div>

          {/* Faixa de Valor */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Faixa de Valor (R$)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                placeholder="Mín"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-emerald-500 rounded-xl text-xs dark:text-slate-200 outline-none transition-all"
              />
              <span className="text-slate-300 dark:text-slate-700 font-bold">à</span>
              <input 
                type="number" 
                placeholder="Máx"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-emerald-500 rounded-xl text-xs dark:text-slate-200 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-2 px-8">
          <thead>
            <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Detalhes</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4 text-right">Valor</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((t) => (
                <tr 
                  key={t.id} 
                  className="group transition-all"
                >
                  <td className="px-6 py-5 text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/20 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/10 rounded-l-2xl transition-colors">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-5 bg-slate-50/50 dark:bg-slate-800/20 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/10 transition-colors">
                    <div className="flex flex-col">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                        {t.vendor || 'Sem Estabelecimento'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 bg-slate-50/50 dark:bg-slate-800/20 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/10 transition-colors">
                    <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                      {t.category}
                    </span>
                  </td>
                  <td className={`px-6 py-5 text-sm font-black text-right transition-colors bg-slate-50/50 dark:bg-slate-800/20 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/10 ${
                    t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-5 bg-slate-50/50 dark:bg-slate-800/20 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/10 rounded-r-2xl transition-colors text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onEdit(t)}
                        className="p-2 text-slate-400 hover:text-emerald-500 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:scale-110"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => onDelete(t.id)}
                        className="p-2 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:scale-110"
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-slate-400 dark:text-slate-600">
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-5xl">🏜️</span>
                    <div className="space-y-1">
                      <p className="font-bold text-lg">Nenhum resultado encontrado</p>
                      <p className="text-xs">Tente ajustar seus filtros para encontrar o que procura.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;
