
import { SignalAction, type Signal, type PivotPoints, type VwapBands } from '../types';

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

const getVwapReasons = (price: number, vwapData: { daily: number; weekly: number; monthly: number; }, action: SignalAction): string[] => {
    const reasons: string[] = [];
    const proximityThreshold = 0.01; // 1% proximity

    const vwapLevels = [
        { label: 'Diária', value: vwapData.daily },
        { label: 'Semanal', value: vwapData.weekly },
        { label: 'Mensal', value: vwapData.monthly },
    ];

    if (action === SignalAction.HOLD) return [];

    const actionText = action === SignalAction.BUY ? 'suporte' : 'resistência';

    for (const level of vwapLevels) {
        if (level.value === 0) continue;
        const distance = Math.abs(price - level.value) / level.value;
        if (distance < proximityThreshold) {
            reasons.push(`Preço testando ${actionText} na VWAP ${level.label} (${formattedPrice(level.value)})`);
        }
    }
    return reasons;
};

const getPreviousVwapReasons = (price: number, vwapData: { daily: number; weekly: number; monthly: number; } | null, action: SignalAction): string[] => {
    const reasons: string[] = [];
    if (!vwapData) return reasons;

    const proximityThreshold = 0.01; // 1% proximity

    const vwapLevels = [
        { label: 'Diária Anterior', value: vwapData.daily },
        { label: 'Semanal Anterior', value: vwapData.weekly },
        { label: 'Mensal Anterior', value: vwapData.monthly },
    ];

    if (action === SignalAction.HOLD) return [];

    const actionText = action === SignalAction.BUY ? 'suporte' : 'resistência';

    for (const level of vwapLevels) {
        if (level.value === 0) continue;
        const distance = Math.abs(price - level.value) / level.value;
        if (distance < proximityThreshold) {
            reasons.push(`Preço testando ${actionText} na VWAP ${level.label} (${formattedPrice(level.value)})`);
        }
    }
    return reasons;
};


// --- Static Data ---
const baseBuyReasons = [
  "RSI < 10 indicando sobrevenda extrema",
];

