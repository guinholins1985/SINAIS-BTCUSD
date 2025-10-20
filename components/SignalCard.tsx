import React from 'react';
import { SignalAction, type Signal } from '../types';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, PauseIcon, CheckCircleIcon } from './icons';

interface SignalCardProps {
  signal: Signal | null;
}

const getSignalStyles = (action: SignalAction | undefined) => {
  switch (action) {
    case SignalAction.BUY:
      return {
        bg: 'bg-green-900/50 border-green-500',
        text: 'text-green-400',
        icon: <ArrowTrendingUpIcon className="h-10 w-10 sm:h-12 sm:w-12" />,
      };
    case SignalAction.SELL:
      return {
        bg: 'bg-red-900/50 border-red-500',
        text: 'text-red-400',
        icon: <ArrowTrendingDownIcon className="h-10 w-10 sm:h-12 sm:w-12" />,
      };
    default:
      return {
        bg: 'bg-gray-700/50 border-gray-500',
        text: 'text-gray-400',
        icon: <PauseIcon className="h-10 w-10 sm:h-12 sm:w-12" />,
      };
  }
};

const getEntryDetails = (action: SignalAction) => {
    switch (action) {
        case SignalAction.BUY:
            return {
                label: "Melhor Faixa de Compra",
                color: "text-green-400",
            };
        case SignalAction.SELL:
            return {
                label: "Melhor Faixa de Venda",
                color: "text-red-400",
            };
        default: // HOLD
            return {
                label: "Faixa de Referência",
                color: "text-gray-400",
            };
    }
};


export const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  if (!signal) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 flex justify-center items-center h-full">
        <p className="text-gray-400">Aguardando novo sinal...</p>
      </div>
    );
  }

  const styles = getSignalStyles(signal.action);
  const entryDetails = getEntryDetails(signal.action);
  const formattedPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={`border ${styles.bg} rounded-xl shadow-2xl backdrop-blur-sm overflow-hidden transform hover:scale-[1.01] transition-transform duration-300`}>
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className={`text-3xl sm:text-4xl font-bold ${styles.text}`}>{signal.action.toUpperCase()}</h3>
            <p className="text-gray-400 text-sm">
              {signal.timestamp.toLocaleTimeString('pt-BR')} - BTC/USD
            </p>
          </div>
          <div className={styles.text}>{styles.icon}</div>
        </div>

        <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">Preço Atual (BTC/USD)</p>
            <p className="text-3xl sm:text-4xl font-bold text-white">{formattedPrice(signal.currentPrice)}</p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className={`text-sm font-semibold ${entryDetails.color}`}>{entryDetails.label}</p>
            <p className={`text-lg sm:text-xl font-semibold ${entryDetails.color}`}>{`${formattedPrice(signal.entryRange.min)}`}</p>
             <p className={`text-sm font-semibold ${entryDetails.color}/80`}>a</p>
             <p className={`text-lg sm:text-xl font-semibold ${entryDetails.color}`}>{`${formattedPrice(signal.entryRange.max)}`}</p>
          </div>
          <div>
            <p className="text-sm text-red-400">Stop Loss</p>
            <p className="text-xl sm:text-2xl font-semibold text-red-400">{formattedPrice(signal.stopLoss)}</p>
          </div>
          <div>
            <p className="text-sm text-green-400">Take Profit</p>
            <p className="text-xl sm:text-2xl font-semibold text-green-400">{formattedPrice(signal.takeProfit)}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-black bg-opacity-30 px-6 py-4 mt-4">
        <h4 className="font-semibold text-gray-200 mb-3">Motivos de Confluência:</h4>
        <ul className="space-y-2">
          {signal.reasons.map((reason, index) => (
            <li key={index} className="flex items-center text-gray-300 text-sm">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-cyan-400 flex-shrink-0" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};