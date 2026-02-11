import React from 'react';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
    const sizes = {
        sm: { icon: 32, text: 'text-lg' },
        md: { icon: 48, text: 'text-2xl' },
        lg: { icon: 64, text: 'text-4xl' }
    };

    const currentSize = sizes[size];

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Ícone do Logo Premium */}
            <div className="relative" style={{ width: currentSize.icon, height: currentSize.icon }}>
                {/* Camada de Brilho de Fundo */}
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-150 animate-pulse pointer-events-none"></div>

                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-xl"
                >
                    {/* Círculo Base com Gradiente Digital */}
                    <defs>
                        <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                        </linearGradient>

                        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="50%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>

                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Fundo do Chip */}
                    <rect
                        x="5" y="5" width="90" height="90"
                        rx="24"
                        fill="url(#circleGrad)"
                        className="opacity-90"
                    />

                    {/* Linhas de Circuito/Tech */}
                    <path
                        d="M20 35H35M65 35H80M20 65H35M65 65H80M50 20V35M50 65V80"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="opacity-20"
                    />

                    {/* Caractere $ Central */}
                    <text
                        x="50%"
                        y="52%"
                        dominantBaseline="middle"
                        textAnchor="middle"
                        fontSize="55"
                        fontWeight="900"
                        fill="url(#goldGrad)"
                        filter="url(#glow)"
                        style={{ fontFamily: 'sans-serif' }}
                    >
                        $
                    </text>

                    {/* Borda de Destaque */}
                    <rect
                        x="8" y="8" width="84" height="84"
                        rx="22"
                        stroke="white"
                        strokeWidth="1"
                        className="opacity-30"
                    />
                </svg>
            </div>

            {showText && (
                <div className="flex flex-col leading-none">
                    <h1 className={`${currentSize.text} font-black text-slate-800 dark:text-white tracking-tighter`}>
                        Meu Controle
                    </h1>
                    <div className="flex items-center gap-1">
                        <span className="text-emerald-500 font-black tracking-widest text-[0.6em] uppercase">
                            Financial Intelligence
                        </span>
                        <span className="bg-amber-500 text-white text-[0.5em] px-1.5 py-0.5 rounded-md font-black">
                            IA
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Logo;
