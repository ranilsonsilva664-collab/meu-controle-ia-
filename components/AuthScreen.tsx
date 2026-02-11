
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import Logo from './Logo';

interface AuthScreenProps {
  onLogin: (user: { id: string; name: string }) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;
        if (data.user) {
          onLogin({ id: data.user.id, name: fullName });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (data.user) {
          onLogin({
            id: data.user.id,
            name: data.user.user_metadata.full_name || data.user.email?.split('@')[0] || 'Usuário'
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-600 flex flex-col items-center justify-center p-6 text-white">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex flex-col items-center gap-4 mb-8">
          <Logo size="lg" className="justify-center" />
          <p className="text-emerald-100 text-lg opacity-80">Suas finanças no controle certo.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-2xl text-slate-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="text-left">
                <label className="block text-sm font-bold text-slate-400 uppercase mb-1">Como podemos te chamar?</label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  required={isRegistering}
                />
              </div>
            )}

            <div className="text-left">
              <label className="block text-sm font-bold text-slate-400 uppercase mb-1">E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all"
                required
              />
            </div>

            <div className="text-left">
              <label className="block text-sm font-bold text-slate-400 uppercase mb-1">Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-500 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold text-xl shadow-lg shadow-emerald-100 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processando...' : (isRegistering ? 'Criar minha conta' : 'Entrar')}
            </button>
          </form>

          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="mt-6 text-emerald-600 font-bold hover:underline"
          >
            {isRegistering ? 'Já tenho uma conta? Entrar' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-8">
          <div className="flex flex-col items-center">
            <span className="text-3xl mb-1">📸</span>
            <span className="text-xs font-medium text-emerald-100 uppercase tracking-tighter">OCR IA</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl mb-1">🎯</span>
            <span className="text-xs font-medium text-emerald-100 uppercase tracking-tighter">Controle IA</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl mb-1">💡</span>
            <span className="text-xs font-medium text-emerald-100 uppercase tracking-tighter">Dicas IA</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
