import React, { useState, useEffect } from 'react';
import { SignalAction, type Signal, type PivotPoints, type VwapBands, type NewsAnalysis, type HeikinAshiColor } from './types';
import { SignalCard } from './components/SignalCard';
import { CentAccountCalculatorCard } from './components/CentAccountCalculatorCard';
import { NewsSentimentCard } from './components/NewsSentimentCard';
import { updateAndGenerateSignal, calculateClassicPivotPoints, calculateRSI, calculateHeikinAshiColor } from './services/mockSignalService'; 
import { fetchAndAnalyzeNews } from './services/mockNewsService';
import { NextD1EntryCard } from './components/NextD1EntryCard';
import { BuyHoldAnalysisCard } from './components/BuyHoldAnalysisCard';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, PauseIcon } from './components/icons';
import { PivotAndOrdersCard } from './components/PivotAndOrdersCard'; // NEW: Import PivotAndOrdersCard


// --- PivotPointsCard Component and Helpers ---

const formattedPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Calculates the Volume-Weighted Average Price (VWAP) from a set of klines.
 */
const calculateVwap = (klines: any[]): number => {
    if (!klines || klines.length === 0) return 0;

    let cumulativeTPV = 0;
    let cumulativeVolume = 0;

    for (const kline of klines) {
        const h = parseFloat(kline[2]);
        const l = parseFloat(kline[3]);
        const c = parseFloat(kline[4]);
        const volume = parseFloat(kline[5]);
        const typicalPrice = (h + l + c) / 3;
        
        if (isNaN(typicalPrice) || isNaN(volume)) continue;

        cumulativeTPV += typicalPrice * volume;
        cumulativeVolume += volume;
    }

    return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : 0;
};

/**
 * Calculates VWAP and standard deviation bands from a set of klines.
 */
