import { SignalAction, type Signal, type PivotPoints, type VwapBands, type NewsAnalysis, type HeikinAshiColor } from '../types';

// --- Heikin-Ashi Calculation ---

/**
 * Calculates Heikin-Ashi candles and determines the color of the latest candle.
 * @param klines An array of raw Binance klines (each as [openTime, open, high, low, close, volume, ...]).
 * @returns The color of the latest Heikin-Ashi candle ('Green', 'Red', 'Neutral') or null if not enough data.
 */
export const calculateHeikinAshiColor = (klines: any[]): HeikinAshiColor | null => {
  if (klines.length < 2) { // Need at least 2 candles for HA calculation
    return null;
  }

  const haCandles: { open: number; high: number; low: number; close: number }[] = [];

  for (let i = 0; i < klines.length; i++) {
    const k = klines[i];
    const open = parseFloat(k[1]);
    const high = parseFloat(k[2]);
    const low = parseFloat(k[3]);
    const close = parseFloat(k[4]);

    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
      continue; // Skip invalid klines
    }

    let haClose = (open + high + low + close) / 4;
    let haOpen;

    if (i === 0) {
      // For the very first candle, HA Open is regular Open
      haOpen = open;
    } else {
      // For subsequent candles, HA Open is average of previous HA Open and HA Close
      haOpen = (haCandles[i - 1].open + haCandles[i - 1].close) / 2;
    }

    // HA High is the maximum of current High, HA Open, and HA Close
    let haHigh = Math.max(high, haOpen, haClose);
    // HA Low is the minimum of current Low, HA Open, and HA Close
    let haLow = Math.min(low, haOpen, haClose);

    haCandles.push({ open: haOpen, high: haHigh, low: haLow, close: haClose });
  }

  if (haCandles.length === 0) {
    return null;
  }

  // Determine the color of the latest Heikin-Ashi candle
  const latestHa = haCandles[haCandles.length - 1];
  if (latestHa.close > latestHa.open) {
    return 'Green';
  } else if (latestHa.close < latestHa.open) {
    return 'Red';
  } else {
    return 'Neutral';
  }
};


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

/**
 * Calculates the Relative Strength Index (RSI).
 * @param closes An array of closing prices.
 * @param period The period for RSI calculation (default 14).
 * @returns The latest RSI value, or null if not enough data.
 */
