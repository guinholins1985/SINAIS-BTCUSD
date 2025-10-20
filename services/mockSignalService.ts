import { SignalAction, type Signal, type PivotPoints } from '../types';

// --- Pivot Point Calculation ---
export const calculateClassicPivotPoints = (high: number, low: number, close: number): PivotPoints => {
  const p = (high + low + close) / 3;
  const range = high - low;

  // Classic Pivots
  const r1 = (p * 2) - low;
  const s1 = (p * 2) - high;
  const r2 = p + range;
  const s2 = p - range;
  const r3 = high + 2 * (p - low);
  const s3 = low - 2 * (high - p);
  
  // Fibonacci Retracements
  const fiboRetBuy50 = high - (range * 0.5);
  const fiboRetBuy61 = high - (range * 0.618);
  const fiboRetBuy100 = high - (range * 1.0);
  const fiboRetBuy200 = high - (range * 2.0);
  const fiboRetSell50 = low + (range * 0.5);
  const fiboRetSell61 = low + (range * 0.618);
  const fiboRetSell100 = low + (range * 1.0);
  const fiboRetSell200 = low + (range * 2.0);

  // Fibonacci Extensions
  const fiboExtBuy100 = high + range;
  const fiboExtBuy200 = high + (range * 2);
  const fiboExtSell100 = low - range;
  const fiboExtSell200 = low - (range * 2);

  return { 
    p, r1, s1, r2, s2, r3, s3,
    fiboRetBuy50, fiboRetBuy61, fiboRetBuy100, fiboRetBuy200,
    fiboRetSell50, fiboRetSell61, fiboRetSell100, fiboRetSell200,
    fiboExtBuy100, fiboExtBuy200, fiboExtSell100, fiboExtSell200
  };
};

const formattedPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });


// --- Static Data ---
const baseBuyReasons = [
  "RSI < 20 indicando sobrevenda",
  "Preço testando a 5ª banda inferior do VWAP semanal",
  "Confluência de VWAP Semanal com a Média Móvel de 80 períodos",
];

const baseSellReasons = [
  "RSI > 90 indicando sobrecompra",
  "Preço testando a 5ª banda superior do VWAP semanal",
  "Alvo potencial na extensão de Fibonacci (200%)",
];

const holdReasons = [
    "Mercado sem tendência definida.",
    "Indicadores em conflito.",
    "Baixa volatilidade.",
    "Aguardando confirmação de rompimento."
];

// --- Signal State ---
let currentSignalAction = SignalAction.HOLD;
let signalDuration = 0; 

const getRandomDuration = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;


const findClosestLevel = (price: number, levels: { label: string; value: number }[], type: 'support' | 'resistance') => {
  if (!levels || levels.length === 0) return null;

  return levels
    .map(level => ({
      ...level,
      distance: type === 'support' ? price - level.value : level.value - price
    }))
    .filter(level => level.distance >= 0) // Only consider levels that have been "touched" or "passed"
    .sort((a, b) => a.distance - b.distance)[0]; // Find the one with the smallest distance
};


/**
 * Updates the internal signal state and generates a new signal object based on the provided live price and pivot points.
 * @param currentPrice The live price of BTC/USD.
 * @param pivots The calculated pivot points and fibonacci levels.
 * @returns A new Signal object.
 */
export const updateAndGenerateSignal = (currentPrice: number, pivots: PivotPoints): Signal => {
  if (signalDuration <= 0) {
    const lastAction = currentSignalAction;
    
    if (lastAction === SignalAction.BUY || lastAction === SignalAction.SELL) {
        currentSignalAction = SignalAction.HOLD;
        signalDuration = getRandomDuration(10, 20); 
    } else { 
        const rand = Math.random();
        currentSignalAction = rand > 0.5 ? SignalAction.BUY : SignalAction.SELL;
        signalDuration = getRandomDuration(30, 60); 
    }
  }

  let reasons: string[];
  let entryRange;
  let triggerLevel: { label: string; value: number } | undefined = undefined;

  switch (currentSignalAction) {
    case SignalAction.BUY:
      const supportLevels = [
        { label: 'S1', value: pivots.s1 }, { label: 'S2', value: pivots.s2 }, { label: 'S3', value: pivots.s3 },
        { label: 'Ret. Compra 50%', value: pivots.fiboRetBuy50 },
        { label: 'Ret. Compra 61.8%', value: pivots.fiboRetBuy61 },
        { label: 'Ret. Compra 100%', value: pivots.fiboRetBuy100 },
      ];
      const closestSupport = findClosestLevel(currentPrice, supportLevels, 'support');
      
      reasons = [...baseBuyReasons];
      if (closestSupport) {
        reasons.unshift(`Preço próximo ao ${closestSupport.label} (${formattedPrice(closestSupport.value)})`);
        triggerLevel = closestSupport;
      }
      
      entryRange = { min: currentPrice * 0.998, max: currentPrice * 1.001 };
      break;

    case SignalAction.SELL:
      const resistanceLevels = [
        { label: 'R1', value: pivots.r1 }, { label: 'R2', value: pivots.r2 }, { label: 'R3', value: pivots.r3 },
        { label: 'Ret. Venda 50%', value: pivots.fiboRetSell50 },
        { label: 'Ret. Venda 61.8%', value: pivots.fiboRetSell61 },
        { label: 'Ret. Venda 100%', value: pivots.fiboRetSell100 },
      ];
       const closestResistance = findClosestLevel(currentPrice, resistanceLevels, 'resistance');

      reasons = [...baseSellReasons];
      if (closestResistance) {
        reasons.unshift(`Preço próximo à ${closestResistance.label} (${formattedPrice(closestResistance.value)})`);
        triggerLevel = closestResistance;
      }

      entryRange = { min: currentPrice * 0.999, max: currentPrice * 1.002 };
      break;

    default: // HOLD
      reasons = holdReasons;
      entryRange = { min: currentPrice, max: currentPrice };
      break;
  }

  const stopLoss = currentSignalAction === SignalAction.BUY ? entryRange.min * 0.985 : entryRange.max * 1.015;
  const takeProfit = currentSignalAction === SignalAction.BUY ? entryRange.max * 1.03 : entryRange.min * 0.97;
  
  signalDuration--;

  return {
    action: currentSignalAction,
    currentPrice,
    timestamp: new Date(),
    reasons,
    stopLoss,
    takeProfit,
    entryRange,
    triggerLevel,
  };
};