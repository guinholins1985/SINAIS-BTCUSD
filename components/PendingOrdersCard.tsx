import React from 'react';
import { SignalAction, type Signal } from '../types';

// A small helper component for each order suggestion
const OrderSuggestion: React.FC<{
  type: 'BUY' | 'SELL';
  title: string;
  levelName: string;
  price: number;
  explanation: string;
}> = ({ type, title, levelName, price, explanation }) => {
  const isBuy = type === 'BUY';
  const styles = {
    bg: isBuy ? 'bg-green-900/30' : 'bg-red-900/30',
    border: isBuy ? 'border-green-700' : 'border-red-700',
    text: isBuy ? 'text-green-400' : 'text-red-400',
  };
  const formattedPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={`p-4 rounded-lg border ${styles.border} ${styles.bg}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className={`font-bold text-lg ${styles.text}`}>{title}</p>
          <p className="text-sm text-gray-300 mt-1">{levelName}</p>
        </div>
        <p className="text-2xl font-mono font-bold text-white text-right">{formattedPrice(price)}</p>
      </div>
      <p className="text-xs text-gray-400 mt-3 italic">{explanation}</p>
    </div>
  );
};


export const PendingOrdersCard: React.FC<{ signal: Signal | null }> = ({ signal }) => {
  if (!signal || signal.action === SignalAction.HOLD) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6 h-full flex items-center justify-center min-h-[200px]">
        <p className="text-gray-400 text-center">
            {signal?.action === SignalAction.HOLD ? 'Nenhuma ordem pendente sugerida em modo "Manter".' : 'Aguardando sinal para sugerir ordens pendentes...'}
        </p>
      </div>
    );
  }

  const { action, vwapBandTarget, fiboRetracementTarget } = signal;

  const orderType = action === SignalAction.BUY ? 'SELL' : 'BUY';
  const explanations = {
      SELL: 'Venda neste nível de resistência para realizar lucro ou iniciar uma posição de short.',
      BUY: 'Compra neste nível de suporte para realizar lucro ou iniciar uma posição de long.',
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">Ordens Pendentes Sugeridas</h3>
      <div className="space-y-4">
        {vwapBandTarget ? (
          <OrderSuggestion
            type={orderType}
            title={`Ordem Limite no Alvo VWAP`}
            levelName={vwapBandTarget.label}
            price={vwapBandTarget.value}
            explanation={explanations[orderType]}
          />
        ) : (
             <div className="p-4 rounded-lg border border-gray-700 bg-gray-900/30 text-center text-gray-500">
                Nenhum alvo de Banda VWAP claro identificado.
             </div>
        )}

        {fiboRetracementTarget ? (
          <OrderSuggestion
            type={orderType}
            title={`Ordem Limite no Alvo Fibo`}
            levelName={fiboRetracementTarget.label}
            price={fiboRetracementTarget.value}
            explanation={explanations[orderType]}
          />
        ) : (
            <div className="p-4 rounded-lg border border-gray-700 bg-gray-900/30 text-center text-gray-500">
                Nenhum alvo de Retração Fibonacci claro identificado.
            </div>
        )}
      </div>
    </div>
  );
};
