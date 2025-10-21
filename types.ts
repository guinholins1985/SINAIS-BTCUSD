// FIX: Removed a circular self-import of `SignalAction` which was causing a declaration conflict.

export enum SignalAction {
  BUY = 'Compra',
  SELL = 'Venda',
  HOLD = 'Manter'
}

export interface Signal {
  action: SignalAction;
  currentPrice: number;
  entryRange: { min: number; max: number; };
  timestamp: Date;
  reasons: string[];
  stopLoss: number;
  takeProfit: number;
  triggerLevel?: { label: string; value: number; };
  touchedVwapBand?: { label: string; value: number; };
  vwapBandTarget?: { label: string; value: number; };
  touchedFiboRetracement?: { label: string; value: number; };
  fiboRetracementTarget?: { label: string; value: number; };
  fiboExtensionTarget?: { label: string; value: number; };
}

export interface BacktestEntry {
  date: string;
  price: string;
  rsi15: number;
  vwapDaily: string;
  vwapWeekly: string;
  mm80: string;
  vwapBand5: string;
  signal: SignalAction.BUY | SignalAction.SELL;
  result: string;
}

// FIX: Add missing 'Plan' interface.
export interface Plan {
  name: string;
  price: string;
  priceDetails: string;
  features: string[];
  isPopular?: boolean;
}

export interface VwapBandLevel {
  upper: number;
  lower: number;
}

export interface VwapBands {
  band1: VwapBandLevel;
  band2: VwapBandLevel;
  band3: VwapBandLevel;
  band4: VwapBandLevel;
  band5: VwapBandLevel;
}

export interface PivotPoints {
  p: number;
  r1: number;
  s1: number;
  r2: number;
  s2: number;
  r3: number;
  s3: number;
  // Retracements
  fiboRetBuy50: number;
  fiboRetBuy61: number;
  fiboRetBuy100: number;
  fiboRetBuy200: number;
  fiboRetSell50: number;
  fiboRetSell61: number;
  fiboRetSell100: number;
  fiboRetSell200: number;
  // Extensions
  fiboExtBuy100: number;
  fiboExtBuy200: number;
  fiboExtSell100: number;
  fiboExtSell200: number;
}