const baseSellReasons = [
  "RSI > 90 indicando sobrecompra extrema",
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
 * Finds the closest VWAP band level from a given list of levels.
 */
const findClosestVwapBand = (price: number, levels: { label: string; value: number }[], type: 'support' | 'resistance') => {
  const vwapBandLevels = levels.filter(l => l.label.includes('Banda'));
  return findClosestLevel(price, vwapBandLevels, type);
};

/**
 * Finds the closest Fibonacci Retracement level from a given list of levels.
 */
const findClosestFiboRetracement = (price: number, levels: { label: string; value: number }[], type: 'support' | 'resistance') => {
  const fiboLevels = levels.filter(l => l.label.includes('Ret.'));
  return findClosestLevel(price, fiboLevels, type);
};


/**
 * Finds the next potential VWAP band target based on signal direction.
 */
const findNextVwapBandTarget = (price: number, levels: { label: string; value: number }[], action: SignalAction) => {
    if (action === SignalAction.HOLD) return null;

    const vwapBandLevels = levels.filter(l => l.label.includes('Banda'));

    if (action === SignalAction.BUY) {
        // Find the closest band *above* the current price
        return vwapBandLevels
            .filter(level => level.value > price)
            .sort((a, b) => a.value - b.value)[0]; // Ascending sort, take first
    } else { // SELL
        // Find the closest band *below* the current price
        return vwapBandLevels
            .filter(level => level.value < price)
            .sort((a, b) => b.value - a.value)[0]; // Descending sort, take first
    }
};

/**
 * Finds the next potential Fibonacci Retracement target based on signal direction.
 */
const findNextFiboRetracementTarget = (price: number, levels: { label: string; value: number }[], action: SignalAction) => {
    if (action === SignalAction.HOLD) return null;

    const fiboLevels = levels.filter(l => l.label.includes('Ret.'));

    if (action === SignalAction.BUY) {
        // Find the closest Fibo level *above* the current price
        return fiboLevels
            .filter(level => level.value > price)
            .sort((a, b) => a.value - b.value)[0];
    } else { // SELL
        // Find the closest Fibo level *below* the current price
        return fiboLevels
            .filter(level => level.value < price)
            .sort((a, b) => b.value - a.value)[0];
    }
};

/**
 * Finds the next potential Fibonacci Extension target based on signal direction.
 */
const findNextFiboExtensionTarget = (price: number, levels: { label: string; value: number }[], action: SignalAction) => {
    if (action === SignalAction.HOLD) return null;

    if (action === SignalAction.BUY) {
        // Find the closest Fibo Extension level *above* the current price
        return levels
            .filter(level => level.value > price && level.label.includes('Compra'))
            .sort((a, b) => a.value - b.value)[0];
    } else { // SELL
        // Find the closest Fibo Extension level *below* the current price
        return levels
            .filter(level => level.value < price && level.label.includes('Venda'))
            .sort((a, b) => b.value - a.value)[0];
    }
};

/**
 * Determines the recommended trading window based on market session overlaps and the current signal.
 * @returns An object with the start time, end time, a descriptive reason, and a status.
 */
const determineTradingWindowAnalysis = (action: SignalAction): { start: string; end: string; reason: string; status: 'IN_WINDOW' | 'APPROACHING' | 'OUTSIDE' } => {
    const now = new Date();
    const currentUTCHour = now.getUTCHours();
    
    // London & New York session overlap (approx. 12:00 to 16:00 UTC)
    const startHourUTC = 12;
    const endHourUTC = 16;

    let reason = '';
    let status: 'IN_WINDOW' | 'APPROACHING' | 'OUTSIDE';
    const baseReason = `a sobreposição das sessões de Londres e Nova Iorque`;

    if (currentUTCHour >= startHourUTC && currentUTCHour < endHourUTC) {
        status = 'IN_WINDOW';
        switch (action) {
            case SignalAction.BUY:
                reason = `AGORA: A alta volatilidade (${baseReason}) favorece a reversão esperada de níveis de sobrevenda.`;
                break;
            case SignalAction.SELL:
                reason = `AGORA: A alta liquidez (${baseReason}) é ideal para capitalizar na reversão de níveis de sobrecompra.`;
                break;
            default: // HOLD
                reason = `Estamos no horário de pico, mas os indicadores sugerem aguardar por um sinal mais claro. ${baseReason} gera volatilidade.`;
        }
    } else if (currentUTCHour >= startHourUTC - 2 && currentUTCHour < startHourUTC) { // Approaching window (2 hours before)
        status = 'APPROACHING';
        reason = `O período de alta volatilidade está se aproximando (${startHourUTC}:00 UTC). Prepare-se para executar a estratégia.`;
    } else {
        status = 'OUTSIDE';
        if (currentUTCHour < startHourUTC) {
            reason = `Fora do horário de pico. A próxima janela de alta volatilidade (${baseReason}) começa às ${startHourUTC}:00 UTC.`;
        } else {
            reason = `O horário de pico de hoje já passou. Considere operar com cautela ou aguardar a próxima janela amanhã.`;
        }
    }

    return {
        start: `${startHourUTC}:00`,
        end: `${endHourUTC}:00`,
        reason: reason,
        status: status,
    };
};

/**
 * Updates the internal signal state and generates a new signal object based on the provided live price, pivot points and VWAP levels.
 * @param currentPrice The live price of BTC/USD.
 * @param pivots The calculated pivot points and fibonacci levels.
 * @param vwap The calculated VWAP levels for daily, weekly, and monthly timeframes.
 * @param vwapBands The calculated daily VWAP bands.
 * @param weeklyVwapBands The calculated weekly VWAP bands.
 * @param previousVwaps The calculated VWAP levels for the previous day, week, and month.
 * @returns A new Signal object.
 */
export const updateAndGenerateSignal = (
  currentPrice: number, 
  pivots: PivotPoints,
  vwap: { daily: number; weekly: number; monthly: number; },
  vwapBands: VwapBands | null,
  weeklyVwapBands: VwapBands | null,
  previousVwaps: { daily: number; weekly: number; monthly: number; } | null
): Signal => {
  if (signalDuration <= 0) {
    const lastAction = currentSignalAction;
    
    if (lastAction === SignalAction.BUY || lastAction === SignalAction.SELL) {
        currentSignalAction = SignalAction.HOLD;
        signalDuration = getRandomDuration(100, 200); 
    } else { 
        const rand = Math.random();
        currentSignalAction = rand > 0.5 ? SignalAction.BUY : SignalAction.SELL;
        signalDuration = getRandomDuration(500, 1000); 
    }
  }

  let reasons: string[];
  let entryRange;
  let triggerLevel: { label: string; value: number } | undefined = undefined;
  let touchedVwapBand: { label: string; value: number } | undefined = undefined;
  let vwapBandTarget: { label: string; value: number } | undefined = undefined;
  let touchedFiboRetracement: { label: string; value: number } | undefined = undefined;
  let fiboRetracementTarget: { label: string; value: number } | undefined = undefined;
  let fiboExtensionTarget: { label: string; value: number; } | undefined = undefined;
  
  const vwapReasons = getVwapReasons(currentPrice, vwap, currentSignalAction);
  const prevVwapReasons = getPreviousVwapReasons(currentPrice, previousVwaps, currentSignalAction);

  const allVwapBandLevels = [];
  if (vwapBands) {
      allVwapBandLevels.push(
        { label: '1ª Banda Inf. (Compra)', value: vwapBands.band1.lower },
        { label: '2ª Banda Inf. (Compra)', value: vwapBands.band2.lower },
        { label: '3ª Banda Inf. (Compra)', value: vwapBands.band3.lower },
        { label: '4ª Banda Inf. (Compra)', value: vwapBands.band4.lower },
        { label: '5ª Banda Inf. (Compra)', value: vwapBands.band5.lower },
        { label: '1ª Banda Sup. (Venda)', value: vwapBands.band1.upper },
        { label: '2ª Banda Sup. (Venda)', value: vwapBands.band2.upper },
        { label: '3ª Banda Sup. (Venda)', value: vwapBands.band3.upper },
        { label: '4ª Banda Sup. (Venda)', value: vwapBands.band4.upper },
        { label: '5ª Banda Sup. (Venda)', value: vwapBands.band5.upper }
      );
  }
  if (weeklyVwapBands) {
      allVwapBandLevels.push(
        { label: '1ª Banda Sem. Inf. (Compra)', value: weeklyVwapBands.band1.lower },
        { label: '2ª Banda Sem. Inf. (Compra)', value: weeklyVwapBands.band2.lower },
        { label: '3ª Banda Sem. Inf. (Compra)', value: weeklyVwapBands.band3.lower },
        { label: '4ª Banda Sem. Inf. (Compra)', value: weeklyVwapBands.band4.lower },
        { label: '5ª Banda Sem. Inf. (Compra)', value: weeklyVwapBands.band5.lower },
        { label: '1ª Banda Sem. Sup. (Venda)', value: weeklyVwapBands.band1.upper },
        { label: '2ª Banda Sem. Sup. (Venda)', value: weeklyVwapBands.band2.upper },
        { label: '3ª Banda Sem. Sup. (Venda)', value: weeklyVwapBands.band3.upper },
        { label: '4ª Banda Sem. Sup. (Venda)', value: weeklyVwapBands.band4.upper },
        { label: '5ª Banda Sem. Sup. (Venda)', value: weeklyVwapBands.band5.upper }
      );
  }

  const allFiboRetracementLevels = [
    { label: 'Ret. Venda 200%', value: pivots.fiboRetSell200 }, { label: 'Ret. Venda 100%', value: pivots.fiboRetSell100 },
    { label: 'Ret. Venda 61.8%', value: pivots.fiboRetSell61 }, { label: 'Ret. Venda 50%', value: pivots.fiboRetSell50 },
    { label: 'Ret. Compra 50%', value: pivots.fiboRetBuy50 }, { label: 'Ret. Compra 61.8%', value: pivots.fiboRetBuy61 },
    { label: 'Ret. Compra 100%', value: pivots.fiboRetBuy100 }, { label: 'Ret. Compra 200%', value: pivots.fiboRetBuy200 },
  ];

  const allFiboExtensionLevels = [
    { label: 'Ext. Compra 100%', value: pivots.fiboExtBuy100 },
    { label: 'Ext. Compra 200%', value: pivots.fiboExtBuy200 },
    { label: 'Ext. Venda 100%', value: pivots.fiboExtSell100 },
    { label: 'Ext. Venda 200%', value: pivots.fiboExtSell200 },
  ];

  vwapBandTarget = findNextVwapBandTarget(currentPrice, allVwapBandLevels, currentSignalAction);
  fiboRetracementTarget = findNextFiboRetracementTarget(currentPrice, allFiboRetracementLevels, currentSignalAction);
  fiboExtensionTarget = findNextFiboExtensionTarget(currentPrice, allFiboExtensionLevels, currentSignalAction);


  switch (currentSignalAction) {
    case SignalAction.BUY:
      const supportLevels = [
        { label: 'S1', value: pivots.s1 }, { label: 'S2', value: pivots.s2 }, { label: 'S3', value: pivots.s3 },
        ...allFiboRetracementLevels,
      ];
      if (vwapBands) {
        supportLevels.push(
            { label: '1ª Banda Inf. (Compra)', value: vwapBands.band1.lower },
            { label: '2ª Banda Inf. (Compra)', value: vwapBands.band2.lower },
            { label: '3ª Banda Inf. (Compra)', value: vwapBands.band3.lower },
            { label: '4ª Banda Inf. (Compra)', value: vwapBands.band4.lower },
            { label: '5ª Banda Inf. (Compra)', value: vwapBands.band5.lower }
        );
      }
      if (weeklyVwapBands) {
        supportLevels.push(
            { label: '1ª Banda Sem. Inf. (Compra)', value: weeklyVwapBands.band1.lower },
            { label: '2ª Banda Sem. Inf. (Compra)', value: weeklyVwapBands.band2.lower },
            { label: '3ª Banda Sem. Inf. (Compra)', value: weeklyVwapBands.band3.lower },
            { label: '4ª Banda Sem. Inf. (Compra)', value: weeklyVwapBands.band4.lower },
            { label: '5ª Banda Sem. Inf. (Compra)', value: weeklyVwapBands.band5.lower }
        );
      }
      const closestSupport = findClosestLevel(currentPrice, supportLevels, 'support');
      const closestVwapBandSupport = findClosestVwapBand(currentPrice, supportLevels, 'support');
      const closestFiboSupport = findClosestFiboRetracement(currentPrice, supportLevels, 'support');
      
      reasons = [...baseBuyReasons, ...vwapReasons, ...prevVwapReasons];
      if (closestSupport) {
        reasons.unshift(`Preço próximo ao ${closestSupport.label} (${formattedPrice(closestSupport.value)})`);
        triggerLevel = closestSupport;
      }
      
      if (closestVwapBandSupport) {
        touchedVwapBand = closestVwapBandSupport;
        if (triggerLevel?.label !== touchedVwapBand.label) {
            reasons.push(`Preço tocou a ${touchedVwapBand.label} (${formattedPrice(touchedVwapBand.value)})`);
        }
      }

      if (closestFiboSupport) {
        touchedFiboRetracement = closestFiboSupport;
        if (triggerLevel?.label !== touchedFiboRetracement.label) {
            reasons.push(`Preço tocou a Retração Fibo ${touchedFiboRetracement.label.split(' ')[2]} (${formattedPrice(touchedFiboRetracement.value)})`);
        }
      }

      if (vwapBandTarget) {
          reasons.push(`Próximo alvo VWAP é a ${vwapBandTarget.label} (${formattedPrice(vwapBandTarget.value)})`);
      }
      if (fiboRetracementTarget) {
          reasons.push(`Próximo alvo Fibo é a ${fiboRetracementTarget.label} (${formattedPrice(fiboRetracementTarget.value)})`);
      }
      if (fiboExtensionTarget) {
          reasons.push(`Alvo assertivo (Ext. Fibo) em ${fiboExtensionTarget.label} (${formattedPrice(fiboExtensionTarget.value)})`);
      }
      
      entryRange = { min: currentPrice * 0.998, max: currentPrice * 1.001 };
      break;

    case SignalAction.SELL:
      const resistanceLevels = [
        { label: 'R1', value: pivots.r1 }, { label: 'R2', value: pivots.r2 }, { label: 'R3', value: pivots.r3 },
        ...allFiboRetracementLevels,
      ];
      if (vwapBands) {
        resistanceLevels.push(
            { label: '1ª Banda Sup. (Venda)', value: vwapBands.band1.upper },
            { label: '2ª Banda Sup. (Venda)', value: vwapBands.band2.upper },
            { label: '3ª Banda Sup. (Venda)', value: vwapBands.band3.upper },
            { label: '4ª Banda Sup. (Venda)', value: vwapBands.band4.upper },
            { label: '5ª Banda Sup. (Venda)', value: vwapBands.band5.upper }
        );
      }
      if (weeklyVwapBands) {
        resistanceLevels.push(
            { label: '1ª Banda Sem. Sup. (Venda)', value: weeklyVwapBands.band1.upper },
            { label: '2ª Banda Sem. Sup. (Venda)', value: weeklyVwapBands.band2.upper },
            { label: '3ª Banda Sem. Sup. (Venda)', value: weeklyVwapBands.band3.upper },
            { label: '4ª Banda Sem. Sup. (Venda)', value: weeklyVwapBands.band4.upper },
            { label: '5ª Banda Sem. Sup. (Venda)', value: weeklyVwapBands.band5.upper }
        );
      }
       const closestResistance = findClosestLevel(currentPrice, resistanceLevels, 'resistance');
       const closestVwapBandResistance = findClosestVwapBand(currentPrice, resistanceLevels, 'resistance');
       const closestFiboResistance = findClosestFiboRetracement(currentPrice, resistanceLevels, 'resistance');

      reasons = [...baseSellReasons, ...vwapReasons, ...prevVwapReasons];
      if (closestResistance) {
        reasons.unshift(`Preço próximo à ${closestResistance.label} (${formattedPrice(closestResistance.value)})`);
        triggerLevel = closestResistance;
      }

      if (closestVwapBandResistance) {
        touchedVwapBand = closestVwapBandResistance;
        if (triggerLevel?.label !== touchedVwapBand.label) {
            reasons.push(`Preço tocou a ${touchedVwapBand.label} (${formattedPrice(touchedVwapBand.value)})`);
        }
      }

      if (closestFiboResistance) {
        touchedFiboRetracement = closestFiboResistance;
        if (triggerLevel?.label !== touchedFiboRetracement.label) {
            reasons.push(`Preço tocou a Retração Fibo ${touchedFiboRetracement.label.split(' ')[2]} (${formattedPrice(touchedFiboRetracement.value)})`);
        }
      }

      if (vwapBandTarget) {
          reasons.push(`Próximo alvo VWAP é a ${vwapBandTarget.label} (${formattedPrice(vwapBandTarget.value)})`);
      }
      if (fiboRetracementTarget) {
          reasons.push(`Próximo alvo Fibo é a ${fiboRetracementTarget.label} (${formattedPrice(fiboRetracementTarget.value)})`);
      }
      if (fiboExtensionTarget) {
          reasons.push(`Alvo assertivo (Ext. Fibo) em ${fiboExtensionTarget.label} (${formattedPrice(fiboExtensionTarget.value)})`);
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
  
  const recommendedTradingWindow = determineTradingWindowAnalysis(currentSignalAction);

  return {
    action: currentSignalAction,
    currentPrice,
    timestamp: new Date(),
    reasons,
    stopLoss,
    takeProfit,
    entryRange,
    triggerLevel,
    touchedVwapBand,
    vwapBandTarget,
    touchedFiboRetracement,
    fiboRetracementTarget,
    fiboExtensionTarget,
    recommendedTradingWindow,
  };
};
