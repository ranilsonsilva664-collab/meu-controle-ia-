
import React, { useState, useRef, useEffect } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { processReceiptImage } from '../geminiService';

interface AddTransactionModalProps {
  onClose: () => void;
  onAdd: (transaction: Transaction) => void;
  onUpdate: (transaction: Transaction) => void;
  initialData?: Transaction | null;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ onClose, onAdd, onUpdate, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'scan' | 'manual'>(initialData ? 'manual' : 'scan');
  
  // Manual Form State
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Category>(Category.MARKET);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setVendor(initialData.vendor || '');
      setAmount(initialData.amount.toString());
      setDate(new Date(initialData.date).toISOString().split('T')[0]);
      setCategory(initialData.category);
      setType(initialData.type);
      setMode('manual');
    }
  }, [initialData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        const result = await processReceiptImage(base64String);
        if (result) {
          const normalizedAmount = Number(result.amount) || 0;
          const normalizedType = result.type?.toUpperCase() === 'INCOME' 
            ? TransactionType.INCOME 
            : TransactionType.EXPENSE;
          
          onAdd({
            id: Date.now().toString(),
            description: result.description || 'Gasto sem nome',
            vendor: result.vendor || '',
            amount: normalizedAmount,
            category: (result.category as Category) || Category.OTHERS,
            type: normalizedType,
            date: result.date || new Date().toISOString(),
          });
          onClose();
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao processar imagem');
        setMode('manual');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    // Normalização robusta: troca vírgula por ponto e converte para número
    const cleanAmount = amount.replace(',', '.');
    const numericAmount = Number(parseFloat(cleanAmount).toFixed(2));

    if (isNaN(numericAmount)) {
      setError('Por favor, insira um valor numérico válido.');
      return;
    }

    const transactionData: Transaction = {
      id: initialData?.id || Date.now().toString(),
      description,
      vendor,
      amount: numericAmount,
      category,
      type,
      date: new Date(date).toISOString(),
    };

    if (initialData) {
      onUpdate(transactionData);
    } else {
      onAdd(transactionData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors">
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {initialData ? 'Editar Transação' : 'Nova Transação'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">✕</button>
        </div>

        <div className="p-6">
          {!initialData && (
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
              <button 
                onClick={() => setMode('scan')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'scan' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                📷 Escanear
              </button>
              <button 
                onClick={() => setMode('manual')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'manual' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                ✍️ Manual
              </button>
            </div>
          )}

          {mode === 'scan' ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-2xl p-8 text-center">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                />
                {loading ? (
                  <div className="space-y-3">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-emerald-700 dark:text-emerald-400 font-bold">A IA está lendo o recibo...</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500">Isso pode levar alguns segundos.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-5xl">📄</div>
                    <div>
                      <p className="text-emerald-900 dark:text-emerald-300 font-bold">Enviar Comprovante</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm">A IA extrairá valor, data e vendedor</p>
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none w-full active:scale-95 transition-transform"
                    >
                      Selecionar Arquivo
                    </button>
                  </div>
                )}
              </div>
              {error && <p className="text-red-500 text-center text-sm font-medium">{error}</p>}
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none bg-white"
                  >
                    <option value={TransactionType.EXPENSE}>Despesa</option>
                    <option value={TransactionType.INCOME}>Receita</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vendedor</label>
                <input 
                  type="text" 
                  placeholder="Ex: Starbucks"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição</label>
                <input 
                  type="text" 
                  placeholder="Ex: Café da manhã"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Valor (R$)</label>
                  <input 
                    type="text" 
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Categoria</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
                  >
                    {Object.values(Category).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-100 dark:shadow-none transition-all mt-4"
              >
                {initialData ? 'Salvar Alterações' : 'Salvar Transação'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;
