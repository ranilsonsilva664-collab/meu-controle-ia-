
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, MentorFeedback, Tip } from "./types";

const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE" || apiKey.includes('...')) {
    throw new Error("Chave API do Gemini não configurada ou inválida no .env.local.");
  }
  return new GoogleGenAI({ apiKey });
};

const handleAIError = (err: any) => {
  console.error("AI Error:", err);
  if (err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
    throw new Error("LIMITE_EXCEDIDO: Você atingiu o limite de uso gratuito do Google por agora. Aguarde cerca de 1 minuto.");
  }
  if (err.message?.includes("503") || err.message?.includes("UNAVAILABLE")) {
    throw new Error("SERVICO_INSTAVEL: Os servidores do Google estão sobrecarregados. Tente novamente em alguns instantes.");
  }
  throw err;
};

export const processReceiptImage = async (base64Image: string): Promise<Partial<Transaction>> => {
  try {
    const ai = getAI();
    const model = "gemini-3-flash-preview";
    const response = await ai.models.generateContent({
      model,
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Analise este comprovante brasileiro e extraia: descrição, estabelecimento (vendor), valor total (amount), data (YYYY-MM-DD), categoria e tipo (INCOME/EXPENSE)." },
        ],
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            vendor: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            category: { type: Type.STRING },
            type: { type: Type.STRING },
          },
          required: ["description", "amount", "category", "type", "date"]
        },
      },
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    return {
      ...data,
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    };
  } catch (err) {
    return handleAIError(err);
  }
};

export const getMentorMentorship = async (transactions: Transaction[], balance: number, userName: string, goal: number = 100000): Promise<MentorFeedback> => {
  try {
    const ai = getAI();
    const model = "gemini-3-flash-preview";
    const prompt = `
      Você é o Mentor Financeiro. Seu tom é motivador, inteligente e focado em estratégia de longo prazo.
      Usuário: ${userName}
      Saldo Atual: R$ ${balance.toFixed(2)}
      Meta Global: R$ ${goal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      Histórico Recente: ${JSON.stringify(transactions.slice(0, 10))}
      
      Analise o comportamento e forneça:
      1. Estágio (iniciante se balance < ${goal * 0.05}, poupador < ${goal * 0.25}, investidor < ${goal * 0.75}, mestre >= ${goal})
      2. Uma mensagem curta sobre o progresso rumo à meta de R$ ${goal.toLocaleString('pt-BR')}.
      3. Um desafio prático para a semana.
      4. 3 Insights baseados em gastos reais ou comportamento financeiro.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stage: { type: Type.STRING },
            message: { type: Type.STRING },
            challenge: { type: Type.STRING },
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  detail: { type: Type.STRING },
                  impact: { type: Type.STRING }
                }
              }
            }
          },
          required: ["stage", "message", "challenge", "insights"]
        }
      }
    });

    return JSON.parse(response.text?.trim() || "{}");
  } catch (err) {
    return handleAIError(err);
  }
};

export const simulateDecision = async (query: string, balance: number, goal: number = 100000): Promise<{ text: string; sources?: any[] }> => {
  try {
    const ai = getAI();
    const model = "gemini-3-flash-preview";
    const prompt = `Você é o Oráculo Financeiro do projeto Rumo à Meta. O usuário perguntou: "${query}". 
    O saldo atual dele é R$ ${balance.toFixed(2)} e a meta dele é chegar em R$ ${goal.toLocaleString('pt-BR')}. 
    
    Sua missão é:
    1. Responder com dados do mercado brasileiro (Selic, Inflação). 
    2. Se for uma dúvida de compra, analise o custo de oportunidade (quanto esse dinheiro valeria em 1 ano investido).
    3. Se for uma dúvida conceitual, explique de forma simples mas profunda.
    4. Conecte sempre a resposta ao objetivo final de chegar na meta dele.
    5. Use um tom encorajador, educado e altamente inteligente.`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    return {
      text: response.text || "O Mentor não conseguiu formular um parecer agora.",
      sources: []
    };
  } catch (err) {
    return handleAIError(err);
  }
};

export const generateFinancialTips = async (transactions: Transaction[], balance: number, goal: number = 100000): Promise<Tip[]> => {
  try {
    const ai = getAI();
    const model = "gemini-3-flash-preview";
    const prompt = `Analise estas transações: ${JSON.stringify(transactions.slice(0, 10))} e saldo de R$ ${balance.toFixed(2)}. 
    A meta do usuário é chegar em R$ ${goal.toLocaleString('pt-BR')}.
    Forneça 3 dicas práticas para acelerar a chegada a essa meta. 
    Foque em cortes de gastos supérfluos, otimização de aportes e mentalidade.`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              severity: { type: Type.STRING },
            },
            required: ["title", "content", "severity"]
          }
        }
      }
    });

    return JSON.parse(response.text?.trim() || "[]");
  } catch (err) {
    return handleAIError(err);
  }
};