export const calculateRSI = (closes: number[], period: number = 14): number | null => {
    if (closes.length <= period) {
        return null;
    }

    let gains = 0;
    let losses = 0;

    // Calculate initial average gains and losses
    for (let i = 1; i <= period; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) {
            gains += diff;
        } else {
            losses -= diff; // losses are positive values
        }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Smooth the averages for the rest of the data
    for (let i = period + 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) {
            avgGain = (avgGain * (period - 1) + diff) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) - diff) / period;
        }
    }
    
    if (avgLoss === 0) {
        return 100; // RSI is 100 if average loss is zero
    }

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
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

    for (const level of vwapLevels) {
        if (level.value === 0) continue;
        const distance = Math.abs(price - level.value) / level.value;
        if (distance < proximityThreshold) {
            reasons.push(`Confluência: Preço próximo à VWAP ${level.label} (${formattedPrice(level.value)})`);
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

    for (const level of vwapLevels) {
        if (level.value === 0) continue;
        const distance = Math.abs(price - level.value) / level.value;
        if (distance < proximityThreshold) {
            reasons.push(`Confluência: Preço testando Preço Típico ${level.label} (${formattedPrice(level.value)})`);
        }
    }
    return reasons;
};


// --- Static Data ---
const holdReasons = [
    "RSI neutro, sem indicar sobrecompra ou sobrevenda.",
    "Mercado sem tendência definida ou preço distante de S/R chave.",
    "Aguardando o preço testar um nível de suporte ou resistência válido.",
    "Aguardando confirmação de rompimento ou reversão."
];


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
 * Determines the recommended holding period based on the signal.
 * @returns An object with the period, a descriptive reason, and a status.
 */
const determineHoldingPeriodAnalysis = (action: SignalAction): { period: string; reason: string; status: 'SIGNAL_ACTIVE' | 'NO_SIGNAL' } => {
    let reason = '';
    let status: 'SIGNAL_ACTIVE' | 'NO_SIGNAL';
    let period = '';

    switch (action) {
        case SignalAction.BUY:
        case SignalAction.SELL:
            status = 'SIGNAL_ACTIVE';
            period = 'Semanas a Meses';
            reason = `Sinais baseados em indicadores diários são projetados para capturar tendências de longo prazo. Recomenda-se manter a posição por semanas ou meses para atingir os alvos de lucro.`;
            break;
        default: // HOLD
            status = 'NO_SIGNAL';
            period = 'Indefinido';
            reason = `Nenhum sinal de longo prazo ativo. Aguarde uma entrada clara baseada em indicadores diários para definir um período de holding.`;
    }

    return {
        period,
        reason,
        status,
    };
};

/**
 * Updates the internal signal state and generates a new signal object based on the provided live price, pivot points and VWAP levels.
 * @param currentPrice The live price of BTC/USD.
 * @param rsi The calculated 14-period RSI.
 * @param dailyHigh The high price of the last completed daily candle.
 * @param dailyLow The low price of the last completed daily candle.
 * @param dailyClose The close price of the last completed daily candle.
 * @param vwap The calculated VWAP levels for daily, weekly, and monthly timeframes.
 * @param vwapBands The calculated daily VWAP bands.
 * @param weeklyVwapBands The calculated weekly VWAP bands.
 * @param previousVwaps The calculated VWAP levels for the previous day, week, and month.
 * @param newsAnalysis The AI-driven news sentiment analysis.
 * @param heikinAshiColor The color of the latest Heikin-Ashi candle.
 * @returns A new Signal object.
 */
export const updateAndGenerateSignal = (
  currentPrice: number,
  rsi: number,
  dailyHigh: number, // NEW: Parameter for daily high
  dailyLow: number,  // NEW: Parameter for daily low
  dailyClose: number, // NEW: Parameter for daily close
  vwap: { daily: number; weekly: number; monthly: number; },
  vwapBands: VwapBands | null,
  weeklyVwapBands: VwapBands | null,
  previousVwaps: { daily: number; weekly: number; monthly: number; } | null,
  newsAnalysis: NewsAnalysis | null,
  heikinAshiColor: HeikinAshiColor | null 
): Signal => {
  let currentSignalAction = SignalAction.HOLD;
  let reasons: string[] = [];
  let entryRange;
  let triggerLevel: { label: string; value: number } | undefined = undefined;
  let touchedVwapBand: { label: string; value: number } | undefined = undefined;
  let vwapBandTarget: { label: string; value: number } | undefined = undefined;
  let touchedFiboRetracement: { label: string; value: number } | undefined = undefined;
  let fiboRetracementTarget: { label: string; value: number } | undefined = undefined;
  let fiboExtensionTarget: { label: string; value: number; } | undefined = undefined;
  let closestSupport: { label: string; value: number; } | undefined = undefined;
  let closestResistance: { label: string; value: number; } | undefined = undefined;
  
  // Calculate daily pivots using the provided daily high, low, close
  const pivots = calculateClassicPivotPoints(dailyHigh, dailyLow, dailyClose);


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
  
  const supportLevels = [
    { label: 'S1', value: pivots.s1 }, { label: 'S2', value: pivots.s2 }, { label: 'S3', value: pivots.s3 },
    ...allVwapBandLevels.filter(l => l.label.includes('Compra')),
    ...allFiboRetracementLevels.filter(l => l.label.includes('Compra')),
  ];
  const resistanceLevels = [
    { label: 'R1', value: pivots.r1 }, { label: 'R2', value: pivots.r2 }, { label: 'R3', value: pivots.r3 },
    ...allVwapBandLevels.filter(l => l.label.includes('Venda')),
    ...allFiboRetracementLevels.filter(l => l.label.includes('Venda')),
  ];

  // --- NEW RSI-BASED TRIGGER LOGIC ---
  if (rsi <= 30) {
      currentSignalAction = SignalAction.BUY;
      reasons.push(`Principal: RSI Diário (14) em ${rsi.toFixed(2)} indica sobrevenda.`);
      triggerLevel = findClosestLevel(currentPrice, supportLevels, 'support');
      if (triggerLevel) {
          reasons.push(`Confirmação: Preço próximo ao suporte ${triggerLevel.label} (${formattedPrice(triggerLevel.value)})`);
      }
  } else if (rsi >= 70) {
      currentSignalAction = SignalAction.SELL;
      reasons.push(`Principal: RSI Diário (14) em ${rsi.toFixed(2)} indica sobrecompra.`);
      triggerLevel = findClosestLevel(currentPrice, resistanceLevels, 'resistance');
      if (triggerLevel) {
          reasons.push(`Confirmação: Preço próximo à resistência ${triggerLevel.label} (${formattedPrice(triggerLevel.value)})`);
      }
  }
  // --- END NEW LOGIC ---

  // --- NEW HEIKIN-ASHI CONFLUENCE LOGIC ---
  if (heikinAshiColor) {
      if (currentSignalAction === SignalAction.BUY) {
          if (heikinAshiColor === 'Green') {
              reasons.push(`Confluência: Heikin-Ashi verde confirma o impulso de alta.`);
          } else if (heikinAshiColor === 'Red') {
              currentSignalAction = SignalAction.HOLD;
              reasons = [`AVISO: Heikin-Ashi vermelho contradiz o sinal de compra do RSI. Adotando modo 'Manter'.`];
          }
      } else if (currentSignalAction === SignalAction.SELL) {
          if (heikinAshiColor === 'Red') {
              reasons.push(`Confluência: Heikin-Ashi vermelho confirma o impulso de baixa.`);
          } else if (heikinAshiColor === 'Green') {
              currentSignalAction = SignalAction.HOLD;
              reasons = [`AVISO: Heikin-Ashi verde contradiz o sinal de venda do RSI. Adotando modo 'Manter'.`];
          }
      } else { // currentSignalAction === SignalAction.HOLD
        // For HOLD, Heikin-Ashi gives insight but doesn't force action without RSI trigger
        if (heikinAshiColor === 'Green') {
          reasons.push(`Heikin-Ashi indica um possível impulso de alta, mas o RSI está neutro. Aguardar confirmação.`);
        } else if (heikinAshiColor === 'Red') {
          reasons.push(`Heikin-Ashi indica um possível impulso de baixa, mas o RSI está neutro. Aguardar confirmação.`);
        }
      }
  }
  // --- END NEW HEIKIN-ASHI LOGIC ---

  // --- NEWS SENTIMENT LOGIC ---
  if (newsAnalysis && currentSignalAction !== SignalAction.HOLD) {
    const sentiment = newsAnalysis.overallSentiment;
    const summary = newsAnalysis.summary;

    if (sentiment === 'Positive' && currentSignalAction === SignalAction.BUY) {
      reasons.push(`Confluência (Notícias Positivas): ${summary}`);
    } else if (sentiment === 'Negative' && currentSignalAction === SignalAction.SELL) {
      reasons.push(`Confluência (Notícias Negativas): ${summary}`);
    } else if (sentiment === 'Positive' && currentSignalAction === SignalAction.SELL) {
      reasons.push(`Aviso (Notícias Positivas): ${summary}`);
    } else if (sentiment === 'Negative' && currentSignalAction === SignalAction.BUY) {
      reasons.push(`Aviso (Notícias Negativas): ${summary}`);
    }
  }
  // --- END NEWS SENTIMENT LOGIC ---

  const vwapReasons = getVwapReasons(currentPrice, vwap, currentSignalAction);
  reasons.push(...vwapReasons);
  const prevVwapReasons = getPreviousVwapReasons(currentPrice, previousVwaps, currentSignalAction);
  reasons.push(...prevVwapReasons); // FIX: Changed 'reclusions' to 'reasons'

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
      const closestVwapBandSupport = findClosestVwapBand(currentPrice, supportLevels, 'support');
      const closestFiboSupport = findClosestFiboRetracement(currentPrice, supportLevels, 'support');
      
      if (closestVwapBandSupport) {
        touchedVwapBand = closestVwapBandSupport;
        if (triggerLevel?.label !== touchedVwapBand.label) {
            reasons.push(`Confluência: Preço também tocou a ${touchedVwapBand.label} (${formattedPrice(touchedVwapBand.value)})`);
        }
      }

      if (closestFiboSupport) {
        touchedFiboRetracement = closestFiboSupport;
        if (triggerLevel?.label !== touchedFiboRetracement.label) {
            reasons.push(`Confluência: Preço também tocou a Retração Fibo ${touchedFiboRetracement.label.split(' ')[2]} (${formattedPrice(touchedFiboRetracement.value)})`);
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
       const closestVwapBandResistance = findClosestVwapBand(currentPrice, resistanceLevels, 'resistance');
       const closestFiboResistance = findClosestFiboRetracement(currentPrice, resistanceLevels, 'resistance');

      if (closestVwapBandResistance) {
        touchedVwapBand = closestVwapBandResistance;
        if (triggerLevel?.label !== touchedVwapBand.label) {
            reasons.push(`Confluência: Preço também tocou a ${touchedVwapBand.label} (${formattedPrice(touchedVwapBand.value)})`);
        }
      }

      if (closestFiboResistance) {
        touchedFiboRetracement = closestFiboResistance;
        if (triggerLevel?.label !== touchedFiboRetracement.label) {
            // FIX: Corrected typo 'touachedFiboRetracement' to 'touchedFiboRetracement'
            reasons.push(`Confluência: Preço também tocou a Retração Fibo ${touchedFiboRetracement.label.split(' ')[2]} (${formattedPrice(touchedFiboRetracement.value)})`);
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
      reasons = holdReasons; // Reassign hold reasons to ensure they are consistent
      entryRange = { min: currentPrice, max: currentPrice };

      // Find closest support BELOW current price
      closestSupport = supportLevels
          .filter(l => l.value < currentPrice)
          .sort((a, b) => b.value - a.value)[0];

      // Find closest resistance ABOVE current price
      closestResistance = resistanceLevels
          .filter(l => l.value > currentPrice)
          .sort((a, b) => a.value - b.value)[0];
      break;
  }

  // --- UPDATED STOP LOSS & TAKE PROFIT for POSITION TRADING ---
  // SL: 5%, TP: 15% for a 1:3 Risk/Reward ratio
  const stopLoss = currentSignalAction === SignalAction.BUY ? currentPrice * 0.95 : currentPrice * 1.05;
  const takeProfit = currentSignalAction === SignalAction.BUY ? currentPrice * 1.15 : currentPrice * 0.85;
    
  const recommendedHoldingPeriod = determineHoldingPeriodAnalysis(currentSignalAction);

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
    recommendedHoldingPeriod,
    closestSupport,
    closestResistance,
    heikinAshiColor, // NEW: Include Heikin-Ashi color in the signal object
  };
};