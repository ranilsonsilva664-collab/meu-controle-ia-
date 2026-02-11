
import React from 'react';
import { AppState } from '../types';
import Logo from './Logo';

interface SidebarProps {
  activePage: AppState;
  onNavigate: (page: AppState) => void;
  onLogout: () => void;
  userName: string;
  avatarUrl?: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

import { supabase } from '../supabaseClient';

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, onLogout, userName, avatarUrl, isDarkMode, onToggleTheme }) => {
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const menuItems: { id: AppState; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'transactions', label: 'Finanças', icon: '💸' },
    { id: 'mentor', label: 'Mentor IA', icon: '🧠' },
    { id: 'goals', label: 'Minha Meta', icon: '🎯' },
  ];

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      // A mudança de estado no App.tsx será disparada pelo onAuthStateChange
    } catch (error: any) {
      alert('Erro ao carregar avatar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-8 transition-colors">
      <div className="mb-12">
        <Logo size="md" />
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-black uppercase">Inteligência Ativa</span>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activePage === item.id
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-none'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-6 pt-8 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all"
        >
          <span>{isDarkMode ? 'Modo Luz' : 'Modo Noite'}</span>
          <span>{isDarkMode ? '🌞' : '🌙'}</span>
        </button>

        <div className="flex items-center gap-4 px-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={handleAvatarClick}
            disabled={uploading}
            className="relative group active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md overflow-hidden border-2 border-transparent group-hover:border-emerald-400">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                userName ? userName[0].toUpperCase() : 'U'
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-full shadow-sm flex items-center justify-center text-[10px] border border-slate-100 dark:border-slate-800 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              📷
            </div>
          </button>
          <div className="overflow-hidden">
            <p className="text-sm font-black truncate dark:text-slate-200">{userName}</p>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Mentor Ativado</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full text-center py-4 text-xs font-black text-red-500 bg-red-50 dark:bg-red-950/20 rounded-2xl hover:bg-red-100 transition-colors uppercase tracking-widest"
        >
          Sair da Jornada
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