const calculateVwapAndBands = (klines: any[]): { vwap: number, bands: VwapBands } | null => {
    if (klines.length < 2) return null;

    let cumulativeTPV = 0;
    let cumulativeVolume = 0;
    const pricesForStdDev: number[] = [];

    for (const kline of klines) {
        const h = parseFloat(kline[2]);
        const l = parseFloat(kline[3]);
        const c = parseFloat(kline[4]);
        const volume = parseFloat(kline[5]);
        const typicalPrice = (h + l + c) / 3;
        if (isNaN(typicalPrice) || isNaN(volume)) continue;
        cumulativeTPV += typicalPrice * volume;
        cumulativeVolume += volume;
        pricesForStdDev.push(typicalPrice);
    }

    const vwap = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : 0;

    const mean = pricesForStdDev.reduce((a, b) => a + b, 0) / pricesForStdDev.length;
    const squaredDiffs = pricesForStdDev.map(price => Math.pow(price - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    const bands: VwapBands = {
        band1: { upper: vwap + (stdDev * 1), lower: vwap - (stdDev * 1) },
        band2: { upper: vwap + (stdDev * 2), lower: vwap - (stdDev * 2) },
        band3: { upper: vwap + (stdDev * 3), lower: vwap - (stdDev * 3) },
        band4: { upper: vwap + (stdDev * 4), lower: vwap - (stdDev * 4) },
        band5: { upper: vwap + (stdDev * 5), lower: vwap - (stdDev * 5) },
    };

    return { vwap, bands };
};


/**
 * Calculates the typical price (H+L+C)/3 from a single kline.
 */
const calculateTypicalPriceFromKline = (kline: any[]): number => {
    if (!kline || kline.length < 5) return 0;
    const h = parseFloat(kline[2]);
    const l = parseFloat(kline[3]);
    const c = parseFloat(kline[4]);
    if (isNaN(h) || isNaN(l) || isNaN(c)) return 0;
    return (h + l + c) / 3;
};


const PivotLevel: React.FC<{ 
    label: string, 
    value: number, 
    color: string, 
    highlight?: 'trigger' | 'touched' | 'target',
    currentPrice?: number; // New prop for central pivot direction
}> = ({ label, value, color, highlight, currentPrice }) => {
    
    const highlightStyles = {
        trigger: {
            wrapper: 'bg-cyan-500/10',
            label: 'text-cyan-300 font-bold',
            value: 'text-cyan-300 font-bold',
            badgeText: 'GATILHO',
            badgeClasses: 'bg-cyan-500 text-gray-900',
        },
        touched: {
            wrapper: 'bg-yellow-500/10',
            label: 'text-yellow-300 font-bold',
            value: 'text-yellow-300 font-bold',
            badgeText: 'TOCOU',
            badgeClasses: 'bg-yellow-500 text-gray-900',
        },
        target: {
            wrapper: 'bg-purple-500/10',
            label: 'text-purple-300 font-bold',
            value: 'text-purple-300 font-bold',
            badgeText: 'ALVO',
            badgeClasses: 'bg-purple-500 text-gray-900',
        }
    };

    const styles = highlight ? highlightStyles[highlight] : null;

    let directionIcon = null;
    let directionColor = '';

    if (label === 'P' && currentPrice !== undefined) {
        const priceDifference = currentPrice - value;
        const threshold = value * 0.0005; // 0.05% threshold for 'neutral'

        if (priceDifference > threshold) {
            directionIcon = <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" />;
            directionColor = 'text-green-400';
        } else if (priceDifference < -threshold) {
            directionIcon = <ArrowTrendingDownIcon className="h-4 w-4 text-red-400" />;
            directionColor = 'text-red-400';
        } else {
            directionIcon = <PauseIcon className="h-4 w-4 text-gray-400" />;
            directionColor = 'text-gray-400';
        }
    }


    return (
        <div className={`flex justify-between items-center py-1 text-sm rounded px-2 ${styles ? styles.wrapper : ''}`}>
            <div className="flex items-center gap-2">
                <span className={`font-semibold ${styles ? styles.label : color} ${directionColor}`}>{label}</span>
                {directionIcon}
                {styles && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${styles.badgeClasses}`}>
                        {styles.badgeText}
                    </span>
                )}
            </div>
            <span className={`font-mono ${styles ? styles.value : 'text-gray-300'} ${directionColor}`}>{formattedPrice(value)}</span>
        </div>
    );
};

interface PivotPointsCardProps {
  pivots: PivotPoints | null;
  signal: Signal | null;
  vwapBands: VwapBands | null;
  weeklyVwapBands: VwapBands | null;
  lastDailyHigh: number | null; // NEW: last daily high
  lastDailyLow: number | null;  // NEW: last daily low
}

const PivotPointsCard: React.FC<PivotPointsCardProps> = ({ pivots, signal, vwapBands, weeklyVwapBands, lastDailyHigh, lastDailyLow }) => {
  if (!pivots || !signal || !vwapBands || !weeklyVwapBands || lastDailyHigh === null || lastDailyLow === null) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 flex justify-center items-center h-full min-h-[420px]">
        <p className="text-gray-400">Calculando Níveis Chave...</p>
      </div>
    );
  }

  const { currentPrice } = signal;
  // const touchedThreshold = currentPrice * 0.0002; // REMOVED: No longer used for "touched today"


  const { r3, r2, r1, p, s1, s2, s3, 
    fiboRetBuy50, fiboRetBuy61, fiboRetBuy100, fiboRetBuy200,
    fiboRetSell50, fiboRetSell61, fiboRetSell100, fiboRetSell200,
    fiboExtBuy100, fiboExtBuy200, fiboExtSell100, fiboExtSell200
  } = pivots;

  // The findNextPivotTarget logic is now moved to PivotAnalysisCard for comprehensive analysis.
  // We keep the simple directional icon for 'P' in PivotLevel.

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
  
  const vwapBandLevels = [
    { label: '5ª Banda Sup. (Venda)', value: vwapBands.band5.upper, color: 'text-red-400' },
    { label: '4ª Banda Sup. (Venda)', value: vwapBands.band4.upper, color: 'text-red-400' },
    { label: '3ª Banda Sup. (Venda)', value: vwapBands.band3.upper, color: 'text-red-400' },
    { label: '2ª Banda Sup. (Venda)', value: vwapBands.band2.upper, color: 'text-red-400' },
    { label: '1ª Banda Sup. (Venda)', value: vwapBands.band1.upper, color: 'text-red-400' },
    { label: '1ª Banda Inf. (Compra)', value: vwapBands.band1.lower, color: 'text-green-400' },
    { label: '2ª Banda Inf. (Compra)', value: vwapBands.band2.lower, color: 'text-green-400' },
    { label: '3ª Banda Inf. (Compra)', value: vwapBands.band3.lower, color: 'text-green-400' },
    { label: '4ª Banda Inf. (Compra)', value: vwapBands.band4.lower, color: 'text-green-400' },
    { label: '5ª Banda Inf. (Compra)', value: vwapBands.band5.lower, color: 'text-green-400' },
  ].sort((a, b) => b.value - a.value);
  
  const weeklyVwapBandLevels = [
    { label: '5ª Banda Sem. Sup. (Venda)', value: weeklyVwapBands.band5.upper, color: 'text-red-400' },
    { label: '4ª Banda Sem. Sup. (Venda)', value: weeklyVwapBands.band4.upper, color: 'text-red-400' },
    { label: '3ª Banda Sem. Sup. (Venda)', value: weeklyVwapBands.band3.upper, color: 'text-red-400' },
    { label: '2ª Banda Sem. Sup. (Venda)', value: weeklyVwapBands.band2.upper, color: 'text-red-400' },
    { label: '1ª Banda Sem. Sup. (Venda)', value: weeklyVwapBands.band1.upper, color: 'text-red-400' },
    { label: '1ª Banda Sem. Inf. (Compra)', value: weeklyVwapBands.band1.lower, color: 'text-green-400' },
    { label: '2ª Banda Sem. Inf. (Compra)', value: weeklyVwapBands.band2.lower, color: 'text-green-400' },
    { label: '3ª Banda Sem. Inf. (Compra)', value: weeklyVwapBands.band3.lower, color: 'text-green-400' },
    { label: '4ª Banda Sem. Inf. (Compra)', value: weeklyVwapBands.band4.lower, color: 'text-green-400' },
    { label: '5ª Banda Sem. Inf. (Compra)', value: weeklyVwapBands.band5.lower, color: 'text-green-400' },
  ].sort((a, b) => b.value - a.value);

  const allLevels = [...pivotLevels, ...fiboRetracementLevels, ...fiboExtensionLevels, ...vwapBandLevels, ...weeklyVwapBandLevels];
  
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
          const isTouchedVwap = signal.touchedVwapBand?.label === level.label;
          const isTargetVwap = signal.vwapBandTarget?.label === level.label;
          const isTouchedFibo = signal.touchedFiboRetracement?.label === level.label;
          const isTargetFibo = signal.fiboRetracementTarget?.label === level.label;
          
          // NEW: Check if the level was touched during the last completed daily candle
          const isTouchedToday = lastDailyLow !== null && lastDailyHigh !== null && level.value >= lastDailyLow && level.value <= lastDailyHigh;

          let highlightType: 'trigger' | 'touched' | 'target' | undefined = undefined;

          if (isTrigger) {
              highlightType = 'trigger';
          } else if (isTouchedVwap || isTouchedFibo || isTouchedToday) { // Use isTouchedToday
              highlightType = 'touched';
          } else if (isTargetVwap || isTargetFibo) {
              highlightType = 'target';
          }
          
          return (
            <PivotLevel 
              key={level.label} 
              {...level} 
              highlight={highlightType} 
              currentPrice={level.label === 'P' ? currentPrice : undefined} // Pass currentPrice only for 'P'
            />
          );
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
      <h3 className="text-xl font-bold text-white mb-4">Níveis Chave Diários</h3>
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-6 lg:items-center">
        <div className="w-full lg:w-1/2 flex-shrink-0">
          <h4 className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Pivot Points (Diário)</h4>
          {renderLevelList(pivotLevels)}
           <h4 className="text-xs font-bold text-gray-400 mt-3 mb-1 uppercase tracking-wider">Retração Fibonacci (Diário)</h4>
          {renderLevelList(fiboRetracementLevels)}
          <h4 className="text-xs font-bold text-gray-400 mt-3 mb-1 uppercase tracking-wider">Extensão Fibonacci (Diário)</h4>
          {renderLevelList(fiboExtensionLevels)}
          <h4 className="text-xs font-bold text-gray-400 mt-3 mb-1 uppercase tracking-wider">Bandas VWAP (Diário)</h4>
          {renderLevelList(vwapBandLevels)}
           <h4 className="text-xs font-bold text-gray-400 mt-3 mb-1 uppercase tracking-wider">Bandas VWAP (Semanal)</h4>
          {renderLevelList(weeklyVwapBandLevels)}
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center mt-8 lg:mt-0 px-4 py-8">
          <div className="relative h-4 w-full bg-gray-700 rounded-full">
            {allLevels.map(level => {
              const isTrigger = signal.triggerLevel?.label === level.label;
              const isTouchedVwap = signal.touchedVwapBand?.label === level.label;
              const isTargetVwap = signal.vwapBandTarget?.label === level.label;
              const isTouchedFibo = signal.touchedFiboRetracement?.label === level.label;
              const isTargetFibo = signal.fiboRetracementTarget?.label === level.label;
              
              // NEW: Check if the level was touched during the last completed daily candle
              const isTouchedToday = lastDailyLow !== null && lastDailyHigh !== null && level.value >= lastDailyLow && level.value <= lastDailyHigh;


              let highlightColor = 'bg-gray-500';
              let isHighlighted = false;

              if (isTrigger) {
                  highlightColor = 'bg-cyan-400 shadow-lg shadow-cyan-500/50';
                  isHighlighted = true;
              } else if (isTouchedVwap || isTouchedFibo || isTouchedToday) { // Use isTouchedToday
                  highlightColor = 'bg-yellow-400 shadow-lg shadow-yellow-500/50';
                  isHighlighted = true;
              } else if (isTargetVwap || isTargetFibo) {
                  highlightColor = 'bg-purple-400 shadow-lg shadow-purple-500/50';
                  isHighlighted = true;
              }

              const height = isHighlighted ? 'h-8' : 'h-6';
              const top = isHighlighted ? '-8px' : '-4px';

              return (
                 <div
                    key={level.label}
                    className={`absolute w-0.5 ${height} ${highlightColor}`}
                    style={{ left: `${getPosition(level.value)}%`, top: top }}
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
                  className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-max p-2 rounded-md border bg-gray-900/60 backdrop-blur-sm shadow-xl"
                  style={{ borderColor: rangeLabelBorder.split('-')[1]}} // Extract color from rangeLabelBorder
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
    const [news, setNews] = useState<NewsAnalysis | null>(null);
    const [nextNewsUpdate, setNextNewsUpdate] = useState<Date | null>(null);
    const [pivots, setPivots] = useState<PivotPoints | null>(null);
    const [vwapBands, setVwapBands] = useState<VwapBands | null>(null);
    const [weeklyVwapBands, setWeeklyVwapBands] = useState<VwapBands | null>(null);
    const [previousVwaps, setPreviousVwaps] = useState<{ daily: number; weekly: number; monthly: number; } | null>(null);
    const [heikinAshiColor, setHeikinAshiColor] = useState<HeikinAshiColor | null>(null); 
    const [error, setError] = useState<string | null>(null);
    // NEW: States to hold daily high and low for PivotAndOrdersCard and PivotPointsCard
    const [lastDailyHigh, setLastDailyHigh] = useState<number | null>(null);
    const [lastDailyLow, setLastDailyLow] = useState<number | null>(null);


    const NEWS_UPDATE_INTERVAL_MS = 300000; // 5 minutes

    // Effect for fetching news less frequently
    useEffect(() => {
        const fetchNewsData = async () => {
            try {
                const analysis = await fetchAndAnalyzeNews();
                setNews(analysis);
            } catch (err) {
                console.error("Falha ao buscar e analisar notícias:", err);
                // Set a fallback state for news
                setNews({
                    headlines: [],
                    overallSentiment: 'Neutral',
                    summary: 'Não foi possível carregar o sentimento das notícias.',
                });
            } finally {
                setNextNewsUpdate(new Date(Date.now() + NEWS_UPDATE_INTERVAL_MS));
            }
        };

        fetchNewsData();
        const newsInterval = setInterval(fetchNewsData, NEWS_UPDATE_INTERVAL_MS);

        return () => clearInterval(newsInterval);
    }, []);

    // Effect for fetching price and generating signals, dependent on news
    useEffect(() => {
        const fetchPriceAndGenerateSignal = async () => {

            try {
                const [priceResponse, dailyKlineResponse, weeklyKlineResponse, monthlyKlineResponse, rsiKlineResponse] = await Promise.all([
                    fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
                    fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=80'), 
                    fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=80'),
                    fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1M&limit=24'),
                    fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=100'), 
                ]);

                if (!priceResponse.ok || !dailyKlineResponse.ok || !weeklyKlineResponse.ok || !monthlyKlineResponse.ok || !rsiKlineResponse.ok) {
                    throw new Error(`Erro ao buscar dados da API da Binance. Verifique a conexão e os endpoints.`);
                }
                
                const priceData = await priceResponse.json();
                const dailyKlineData = await dailyKlineResponse.json();
                const weeklyKlineData = await weeklyKlineResponse.json();
                const monthlyKlineData = await monthlyKlineResponse.json();
                const rsiKlineData = await rsiKlineResponse.json();
                
                const currentPrice = parseFloat(priceData.price);
                if (isNaN(currentPrice)) {
                    throw new Error('Formato de preço inválido recebido da API.');
                }
                
                // Get the last completed daily kline for pivot calculation
                const lastCompletedDailyKline = dailyKlineData[dailyKlineData.length - 2];
                if (!lastCompletedDailyKline) {
                    throw new Error('Não há dados diários suficientes para calcular Pivot Points.');
                }
                const dailyHigh = parseFloat(lastCompletedDailyKline[2]);
                const dailyLow = parseFloat(lastCompletedDailyKline[3]);
                const dailyClose = parseFloat(lastCompletedDailyKline[4]);

                if (isNaN(dailyHigh) || isNaN(dailyLow) || isNaN(dailyClose)) {
                    throw new Error('Formato de kline diária inválido recebido da API para cálculo de Pivot Points.');
                }

                // NEW: Set last daily high and low for PivotAndOrdersCard and PivotPointsCard
                setLastDailyHigh(dailyHigh);
                setLastDailyLow(dailyLow);
                
                const rsiCloses = rsiKlineData.map((k: any) => parseFloat(k[4]));
                const currentRsi = calculateRSI(rsiCloses);

                if (currentRsi === null) {
                    throw new Error('Não há dados suficientes para calcular o RSI diário.');
                }

                // Calculate pivots using the last completed daily kline
                const calculatedPivots = calculateClassicPivotPoints(dailyHigh, dailyLow, dailyClose);
                setPivots(calculatedPivots);
                
                const prevVwaps = {
                    daily: calculateTypicalPriceFromKline(dailyKlineData.length > 1 ? dailyKlineData[dailyKlineData.length - 2] : []),
                    weekly: calculateTypicalPriceFromKline(weeklyKlineData.length > 1 ? weeklyKlineData[weeklyKlineData.length - 2] : []),
                    monthly: calculateTypicalPriceFromKline(monthlyKlineData.length > 1 ? monthlyKlineData[monthlyKlineData.length - 2] : []),
                };
                setPreviousVwaps(prevVwaps);

                const dailyVwapData = calculateVwapAndBands(dailyKlineData);
                const weeklyVwapData = calculateVwapAndBands(weeklyKlineData);

                setVwapBands(dailyVwapData?.bands ?? null);
                setWeeklyVwapBands(weeklyVwapData?.bands ?? null);
                
                const vwap = {
                    daily: dailyVwapData?.vwap ?? 0,
                    weekly: weeklyVwapData?.vwap ?? 0,
                    monthly: calculateVwap(monthlyKlineData),
                };

                const haColor = calculateHeikinAshiColor(dailyKlineData);
                setHeikinAshiColor(haColor);
                
                const calculatedBands = dailyVwapData?.bands ?? null;
                const calculatedWeeklyBands = weeklyVwapData?.bands ?? null;
                
                if (calculatedPivots && vwap && calculatedBands && calculatedWeeklyBands && prevVwaps) {
                  setSignal(updateAndGenerateSignal(
                    currentPrice, 
                    currentRsi, 
                    dailyHigh, // NEW: Pass daily high
                    dailyLow,  // NEW: Pass daily low
                    dailyClose, // NEW: Pass daily close
                    vwap, 
                    calculatedBands, 
                    calculatedWeeklyBands, 
                    prevVwaps, 
                    news, 
                    haColor
                  ));
                }
                
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
        const interval = setInterval(fetchPriceAndGenerateSignal, 10000); // 10 seconds for price updates

        return () => clearInterval(interval);
    }, [news, error]); 

    return (
        <div className="min-h-screen bg-gray-900 bg-gradient-to-br from-gray-900 via-gray-900 to-slate-800 text-gray-200">
            <header className="py-6 text-center border-b border-gray-800">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                    <span className="text-cyan-400">BTC</span> Confluence Pro <span className="text-2xl sm:text-3xl lg:text-3xl text-gray-400 font-medium">(Modo Análise - Position Trader)</span>
                </h1>
                <p className="text-gray-400 mt-2 text-sm sm:text-base">Sinais de trading para BTC/USD baseados em confluência de indicadores.</p>
            </header>

            <main className="container mx-auto px-4">
                <Section title="Análise em Tempo Real">
                     <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {error ? (
                            <div className="bg-red-900/50 border border-red-500 text-red-300 p-6 rounded-xl shadow-lg text-center lg:col-span-3">
                              <h3 className="text-xl font-bold mb-2">Falha na Conexão</h3>
                              <p>Não foi possível obter os dados de preço mais recentes.</p>
                              <p className="text-sm text-red-400 mt-1">({error})</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col gap-8">
                                    <SignalCard signal={signal} />
                                    <BuyHoldAnalysisCard signal={signal} />
                                    <NextD1EntryCard signal={signal} />
                                    <NewsSentimentCard news={news} nextUpdateTime={nextNewsUpdate} />
                                </div>
                                <div className="lg:col-span-2 flex flex-col gap-8"> {/* Adjusted to allow gap */}
                                    {pivots && signal && vwapBands && weeklyVwapBands && (
                                        <PivotPointsCard 
                                            pivots={pivots} 
                                            signal={signal} 
                                            vwapBands={vwapBands} 
                                            weeklyVwapBands={weeklyVwapBands}
                                            lastDailyHigh={lastDailyHigh} // NEW: Pass lastDailyHigh
                                            lastDailyLow={lastDailyLow}   // NEW: Pass lastDailyLow
                                        />
                                    )}
                                    {pivots && signal && lastDailyHigh !== null && lastDailyLow !== null && ( 
                                        <PivotAndOrdersCard 
                                            pivots={pivots} 
                                            signal={signal} 
                                            lastDailyHigh={lastDailyHigh} 
                                            lastDailyLow={lastDailyLow} 
                                        /> 
                                    )}
                                </div>
                                <div className="lg:col-span-3">
                                    <CentAccountCalculatorCard signal={signal} />
                                </div>
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