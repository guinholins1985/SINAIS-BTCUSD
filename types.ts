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