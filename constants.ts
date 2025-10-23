import { SignalAction, type BacktestEntry } from './types';

export const BACKTEST_DATA: BacktestEntry[] = [
  {
    date: '2025-07-15',
    price: '$62,100',
    rsiDaily: 28,
    vwapDaily: '$62,500',
    vwapWeekly: '$63,000',
    mm80: '$60,000',
    vwapBand5: '$60,500',
    signal: SignalAction.BUY,
    result: '+18% em 6 semanas'
  },
  {
    date: '2025-09-01',
    price: '$73,500',
    rsiDaily: 75,
    vwapDaily: '$73,000',
    vwapWeekly: '$71,000',
    mm80: '$68,000',
    vwapBand5: '$75,000',
    signal: SignalAction.SELL,
    result: 'Fechado em $65,000'
  },
   {
    date: '2025-03-10',
    price: '$45,000',
    rsiDaily: 25,
    vwapDaily: '$45,500',
    vwapWeekly: '$46,100',
    mm80: '$43,800',
    vwapBand5: '$43,000',
    signal: SignalAction.BUY,
    result: '+25% em 2 meses'
  },
  {
    date: '2025-05-20',
    price: '$56,500',
    rsiDaily: 78,
    vwapDaily: '$56,000',
    vwapWeekly: '$54,500',
    mm80: '$51,200',
    vwapBand5: '$58,000',
    signal: SignalAction.SELL,
    result: '+12% em 5 semanas (short)'
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