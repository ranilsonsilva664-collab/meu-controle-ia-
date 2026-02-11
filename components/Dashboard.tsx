
import React from 'react';
import { FinancialStats, Transaction, TransactionType, Category } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardProps {
  stats: FinancialStats;
  transactions: Transaction[];
  onAdd: () => void;
  onEdit: (transaction: Transaction) => void;
  isDarkMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, transactions, onAdd, onEdit, isDarkMode }) => {
  const [chartType, setChartType] = React.useState<TransactionType>(TransactionType.EXPENSE);

  const categoryData = React.useMemo(() => {
    const categories: Record<string, number> = {};
    transactions
      .filter(t => t.type === chartType)
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + Number(t.amount);
      });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, chartType]);

  const COLORS = chartType === TransactionType.EXPENSE
    ? ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#10b981']
    : ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#64748b', '#ef4444'];

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Bem-vindo de volta!</h2>
          <p className="text-slate-500 dark:text-slate-400">Suas finanças no controle certo.</p>
        </div>
        <button
          onClick={onAdd}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center gap-2 active:scale-95 text-sm md:text-base"
        >
          <span>📸</span> Adicionar Comprovante
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Saldo Atual</p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Total Receitas</p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">R$ {stats.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">Total Despesas</p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">R$ {stats.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-emerald-600 p-6 rounded-2xl shadow-lg text-white">
          <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest">Meu Progresso</p>
          <p className="text-2xl font-black mt-1">{stats.progressPercent.toFixed(1)}%</p>
          <div className="w-full bg-emerald-800/50 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-white h-full transition-all duration-1000" style={{ width: `${stats.progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Distribuição</h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setChartType(TransactionType.EXPENSE)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${chartType === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 text-red-500 shadow-sm' : 'text-slate-500'}`}
              >
                Despesas
              </button>
              <button
                onClick={() => setChartType(TransactionType.INCOME)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${chartType === TransactionType.INCOME ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-500'}`}
              >
                Receitas
              </button>
            </div>
          </div>

          <div className="h-[300px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#0f172a' : '#fff',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                    itemStyle={{ color: isDarkMode ? '#fff' : '#1e293b', fontWeight: 'bold' }}
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                <div className="text-5xl mb-4">📊</div>
                <p className="font-bold">Nenhuma {chartType === TransactionType.EXPENSE ? 'despesa' : 'receita'} encontrada.</p>
                <p className="text-sm">Adicione transações para ver o gráfico.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions Column */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Recentes</h3>
          </div>
          <div className="space-y-1 flex-1">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onEdit(t)}
                  className="flex items-center justify-between p-3 -mx-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer active:scale-[0.97] group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${t.type === TransactionType.INCOME ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'
                      }`}>
                      {t.type === TransactionType.INCOME ? '↑' : '↓'}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase truncate tracking-widest">
                        {t.vendor || 'S/ Estabelecimento'}
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{t.description}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-black flex-shrink-0 ml-2 ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 opacity-50">
                <div className="text-4xl mb-4">📭</div>
                <p className="font-bold text-sm">Sem movimentos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
