import { SignalAction, type Signal } from '../types';

// --- Static Data ---
const buyReasons = [
  "RSI < 20 (sobrevendido)",
  "Preço toca a 5ª banda inferior do VWAP semanal",
  "Preço está acima da MM80",
  "Preço está acima do VWAP semanal",
];

const sellReasons = [
  "RSI > 90 (sobrecomprado)",
  "Preço toca a 5ª banda superior do VWAP semanal",
  "Preço está abaixo da MM80",
  "Preço está abaixo do VWAP semanal",
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
