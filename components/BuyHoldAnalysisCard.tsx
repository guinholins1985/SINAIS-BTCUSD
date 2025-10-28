
import React from 'react';
import { SignalAction, type Signal } from '../types';
import { ArrowTrendingUpIcon, PauseIcon } from './icons';

interface BuyHoldAnalysisCardProps {
  signal: Signal | null;
}

const formattedPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const BuyHoldAnalysisCard: React.FC<BuyHoldAnalysisCardProps> = ({ signal }) => {
  if (!signal || signal.action === SignalAction.SELL) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6 h-full flex items-center justify-center min-h-[150px]">
        {signal && signal.action === SignalAction.SELL ? (
            <p className="text-gray-400 text-center">Foco em análise de Venda. Esta seção é para Compra/Manter.</p>
        ) : (
            <p className="text-gray-400 text-center">Aguardando sinal para análise de Compra/Manter...</p>
        )}
      </div>
    );
  }

  const isBuy = signal.action === SignalAction.BUY;
  const cardTitle = isBuy ? 'Perspectiva de Compra' : 'Perspectiva de Manter';
  const priceColor = isBuy ? 'text-green-400' : 'text-yellow-400';
  const borderColor = isBuy ? 'border-green-500' : 'border-yellow-500';
  const bgColor = isBuy ? 'bg-green-900/50' : 'bg-yellow-900/50';
  const icon = isBuy ? <ArrowTrendingUpIcon className="h-8 w-8" /> : <PauseIcon className="h-8 w-8" />;

  let analysisText = '';
  if (isBuy) {
    analysisText = `O mercado de BTC/USD apresenta condições favoráveis para uma entrada de compra em ${formattedPrice(signal.entryRange.min)}, com múltiplos indicadores alinhados a uma potencial valorização. Aconselha-se monitorar a faixa de entrada sugerida para maximizar o potencial de ganho. Mantenha a paciência para os alvos de lucro.`;
  } else { // HOLD
    analysisText = `No momento, o mercado de BTC/USD demonstra indecisão, sem um sinal claro de compra ou venda forte. Recomenda-se cautela e a observação atenta dos níveis de suporte e resistência para identificar uma futura oportunidade de entrada ou saída, ou para uma estratégia de ordens limite em níveis chave.`;
  }

  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl shadow-2xl p-6`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          {icon} {cardTitle}
        </h3>
        <p className={`text-sm text-gray-400`}>Preço Atual: <span className={`${priceColor} font-bold`}>{formattedPrice(signal.currentPrice)}</span></p>
      </div>
      
      <p className="text-base text-gray-200 mt-4 leading-relaxed">{analysisText}</p>
    </div>
  );
};
