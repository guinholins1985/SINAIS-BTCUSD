import React, { useState, useEffect } from 'react';
import { SignalAction, type Signal, type PivotPoints } from './types';
import { SignalCard } from './components/SignalCard';
import { updateAndGenerateSignal, calculateClassicPivotPoints } from './services/mockSignalService';

// --- PivotPointsCard Component and Helpers ---

const formattedPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PivotLevel: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
  <div className="flex justify-between items-center py-1 text-sm">
    <span className={`font-semibold ${color}`}>{label}</span>
    <span className="font-mono text-gray-300">{formattedPrice(value)}</span>
  </div>
);

interface PivotPointsCardProps {
  pivots: PivotPoints | null;
  signal: Signal | null;
}

const PivotPointsCard: React.FC<PivotPointsCardProps> = ({ pivots, signal }) => {
  if (!pivots || !signal) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 flex justify-center items-center h-full min-h-[420px]">
        <p className="text-gray-400">Calculando Níveis Chave...</p>
      </div>
    );
  }

  const { currentPrice } = signal;

  const { r3, r2, r1, p, s1, s2, s3, 
    fiboRetBuy50, fiboRetBuy61, fiboRetBuy100, fiboRetBuy200,
    fiboRetSell50, fiboRetSell61, fiboRetSell100, fiboRetSell200,
    fiboExtBuy100, fiboExtBuy200, fiboExtSell100, fiboExtSell200
  } = pivots;

  const pivotLevels = [
    { label: 'R3', value: r3, color: 'text-red-500' },
    { label: 'R2', value: r2, color: 'text-red-400' },
    { label: 'R1', value: r1, color: 'text-red-300' },
    { label: 'P', value: p, color: 'text-yellow-400' },
    { label: 'S1', value: s1, color: 'text-green-300' },
    { label: 'S2', value: s2, color: 'text-green-400' },
    { label: 'S3', value: s3, color: 'text-green-500' },
  ].sort((a, b) => b.value - a.value);

  const fiboRetracementLevels = [
    { label: 'Ret. Venda 200%', value: fiboRetSell200, color: 'text-orange-500' },
    { label: 'Ret. Venda 100%', value: fiboRetSell100, color: 'text-orange-400' },
    { label: 'Ret. Venda 61.8%', value: fiboRetSell61, color: 'text-orange-400' },
    { label: 'Ret. Venda 50%', value: fiboRetSell50, color: 'text-orange-400' },
    { label: 'Ret. Compra 50%', value: fiboRetBuy50, color: 'text-blue-400' },
    { label: 'Ret. Compra 61.8%', value: fiboRetBuy61, color: 'text-blue-400' },
    { label: 'Ret. Compra 100%', value: fiboRetBuy100, color: 'text-blue-400' },
    { label: 'Ret. Compra 200%', value: fiboRetBuy200, color: 'text-blue-500' },
  ].sort((a, b) => b.value - a.value);

  const fiboExtensionLevels = [
    { label: 'Ext. Compra 200%', value: fiboExtBuy200, color: 'text-purple-500' },
    { label: 'Ext. Compra 100%', value: fiboExtBuy100, color: 'text-purple-400' },
    { label: 'Ext. Venda 100%', value: fiboExtSell100, color: 'text-purple-400' },
    { label: 'Ext. Venda 200%', value: fiboExtSell200, color: 'text-purple-500' },
  ].sort((a, b) => b.value - a.value);

  const allLevels = [...pivotLevels, ...fiboRetracementLevels, ...fiboExtensionLevels];
  
  const min = Math.min(...allLevels.map(l => l.value));
  const max = Math.max(...allLevels.map(l => l.value));
  const range = max - min;

  const getPosition = (value: number) => {
    if (range === 0) return 50;
    const position = ((max - value) / range) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const currentPricePosition = getPosition(currentPrice);

  // --- New Logic for Entry Range Visualization ---
  const entryRangeMinPosition = getPosition(signal.entryRange.min);
  const entryRangeMaxPosition = getPosition(signal.entryRange.max);
  const rangeHeight = entryRangeMinPosition - entryRangeMaxPosition;
  const rangeTop = entryRangeMaxPosition;
  
  const isBuySignal = signal.action === SignalAction.BUY;
  const rangeColorClasses = isBuySignal ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500';
  const rangeTextColor = isBuySignal ? 'text-green-300' : 'text-red-300';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">Níveis Chave de Preço (Diário)</h3>
      <div className="flex gap-6">
        <div className="w-1/2 flex-shrink-0">
          <h4 className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Pivot Points</h4>
          {pivotLevels.map(level => (
            <PivotLevel key={level.label} {...level} />
          ))}
           <h4 className="text-xs font-bold text-gray-400 mt-3 mb-1 uppercase tracking-wider">Retração Fibonacci</h4>
          {fiboRetracementLevels.map(level => (
             <PivotLevel key={level.label} {...level} />
          ))}
          <h4 className="text-xs font-bold text-gray-400 mt-3 mb-1 uppercase tracking-wider">Extensão Fibonacci</h4>
          {fiboExtensionLevels.map(level => (
             <PivotLevel key={level.label} {...level} />
          ))}
        </div>
        <div className="w-1/2 flex items-center justify-center">
          <div className="relative w-4 h-72 bg-gray-700 rounded-full">
            {allLevels.map(level => (
              <div
                key={level.label}
                className="absolute w-6 h-px bg-gray-500"
                style={{ top: `${getPosition(level.value)}%`, left: '-4px' }}
                title={`${level.label}: ${formattedPrice(level.value)}`}
              />
            ))}
            
            {signal.action !== SignalAction.HOLD && rangeHeight > 0.1 && (
                <div
                    className={`absolute w-full ${rangeColorClasses}`}
                    style={{
                        top: `${rangeTop}%`,
                        height: `${rangeHeight}%`,
                        borderLeftWidth: '2px',
                    }}
                    title={`Faixa de ${signal.action}: ${formattedPrice(signal.entryRange.min)} - ${formattedPrice(signal.entryRange.max)}`}
                >
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 text-right">
                        <p className={`text-xs font-semibold ${rangeTextColor}`}>
                          {isBuySignal ? 'Faixa de Compra' : 'Faixa de Venda'}
                        </p>
                        <p className={`text-xs font-mono -mt-1 ${rangeTextColor}`}>
                          {formattedPrice(signal.entryRange.max)}
                        </p>
                        <p className={`text-xs font-mono ${rangeTextColor}`}>
                          {formattedPrice(signal.entryRange.min)}
                        </p>
                    </div>
                </div>
            )}
            
            <div
              className="absolute w-full h-1 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50 z-10"
              style={{ top: `calc(${currentPricePosition}% - 2px)` }}
              title={`Preço Atual: ${formattedPrice(currentPrice)}`}
            >
               <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-gray-900 px-2 py-0.5 rounded border border-cyan-400">
                 <span className="text-cyan-400 text-xs font-bold font-mono whitespace-nowrap">{formattedPrice(currentPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main App Components ---

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="py-12 md:py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-white">{title}</h2>
        {children}
    </section>
);


const App: React.FC = () => {
    const [signal, setSignal] = useState<Signal | null>(null);
    const [pivots, setPivots] = useState<PivotPoints | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPriceAndGenerateSignal = async () => {
            try {
                const [priceResponse, klineResponse] = await Promise.all([
                    fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
                    fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=2')
                ]);

                if (!priceResponse.ok) {
                    throw new Error(`Erro ao buscar preço: ${priceResponse.statusText}`);
                }
                if (!klineResponse.ok) {
                    throw new Error(`Erro ao buscar klines: ${klineResponse.statusText}`);
                }

                const priceData = await priceResponse.json();
                const klineData = await klineResponse.json();
                
                const currentPrice = parseFloat(priceData.price);
                if (isNaN(currentPrice)) {
                    throw new Error('Formato de preço inválido recebido da API.');
                }
                
                const yesterdayKline = klineData[0];
                const high = parseFloat(yesterdayKline[2]);
                const low = parseFloat(yesterdayKline[3]);
                const close = parseFloat(yesterdayKline[4]);

                if (isNaN(high) || isNaN(low) || isNaN(close)) {
                    throw new Error('Formato de kline inválido recebido da API.');
                }

                const calculatedPivots = calculateClassicPivotPoints(high, low, close);
                setPivots(calculatedPivots);

                setSignal(updateAndGenerateSignal(currentPrice));
                if (error) setError(null);
            } catch (err) {
                console.error("Falha ao buscar dados ou gerar sinal:", err);
                if (err instanceof Error) {
                  setError(err.message);
                } else {
                  setError("Ocorreu um erro desconhecido.");
                }
            }
        };

        fetchPriceAndGenerateSignal();
        const interval = setInterval(fetchPriceAndGenerateSignal, 5000);

        return () => clearInterval(interval);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-900 bg-gradient-to-br from-gray-900 via-gray-900 to-slate-800 text-gray-200">
            <header className="py-6 text-center border-b border-gray-800">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                    <span className="text-cyan-400">BTC</span> Confluence Pro <span className="text-2xl md:text-3xl text-gray-400 font-medium">(Análise H1)</span>
                </h1>
                <p className="text-gray-400 mt-2">Sinais de trading para BTC/USD baseados em confluência de indicadores.</p>
            </header>

            <main className="container mx-auto px-4">
                <Section title="Análise em Tempo Real">
                     <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {error ? (
                            <div className="bg-red-900/50 border border-red-500 text-red-300 p-6 rounded-xl shadow-lg text-center lg:col-span-2">
                              <h3 className="text-xl font-bold mb-2">Falha na Conexão</h3>
                              <p>Não foi possível obter os dados de preço mais recentes.</p>
                              <p className="text-sm text-red-400 mt-1">({error})</p>
                            </div>
                        ) : (
                            <>
                                <SignalCard signal={signal} />
                                <PivotPointsCard pivots={pivots} signal={signal} />
                            </>
                        )}
                     </div>
                </Section>
            </main>

            <footer className="text-center py-8 border-t border-gray-800 mt-12">
                <p className="text-gray-500">&copy; {new Date().getFullYear()} BTC Confluence Pro. Todos os direitos reservados.</p>
                 <p className="text-xs text-gray-500 mt-2">
                    Fonte de dados: <a href="https://www.binance.com/en/binance-api" target="_blank" rel="noopener noreferrer" className="underline hover:text-cyan-400">Binance API</a>
                </p>
                <p className="text-xs text-gray-600 mt-2">Aviso: Investimentos em criptomoedas envolvem alto risco. Não nos responsabilizamos por perdas financeiras.</p>
            </footer>
        </div>
    );
};

export default App;
