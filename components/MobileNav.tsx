
import React from 'react';
import { AppState } from '../types';

interface MobileNavProps {
  activePage: AppState;
  onNavigate: (page: AppState) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activePage, onNavigate }) => {
  const menuItems: { id: AppState; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Início', icon: '🏠' },
    { id: 'mentor', label: 'Mentor', icon: '🧠' },
    { id: 'goals', label: 'Meta', icon: '🎯' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex justify-around items-center z-40 shadow-[0_-8px_20px_rgba(0,0,0,0.05)] transition-colors">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`flex flex-col items-center gap-1.5 p-2 transition-all ${
            activePage === item.id 
              ? 'text-emerald-500 scale-110' 
              : 'text-slate-400 dark:text-slate-600'
          }`}
        >
          <span className="text-xl">{item.icon}</span>
          <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
          {activePage === item.id && (
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></span>
          )}
        </button>
      ))}
    </nav>
  );
};

export default MobileNav;
