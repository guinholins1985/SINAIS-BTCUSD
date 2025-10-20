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

// --- Static Data ---
const buyReasons = [
  "RSI < 20 indicando sobrevenda",
  "Preço próximo ao suporte S3 de Pivot Point",
  "Suporte encontrado na retração de Fibonacci (100%)",
  "Preço testando a 5ª banda inferior do VWAP semanal",
  "Confluência de VWAP Semanal com a Média Móvel de 80 períodos",
];

const sellReasons = [
  "RSI > 90 indicando sobrecompra",
  "Preço próximo à resistência R3 de Pivot Point",
  "Resistência na retração de Fibonacci (100%)",
  "Alvo potencial na extensão de Fibonacci (200%)",
  "Preço testando a 5ª banda superior do VWAP semanal",
];

const holdReasons = [
    "Mercado sem tendência definida.",
    "Indicadores em conflito.",
    "Baixa volatilidade.",
    "Aguardando confirmação de rompimento."
];

// --- Signal State ---
// This state persists across calls to simulate a continuous signal logic
let currentSignalAction = SignalAction.HOLD;
let signalDuration = 0; // Ticks (calls) until next signal change

const getRandomDuration = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Updates the internal signal state and generates a new signal object based on the provided live price.
 * @param currentPrice The live price of BTC/USD.
 * @returns A new Signal object.
 */
export const updateAndGenerateSignal = (currentPrice: number): Signal => {
  // Decrease duration and decide if it's time for a new signal
  if (signalDuration <= 0) {
    const lastAction = currentSignalAction;
    
    // Logic to enforce a HOLD period between BUY and SELL signals
    if (lastAction === SignalAction.BUY || lastAction === SignalAction.SELL) {
        currentSignalAction = SignalAction.HOLD;
        signalDuration = getRandomDuration(10, 20); // Hold for 10-20 update cycles
    } else { // If we were holding, pick a new trade direction
        const rand = Math.random();
        currentSignalAction = rand > 0.5 ? SignalAction.BUY : SignalAction.SELL;
        signalDuration = getRandomDuration(30, 60); // New signal lasts for 30-60 update cycles
    }
  }

  let reasons: string[];
  let entryRange;

  switch (currentSignalAction) {
    case SignalAction.BUY:
      reasons = buyReasons;
      // Entry range is now calculated based on the live price
      entryRange = { min: currentPrice * 0.998, max: currentPrice * 1.001 };
      break;
    case SignalAction.SELL:
      reasons = sellReasons;
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
  };
};
