import { GoogleGenAI, Type } from '@google/genai';
import { type NewsAnalysis, type NewsHeadline, type NewsSentiment } from '../types';

// Mock news headlines for BTC
const mockHeadlines: NewsHeadline[] = [
  { title: "ETF de Bitcoin à vista registra entrada recorde de capital, impulsionando otimismo no mercado.", source: "CoinTelegraph" },
  { title: "Grande banco de investimento anuncia que oferecerá produtos de criptomoeda a seus clientes.", source: "Bloomberg Crypto" },
  { title: "Reguladores aprovam nova legislação que favorece a adoção de criptoativos como meio de pagamento.", source: "Financial Times" },
  { title: "Análise técnica aponta para 'cruz dourada' no gráfico diário do Bitcoin, sinalizando potencial de alta.", source: "TradingView News" },
  { title: "Baleia de Bitcoin move 10.000 BTC para exchange, aumentando pressão vendedora.", source: "Whale Alert" },
  { title: "Relatório de inflação dos EUA vem acima do esperado, gerando aversão ao risco em ativos como o Bitcoin.", source: "Reuters" },
  { title: "Hackers exploram vulnerabilidade em protocolo DeFi, roubando milhões em cripto e abalando confiança.", source: "The Block" },
  { title: "Presidente do FED sinaliza que taxas de juros podem subir mais que o previsto, impactando negativamente mercados de risco.", source: "Wall Street Journal" },
  { title: "Volume de negociação de Bitcoin cai para o nível mais baixo do ano, indicando indecisão do mercado.", source: "Glassnode Insights" },
  { title: "Bitcoin se mantém estável em faixa de preço estreita enquanto traders aguardam catalisador.", source: "CoinDesk" },
];

// Function to get a random subset of headlines
const getRandomHeadlines = (count: number): NewsHeadline[] => {
  const shuffled = [...mockHeadlines].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};


export const fetchAndAnalyzeNews = async (): Promise<NewsAnalysis> => {
  const headlinesToAnalyze = getRandomHeadlines(4); // Analyze 4 random headlines
  const headlineText = headlinesToAnalyze.map(h => `- ${h.title}`).join('\n');

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analise o sentimento das seguintes manchetes de notícias sobre criptomoedas. 
      Classifique o sentimento geral como 'Positive', 'Negative' ou 'Neutral'. 
      Forneça um resumo conciso de uma frase do sentimento das notícias.
      
      Manchetes:
      ${headlineText}
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallSentiment: {
              type: Type.STRING,
              description: "O sentimento geral das notícias. Deve ser 'Positive', 'Negative', ou 'Neutral'."
            },
            summary: {
              type: Type.STRING,
              description: "Um resumo conciso de uma frase do sentimento geral."
            }
          },
          required: ['overallSentiment', 'summary']
        }
      }
    });

    const jsonResponse = JSON.parse(response.text);

    return {
      headlines: headlinesToAnalyze,
      overallSentiment: jsonResponse.overallSentiment as NewsSentiment,
      summary: jsonResponse.summary,
    };
  } catch (error) {
    console.error("Erro ao analisar notícias com a Gemini API:", error);
    // Fallback in case of API error
    return {
      headlines: headlinesToAnalyze,
      overallSentiment: 'Neutral',
      summary: 'Não foi possível analisar o sentimento das notícias devido a um erro na API.',
    };
  }
};