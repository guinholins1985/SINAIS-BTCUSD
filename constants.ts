import { SignalAction, type BacktestEntry } from './types';

export const BACKTEST_DATA: BacktestEntry[] = [
  {
    date: '2023-10-20',
    price: '$30,100',
    rsiDaily: 28,
    vwapDaily: '$30,500',
    vwapWeekly: '$31,000',
    mm80: '$29,000',
    vwapBand5: '$28,500',
    signal: SignalAction.BUY,
    result: '+130% em 5 meses'
  },
  {
    date: '2024-03-14',
    price: '$73,100',
    rsiDaily: 78,
    vwapDaily: '$72,800',
    vwapWeekly: '$71,500',
    mm80: '$68,000',
    vwapBand5: '$75,000',
    signal: SignalAction.SELL,
    result: 'Fechado em $61,000'
  },
   {
    date: '2024-04-18',
    price: '$61,500',
    rsiDaily: 30,
    vwapDaily: '$62,000',
    vwapWeekly: '$63,100',
    mm80: '$60,800',
    vwapBand5: '$59,000',
    signal: SignalAction.BUY,
    result: '+15% em 4 semanas'
  },
  {
    date: '2024-05-21',
    price: '$71,200',
    rsiDaily: 75,
    vwapDaily: '$70,900',
    vwapWeekly: '$69,500',
    mm80: '$67,200',
    vwapBand5: '$72,500',
    signal: SignalAction.SELL,
    result: '+10% em 3 semanas (short)'
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