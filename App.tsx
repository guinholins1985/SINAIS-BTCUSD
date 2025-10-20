
import React, { useState, useEffect } from 'react';
import { SignalAction, type Signal, type PivotPoints } from './types';
import { SignalCard } from './components/SignalCard';
import { updateAndGenerateSignal, calculateClassicPivotPoints } from './services/mockSignalService';

// --- PivotPointsCard Component and Helpers ---

const formattedPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PivotLevel: React.FC<{ label: string, value: number, color: string, isHighlighted?: boolean }> = ({ label, value, color, isHighlighted }) => (
  <div className={`flex justify-between items-center py-1 text-sm rounded px-2 ${isHighlighted ? 'bg-cyan-500/10' : ''}`}>
    <span className={`font-semibold ${isHighlighted ? 'text-cyan-300 font-bold' : color}`}>{label}</span>
    <span className={`font-mono ${isHighlighted ? 'text-cyan-300 font-bold' : 'text-gray-300'}`}>{formattedPrice(value)}</span>
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
    const position = ((value - min) / range) * 100;
    return Math.max(0, Math.min(100, position));
  };
  
  const renderLevelList = (levels: {label: string, value: number, color: string}[]) => {
      return levels.map(level => {
          const isTrigger = signal.triggerLevel?.label === level.label;
          return <PivotLevel key={level.label} {...level} isHighlighted={isTrigger} />;
      });
  };

  const currentPricePosition = getPosition(currentPrice);

  const entryRangeMinPosition = getPosition(signal.entryRange.min);
  const entryRangeMaxPosition = getPosition(signal.entryRange.max);
  const rangeLeft = entryRangeMinPosition;
  const rangeWidth = entryRangeMaxPosition - entryRangeMinPosition;
  
  const isBuySignal = signal.action === SignalAction.BUY;
  const rangeGradientClasses = isBuySignal 
    ? 'bg-gradient-to-r from-green-500/25 to-green-500/5' 
    : 'bg-gradient-to-r from-red-500/25 to-red-500/5';
  const rangeBorderClasses = isBuySignal ? 'bg-green-500' : 'bg-red-500';
  const rangeTextColor = isBuySignal ? 'text-green-300' : 'text-red-300';
  const rangeLabelBorder = isBuySignal ? 'border-green-500/30' : 'border-red-500/30';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">Níveis Chave de Preço (Diário)</h3>
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-6 lg:items-center">
        <div className="w-full lg:w-1/2 flex-shrink-0">
          <h4 className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Pivot Points</h4>
          {renderLevelList(pivotLevels)}
           <h4 className="text-xs font-bold text-gray-400 mt-3 mb-1 uppercase tracking-wider">Retração Fibonacci</h4>
          {renderLevelList(fiboRetracementLevels)}
          <h4 className="text-xs font-bold text-gray-400 mt-3 mb-1 uppercase tracking-wider">Extensão Fibonacci</h4>
          {renderLevelList(fiboExtensionLevels)}
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center mt-8 lg:mt-0 px-4 py-8">
          <div className="relative h-4 w-full bg-gray-700 rounded-full">
            {allLevels.map(level => {
              const isTrigger = signal.triggerLevel?.label === level.label;
              return (
                 <div
                    key={level.label}
                    className={`absolute ${isTrigger ? 'h-8 w-0.5 bg-cyan-400 shadow-lg shadow-cyan-500/50' : 'h-6 w-px bg-gray-500'}`}
                    style={{ left: `${getPosition(level.value)}%`, top: isTrigger ? '-8px' : '-4px' }}
                    title={`${level.label}: ${formattedPrice(level.value)}`}
                  />
              );
            })}
            
            {signal.action !== SignalAction.HOLD && rangeWidth > 0.1 && (
              <div
                className="absolute h-full"
                style={{ left: `${rangeLeft}%`, width: `${rangeWidth}%` }}
                title={`Faixa de ${signal.action}: ${formattedPrice(signal.entryRange.min)} - ${formattedPrice(signal.entryRange.max)}`}
              >
                <div className={`absolute inset-0 ${rangeGradientClasses}`}></div>
                <div className={`absolute left-0 right-0 top-0 h-px ${rangeBorderClasses} opacity-60`}></div>
                <div className={`absolute left-0 right-0 bottom-0 h-px ${rangeBorderClasses} opacity-60`}></div>

                <div 
                  className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 w-max p-2 rounded-md border ${rangeLabelBorder} bg-gray-900/60 backdrop-blur-sm shadow-xl`}
                >
                  <p className={`text-xs font-semibold ${rangeTextColor} mb-1 text-center uppercase tracking-wider`}>
                    {isBuySignal ? 'Zona de Compra' : 'Zona de Venda'}
                  </p>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-xs font-mono font-bold text-white">{formattedPrice(signal.entryRange.min)}</span>
                    <span className="text-gray-500 text-xs">a</span>
                    <span className="text-xs font-mono font-bold text-white">{formattedPrice(signal.entryRange.max)}</span>
                  </div>
                </div>
                
                <div 
                  className="absolute h-4 w-px top-full left-1/2 -translate-x-1/2"
                  style={{ background: isBuySignal ? 'rgba(74, 222, 128, 0.4)' : 'rgba(248, 113, 113, 0.4)'}}
                ></div>
              </div>
            )}
            
            <div
              className="absolute h-full w-1 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50 z-10"
              style={{ left: `calc(${currentPricePosition}% - 2px)` }}
              title={`Preço Atual: ${formattedPrice(currentPrice)}`}
            >
               <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gray-900 px-2 py-0.5 rounded border border-cyan-400">
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
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 text-white">{title}</h2>
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

                setSignal(updateAndGenerateSignal(currentPrice, calculatedPivots));
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
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                    <span className="text-cyan-400">BTC</span> Confluence Pro <span className="text-2xl sm:text-3xl lg:text-3xl text-gray-400 font-medium">(Análise H1)</span>
                </h1>
                <p className="text-gray-400 mt-2 text-sm sm:text-base">Sinais de trading para BTC/USD baseados em confluência de indicadores.</p>
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