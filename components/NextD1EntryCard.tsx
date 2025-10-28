
import React from 'react';
import { SignalAction, type Signal } from '../types';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ClockIcon } from './icons'; 

interface NextD1EntryCardProps {
  signal: Signal | null;
}

const formattedPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const NextD1EntryCard: React.FC<NextD1EntryCardProps> = ({ signal }) => {
  if (!signal || signal.action === SignalAction.HOLD) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6 h-full flex items-center justify-center min-h-[150px]">
        <p className="text-gray-400 text-center">Nenhuma entrada D1 sugerida no modo "Manter".</p>
      </div>
    );
  }

  const isBuy = signal.action === SignalAction.BUY;
  const entryPrice = isBuy ? signal.entryRange.min : signal.entryRange.max; // Use min for BUY, max for SELL
  const actionLabel = isBuy ? 'COMPRA' : 'VENDA';
  const priceColor = isBuy ? 'text-green-400' : 'text-red-400';
  const borderColor = isBuy ? 'border-green-500' : 'border-red-500';
  const bgColor = isBuy ? 'bg-green-900/50' : 'bg-red-900/50';
  const icon = isBuy ? <ArrowTrendingUpIcon className="h-7 w-7" /> : <ArrowTrendingDownIcon className="h-7 w-7" />;
  const explanation = isBuy 
    ? "Preço ideal para abrir uma posição longa no próximo candle diário, capitalizando o impulso de alta."
    : "Preço ideal para abrir uma posição curta no próximo candle diário, capitalizando o impulso de baixa.";

  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl shadow-2xl p-6`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <ClockIcon className="w-6 h-6 text-cyan-400" />
          Entrada D1 Sugerida
        </h3>
        <span className={`${priceColor} font-bold text-xl flex items-center gap-1`}>
            {icon} {actionLabel}
        </span>
      </div>
      
      <div className="text-center my-4">
        <p className="text-sm text-gray-400">Preço Sugerido</p>
        <p className={`text-3xl font-bold ${priceColor}`}>{formattedPrice(entryPrice)}</p>
      </div>

      <p className="text-xs text-gray-400 italic text-center mt-4">{explanation}</p>
    </div>
  );
};
