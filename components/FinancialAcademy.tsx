
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface GeneratedVideo {
  url: string;
  prompt: string;
  timestamp: number;
}

const FinancialAcademy: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const statusUpdates = [
    "Iniciando os motores da criatividade...",
    "Desenhando o seu futuro financeiro...",
    "Renderizando a abundância em 1080p...",
    "Quase pronto! A disciplina gera resultados...",
    "Finalizando os detalhes da sua visualização..."
  ];

  useEffect(() => {
    const saved = localStorage.getItem('rumo10k_ai_videos');
    if (saved) setGeneratedVideos(JSON.parse(saved));
  }, []);

  const saveVideo = (video: GeneratedVideo) => {
    const updated = [video, ...generatedVideos];
    setGeneratedVideos(updated);
    localStorage.setItem('rumo10k_ai_videos', JSON.stringify(updated));
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;

    try {
      setError(null);
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // Mitigate race condition: proceed immediately after triggering openSelectKey
      }

      setIsGenerating(true);
      let messageIdx = 0;
      const interval = setInterval(() => {
        setStatusMessage(statusUpdates[messageIdx % statusUpdates.length]);
        messageIdx++;
      }, 8000);

      // Create new GoogleGenAI instance right before making an API call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `Cinematic high quality visualization of financial success: ${videoPrompt}. Realistic, optimistic lighting, professional aesthetic.`,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        // Must append API key when fetching from the download link
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);
        
        saveVideo({
          url: videoUrl,
          prompt: videoPrompt,
          timestamp: Date.now()
        });
      }

      clearInterval(interval);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setError("Chave de API não configurada corretamente. Selecione uma chave paga.");
        // @ts-ignore
        await window.aistudio.openSelectKey();
      } else {
        setError("Ocorreu um erro ao gerar o vídeo. Tente novamente em alguns instantes.");
      }
    } finally {
      setIsGenerating(false);
      setVideoPrompt('');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Academia Rumo10k <span className="text-emerald-500">IA</span></h2>
        <p className="text-slate-500 dark:text-slate-400">Crie visualizações poderosas da sua jornada para os 10 mil reais.</p>
      </header>

      {/* Gerador de Vídeo Veo */}
      <section className="bg-gradient-to-br from-indigo-900 via-emerald-900 to-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none select-none">
          <span className="text-[200px] leading-none">🎬</span>
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            <span className="animate-pulse">✨</span> Powered by Veo 3.1
          </div>
          
          <h3 className="text-3xl font-bold mb-4">Gerador de Visualização</h3>
          <p className="text-emerald-100/70 mb-8 leading-relaxed">
            Como você imagina sua vida com R$ 10.000,00 investidos? Descreva abaixo e nossa IA criará um vídeo cinematográfico para motivar seus aportes.
          </p>

          <div className="space-y-4">
            <textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="Ex: Uma mesa de escritório moderna com sol entrando, um café e uma tela mostrando saldo de 10k..."
              className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/30 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[100px] resize-none transition-all"
              disabled={isGenerating}
            />
            
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <button
                onClick={handleGenerateVideo}
                disabled={isGenerating || !videoPrompt}
                className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                  isGenerating 
                    ? 'bg-slate-700 cursor-not-allowed' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Gerando conteúdo...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Criar Meu Vídeo
                  </>
                )}
              </button>
              <div className="text-[10px] text-white/40 max-w-[200px] leading-tight uppercase font-bold">
                *Requer chave de API paga do Google Cloud Project com faturamento ativo.
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="block mt-1 underline hover:text-white transition-colors">Mais sobre faturamento</a>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm font-bold flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}
        </div>

        {isGenerating && (
          <div className="mt-12 p-8 border border-white/10 rounded-3xl bg-black/20 backdrop-blur-xl animate-pulse text-center">
            <div className="text-4xl mb-4">🏗️</div>
            <h4 className="text-xl font-bold mb-2">{statusMessage}</h4>
            <p className="text-sm text-emerald-200/50 italic">A geração de vídeo com IA pode levar até 2 minutos.</p>
          </div>
        )}
      </section>

      {/* Galeria de Vídeos Gerados */}
      {generatedVideos.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200">Suas Visualizações</h4>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{generatedVideos.length} Vídeos</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {generatedVideos.map((video, idx) => (
              <div key={idx} className="group bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl transition-all hover:translate-y-[-4px]">
                <div className="aspect-video bg-black relative">
                  <video 
                    src={video.url} 
                    controls 
                    className="w-full h-full object-cover"
                    poster="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-emerald-500/90 backdrop-blur text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      Visualização IA
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-2 flex items-center gap-2">
                    <span>🗓️</span> {new Date(video.timestamp).toLocaleDateString('pt-BR')} às {new Date(video.timestamp).toLocaleTimeString('pt-BR')}
                  </p>
                  <h5 className="text-slate-800 dark:text-slate-100 font-bold text-lg line-clamp-2">
                    "{video.prompt}"
                  </h5>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Seção Educativa Estática */}
      <section className="bg-slate-100 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="text-6xl">💡</div>
          <div>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Por que visualizar sua meta?</h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-2xl">
              Estudos mostram que a visualização clara dos seus objetivos financeiros aumenta em 30% a chance de manter a disciplina. Use os vídeos gerados pela nossa IA para reforçar seu compromisso com os R$ 10.000,00 todos os dias.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FinancialAcademy;
