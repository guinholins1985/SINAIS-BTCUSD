
import { SignalAction, type BacktestEntry } from './types';

export const BACKTEST_DATA: BacktestEntry[] = [
  {
    date: '2025-10-10',
    price: '$50,000',
    rsi15: 8,
    vwapDaily: '$49,800',
    vwapWeekly: '$49,500',
    mm80: '$49,200',
    vwapBand5: '$48,000',
    signal: SignalAction.BUY,
    result: 'Fechado em $52,000'
  },
  {
    date: '2025-10-12',
    price: '$52,000',
    rsi15: 92,
    vwapDaily: '$51,500',
    vwapWeekly: '$50,000',
    mm80: '$50,500',
    vwapBand5: '$53,000',
    signal: SignalAction.SELL,
    result: '+4% em 2 dias'
  },
   {
    date: '2025-09-22',
    price: '$45,500',
    rsi15: 9,
    vwapDaily: '$45,450',
    vwapWeekly: '$45,100',
    mm80: '$44,800',
    vwapBand5: '$44,000',
    signal: SignalAction.BUY,
    result: 'Fechado em $47,200'
  },
  {
    date: '2025-09-15',
    price: '$48,000',
    rsi15: 91,
    vwapDaily: '$47,800',
    vwapWeekly: '$47,500',
    mm80: '$48,200',
    vwapBand5: '$49,000',
    signal: SignalAction.SELL,
    result: '+3.1% em 3 dias'
  },
];

export const TECH_STACK = [
  { name: 'React.js', description: 'Dashboard interativo e responsivo.', icon: 'react' },
  { name: 'Python', description: 'Análise técnica com Pandas, NumPy, TA-Lib.', icon: 'python' },
  { name: 'Telegram API', description: 'Alertas de sinais em tempo real.', icon: 'telegram' },
  { name: 'PostgreSQL', description: 'Armazenamento de dados históricos e sinais.', icon: 'database' },
  { name: 'Binance API', description: 'Dados de mercado em tempo real.', icon: 'api' },
  { name: 'AWS Lambda', description: 'Execução de scripts de análise de forma escalável.', icon: 'aws' },
];

export const COMPETITIVE_EDGE = [
  'Confluência de 4 indicadores (RSI + VWAP + MM80 + VWAP Bands).',
  'Sinais validados por backtest com dados históricos.',
  'Integração com corretoras para execução automática via API.',
  'Gestão de risco com stop loss e take profit automáticos.',
  'Plataforma intuitiva e focada na experiência do usuário.',
];