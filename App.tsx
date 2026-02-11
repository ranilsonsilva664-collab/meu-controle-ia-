
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Transaction, TransactionType, Category } from './types';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import FinancialMentor from './components/FinancialMentor';
import FinancialTips from './components/FinancialTips';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import AddTransactionModal from './components/AddTransactionModal';
import AuthScreen from './components/AuthScreen';
import Logo from './components/Logo';
import { supabase } from './supabaseClient';

const GOAL_TARGET = 100000;

const App: React.FC = () => {
  console.log('App: Componente inicializado');
  const [currentPage, setCurrentPage] = useState<AppState>('auth');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userGoal, setUserGoal] = useState<number>(100000);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<{ id: string, name: string, avatarUrl?: string } | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('rumo100k_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Check for active session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Usuário',
            avatarUrl: session.user.user_metadata.avatar_url
          });
          setUserGoal(Number(session.user.user_metadata.financial_goal || 100000));
          setCurrentPage('dashboard');
          fetchTransactions(session.user.id);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Usuário',
          avatarUrl: session.user.user_metadata.avatar_url
        });
        setUserGoal(Number(session.user.user_metadata.financial_goal || 100000));
        setCurrentPage('dashboard');
        fetchTransactions(session.user.id);
      } else {
        setUser(null);
        setCurrentPage('auth');
        setTransactions([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
      } else {
        setTransactions(data || []);
      }
    } catch (err) {
      console.error('Fetch transactions failed:', err);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('rumo100k_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('rumo100k_theme', 'light');
    }
  }, [isDarkMode]);

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const balance = totalIncome - totalExpense;
    const progressPercent = Math.max(0, Math.min((balance / userGoal) * 100, 100));

    return { totalIncome, totalExpense, balance, progressPercent };
  }, [transactions, userGoal]);

  const handleUpdateGoal = async (newGoal: number) => {
    if (!user) return;
    try {
      const { error } = await supabase.auth.updateUser({
        data: { financial_goal: newGoal }
      });
      if (error) throw error;
      setUserGoal(newGoal);
    } catch (err: any) {
      alert('Erro ao atualizar meta: ' + err.message);
    }
  };

  const handleAddTransaction = async (transaction: Transaction) => {
    if (!user) return;

    const { id, ...transactionData } = transaction;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...transactionData,
          user_id: user.id
        }])
        .select();

      if (error) {
        alert('Erro ao salvar transação: ' + error.message);
      } else if (data) {
        setTransactions(prev => [data[0], ...prev]);
      }
    } catch (err) {
      alert('Erro ao conectar com o banco de dados.');
    }
  };

  const handleUpdateTransaction = async (updated: Transaction) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          description: updated.description,
          vendor: updated.vendor,
          amount: updated.amount,
          date: updated.date,
          category: updated.category,
          type: updated.type
        })
        .eq('id', updated.id)
        .eq('user_id', user.id);

      if (error) {
        alert('Erro ao atualizar transação: ' + error.message);
      } else {
        setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
        setEditingTransaction(null);
      }
    } catch (err) {
      alert('Erro ao conectar com o banco de dados.');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;

    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          alert('Erro ao excluir transação: ' + error.message);
        } else {
          setTransactions(prev => prev.filter(t => t.id !== id));
        }
      } catch (err) {
        alert('Erro ao conectar com o banco de dados.');
      }
    }
  };

  const handleOpenEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setCurrentPage('auth');
      setTransactions([]);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  if (currentPage === 'auth') {
    return <AuthScreen onLogin={(userData) => {
      setUser(userData);
      setCurrentPage('dashboard');
    }} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black overflow-hidden flex-col md:flex-row transition-colors duration-300">
      <Sidebar
        activePage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        userName={user?.name || 'Usuário'}
        avatarUrl={user?.avatarUrl}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="md:hidden flex items-center justify-between mb-8 px-2">
            <Logo size="sm" />
            <div className="flex gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-lg active:scale-95 transition-all flex items-center justify-center min-w-[40px] h-[40px]"
              >
                {isDarkMode ? '🌞' : '🌙'}
              </button>
            </div>
          </div>

          {currentPage === 'dashboard' && (
            <Dashboard
              stats={stats}
              transactions={transactions}
              onAdd={() => { setEditingTransaction(null); setIsModalOpen(true); }}
              onEdit={handleOpenEdit}
              isDarkMode={isDarkMode}
            />
          )}
          {currentPage === 'transactions' && (
            <TransactionList
              transactions={transactions}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteTransaction}
            />
          )}
          {currentPage === 'mentor' && (
            <FinancialMentor
              transactions={transactions}
              balance={stats.balance}
              userName={user?.name || 'Amigo'}
              goal={userGoal}
            />
          )}
          {currentPage === 'goals' && (
            <div className="space-y-12">
              <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-emerald-100 dark:border-emerald-900/20 text-center transition-colors">
                <div className="text-7xl mb-6">🎯</div>
                <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">Meu Controle Financeiro</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-10 text-xl max-w-lg mx-auto leading-relaxed">
                  Você já conquistou <span className="text-emerald-500 font-black">R$ {stats.balance.toLocaleString('pt-BR')}</span>.
                  Faltam R$ {Math.max(0, userGoal - stats.balance).toLocaleString('pt-BR')} para sua liberdade total.
                </p>

                <div className="flex justify-center gap-4 mb-8">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-black text-slate-400 mb-1">Sua Meta Atual</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-emerald-500">R$ {userGoal.toLocaleString('pt-BR')}</span>
                      <button
                        onClick={() => {
                          const val = prompt('Qual sua nova meta financeira?', userGoal.toString());
                          if (val && !isNaN(Number(val))) handleUpdateGoal(Number(val));
                        }}
                        className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>
                </div>

                <div className="relative pt-1 max-w-xl mx-auto mb-10">
                  <div className="overflow-hidden h-6 mb-4 text-xs flex rounded-full bg-emerald-100 dark:bg-emerald-900/20">
                    <div
                      style={{ width: `${stats.progressPercent}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-1000 relative"
                    >
                      <span className="absolute right-2 font-black text-[10px]">{stats.progressPercent.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                  {['Iniciante', 'Poupador', 'Investidor', 'Mestre'].map((lvl, i) => (
                    <div key={lvl} className={`p-4 rounded-2xl border ${stats.progressPercent >= (i + 1) * 25 ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 opacity-50'}`}>
                      <div className="text-2xl mb-1">{['🌱', '💰', '📈', '🏆'][i]}</div>
                      <div className="text-[10px] font-black uppercase text-slate-400">{lvl}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dicas Integradas na Meta */}
              <div className="space-y-6">
                <div className="px-4">
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Estratégia para Acelerar</h3>
                  <p className="text-slate-500 text-sm">Insights da IA baseados no seu progresso atual.</p>
                </div>
                <FinancialTips transactions={transactions} balance={stats.balance} goal={userGoal} />
              </div>
            </div>
          )}
        </div>
      </main>

      <MobileNav activePage={currentPage} onNavigate={setCurrentPage} />

      <button
        onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
        className="fixed bottom-20 right-6 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-emerald-500 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl hover:bg-emerald-600 transition-all active:scale-95 z-50 hover:rotate-90"
      >
        +
      </button>

      {isModalOpen && (
        <AddTransactionModal
          onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }}
          onAdd={handleAddTransaction}
          onUpdate={handleUpdateTransaction}
          initialData={editingTransaction}
        />
      )}
    </div>
  );
};

export default App;
