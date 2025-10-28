import React from 'react';
import { SignalAction, type Signal, type PivotPoints } from '../types';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, PauseIcon, PlusCircleIcon } from './icons';

interface PivotAndOrdersCardProps {
  pivots: PivotPoints | null;
  signal: Signal | null;
}

const formattedPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

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


export const PivotAndOrdersCard: React.FC<PivotAndOrdersCardProps> = ({ pivots, signal }) => {
  if (!pivots || !signal) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 flex justify-center items-center h-full min-h-[150px]">
        <p className="text-gray-400">Aguardando dados para análise de Pivot Points e sugestão de ordens...</p>
      </div>
    );
  }

  const { currentPrice, action, vwapBandTarget, fiboRetracementTarget } = signal;
  const { p, r1, r2, r3, s1, s2, s3 } = pivots;

  const allPivotLevels = [
    { label: 'R3', value: r3 }, { label: 'R2', value: r2 }, { label: 'R1', value: r1 },
    { label: 'P', value: p },
    { label: 'S1', value: s1 }, { label: 'S2', value: s2 }, { label: 'S3', value: s3 },
  ].sort((a, b) => a.value - b.value); // Sort ascending for easier processing

  const proximityThreshold = currentPrice * 0.001; // 0.1% for "near" or "testing"

  let analysisMessages: string[] = [];
  let currentStatusText = '';
  let nextTargetText = '';
  let currentStatusColor = 'text-gray-400';
  let nextTargetColor = 'text-gray-300';
  let icon = <PauseIcon className="h-5 w-5 text-gray-400" />;

  // --- Determine Current Status and "Already Sought" ---
  if (currentPrice > p + proximityThreshold) {
    currentStatusText = `O preço atual (${formattedPrice(currentPrice)}) está acima do Pivot Central (P).`;
    currentStatusColor = 'text-green-400';
    icon = <ArrowTrendingUpIcon className="h-5 w-5 text-green-400" />;
    
    // Check if previous supports were sought
    const soughtSupports = allPivotLevels.filter(level => level.value < currentPrice - proximityThreshold && level.label.startsWith('S'));
    if (soughtSupports.length > 0) {
      analysisMessages.push(`O movimento de alta partiu de/testou os suportes: ${soughtSupports.map(s => s.label).join(', ')}.`);
    }

    // Find closest resistance above currentPrice as next target
    const nextResistance = allPivotLevels.find(level => level.value > currentPrice + proximityThreshold && level.label.startsWith('R'));
    if (nextResistance) {
      nextTargetText = `O próximo alvo de resistência a buscar é ${nextResistance.label} em ${formattedPrice(nextResistance.value)}.`;
      nextTargetColor = 'text-green-300';
    } else {
      nextTargetText = `O preço está acima de todas as resistências principais, indicando forte momentum de alta.`;
      nextTargetColor = 'text-green-300';
    }

  } else if (currentPrice < p - proximityThreshold) {
    currentStatusText = `O preço atual (${formattedPrice(currentPrice)}) está abaixo do Pivot Central (P).`;
    currentStatusColor = 'text-red-400';
    icon = <ArrowTrendingDownIcon className="h-5 w-5 text-red-400" />;

    // Check if previous resistances were sought
    const soughtResistances = allPivotLevels.filter(level => level.value > currentPrice + proximityThreshold && level.label.startsWith('R'));
    if (soughtResistances.length > 0) {
      analysisMessages.push(`O movimento de baixa partiu de/testou as resistências: ${soughtResistances.map(r => r.label).join(', ')}.`);
    }
    
    // Find closest support below currentPrice as next target
    const nextSupport = allPivotLevels.slice().reverse().find(level => level.value < currentPrice - proximityThreshold && level.label.startsWith('S')); // Reverse to find closest below
    if (nextSupport) {
      nextTargetText = `O próximo alvo de suporte a buscar é ${nextSupport.label} em ${formattedPrice(nextSupport.value)}.`;
      nextTargetColor = 'text-red-300';
    } else {
      nextTargetText = `O preço está abaixo de todos os suportes principais, indicando forte momentum de baixa.`;
      nextTargetColor = 'text-red-300';
    }

  } else {
    currentStatusText = `O preço atual (${formattedPrice(currentPrice)}) está consolidando em torno do Pivot Central (P).`;
    currentStatusColor = 'text-yellow-400';
    icon = <PauseIcon className="h-5 w-5 text-yellow-400" />;
    
    const closestResistance = allPivotLevels.find(level => level.value > currentPrice);
    const closestSupport = allPivotLevels.slice().reverse().find(level => level.value < currentPrice); // find closest support below
    
    if (closestSupport && closestResistance) {
        nextTargetText = `O mercado opera entre ${closestSupport.label} (${formattedPrice(closestSupport.value)}) e ${closestResistance.label} (${formattedPrice(closestResistance.value)}).`;
    } else {
        nextTargetText = `O mercado está em consolidação.`;
    }
    nextTargetColor = 'text-gray-300';
  }

  // Add a general action-based context
  if (action === SignalAction.BUY && analysisMessages.length === 0) {
      analysisMessages.push("O sinal de Compra do RSI está ativo. Foco na força dos suportes.");
  } else if (action === SignalAction.SELL && analysisMessages.length === 0) {
      analysisMessages.push("O sinal de Venda do RSI está ativo. Foco na fraqueza das resistências.");
  }


  // --- Pending Orders Suggestions Logic ---
  const suggestions: { 
      type: 'BUY' | 'SELL'; 
      title: string; 
      levelName: string; 
      price: number; 
      explanation: string; 
  }[] = [];

  if (action === SignalAction.BUY) {
    // Current signal is BUY, so potential pending orders are for SELLING (TP or new short)
    if (vwapBandTarget) {
      suggestions.push({
        type: 'SELL',
        title: 'TP / Venda no Alvo VWAP',
        levelName: vwapBandTarget.label,
        price: vwapBandTarget.value,
        explanation: `Venda neste nível de resistência (${vwapBandTarget.label}) para realizar lucro de uma posição longa ou iniciar um short.`
      });
    }
    if (fiboRetracementTarget) {
      suggestions.push({
        type: 'SELL',
        title: 'TP / Venda no Alvo Fibo',
        levelName: fiboRetracementTarget.label,
        price: fiboRetracementTarget.value,
        explanation: `Venda neste nível de resistência (${fiboRetracementTarget.label}) para realizar lucro de uma posição longa ou iniciar um short.`
      });
    }
    // Add Pivot based SELL orders, only if above current price
    if (r1 > currentPrice) { 
        suggestions.push({
            type: 'SELL',
            title: 'TP / Venda na R1 (Pivot)',
            levelName: 'Resistência 1 (R1)',
            price: r1,
            explanation: `Venda neste nível de resistência para realizar lucro ou iniciar um short.`
        });
    }
    if (r2 > currentPrice) { 
        suggestions.push({
            type: 'SELL',
            title: 'TP / Venda na R2 (Pivot)',
            levelName: 'Resistência 2 (R2)',
            price: r2,
            explanation: `Venda neste nível de resistência para realizar lucro ou iniciar um short.`
        });
    }

  } else if (action === SignalAction.SELL) {
    // Current signal is SELL, so potential pending orders are for BUYING (TP or new long)
    if (vwapBandTarget) {
      suggestions.push({
        type: 'BUY',
        title: 'TP / Compra no Alvo VWAP',
        levelName: vwapBandTarget.label,
        price: vwapBandTarget.value,
        explanation: `Compre neste nível de suporte (${vwapBandTarget.label}) para realizar lucro de um short ou iniciar um long.`
      });
    }
    if (fiboRetracementTarget) {
      suggestions.push({
        type: 'BUY',
        title: 'TP / Compra no Alvo Fibo',
        levelName: fiboRetracementTarget.label,
        price: fiboRetracementTarget.value,
        explanation: `Compre neste nível de suporte (${fiboRetracementTarget.label}) para realizar lucro de um short ou iniciar um long.`
      });
    }
    // Add Pivot based BUY orders, only if below current price
    if (s1 < currentPrice) { 
        suggestions.push({
            type: 'BUY',
            title: 'TP / Compra no S1 (Pivot)',
            levelName: 'Suporte 1 (S1)',
            price: s1,
            explanation: `Compre neste nível de suporte para realizar lucro ou iniciar um long.`
        });
    }
    if (s2 < currentPrice) { 
        suggestions.push({
            type: 'BUY',
            title: 'TP / Compra no S2 (Pivot)',
            levelName: 'Suporte 2 (S2)',
            price: s2,
            explanation: `Compre neste nível de suporte para realizar lucro ou iniciar um long.`
        });
    }

  } else { // SignalAction.HOLD
    // For HOLD, focus on reversal limit orders at S/R pivots
    if (s1 < currentPrice) {
        suggestions.push({
            type: 'BUY',
            title: 'Compra Limite no S1 (Reversão)',
            levelName: 'Suporte 1 (S1)',
            price: s1,
            explanation: `Considere uma ordem limite de compra no S1, esperando uma reversão de alta neste suporte.`
        });
    }
    if (s2 < currentPrice) {
        suggestions.push({
            type: 'BUY',
            title: 'Compra Limite no S2 (Reversão)',
            levelName: 'Suporte 2 (S2)',
            price: s2,
            explanation: `Considere uma ordem limite de compra no S2, esperando uma reversão de alta neste suporte.`
        });
    }
    if (r1 > currentPrice) {
        suggestions.push({
            type: 'SELL',
            title: 'Venda Limite na R1 (Reversão)',
            levelName: 'Resistência 1 (R1)',
            price: r1,
            explanation: `Considere uma ordem limite de venda na R1, esperando uma reversão de baixa nesta resistência.`
        });
    }
    if (r2 > currentPrice) {
        suggestions.push({
            type: 'SELL',
            title: 'Venda Limite na R2 (Reversão)',
            levelName: 'Resistência 2 (R2)',
            price: r2,
            explanation: `Considere uma ordem limite de venda na R2, esperando uma reversão de baixa nesta resistência.`
        });
    }
  }

  const renderOrderSuggestions = (orderType: 'BUY' | 'SELL', filteredSuggestions: typeof suggestions) => (
      <>
          {filteredSuggestions.length > 0 && (
              <div className="mt-4">
                  <h4 className={`text-base font-semibold ${orderType === 'BUY' ? 'text-green-400' : 'text-red-400'} mb-2 flex items-center gap-2`}>
                      <PlusCircleIcon className="h-5 w-5" /> Ordens de {orderType === 'BUY' ? 'COMPRA' : 'Venda'}
                  </h4>
                  <div className="space-y-3">
                      {filteredSuggestions.map((sug, index) => (
                          <OrderSuggestion key={index} {...sug} />
                      ))}
                  </div>
              </div>
          )}
      </>
  );

  const buySuggestions = suggestions.filter(sug => sug.type === 'BUY');
  const sellSuggestions = suggestions.filter(sug => sug.type === 'SELL');


  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          Análise de Pivot Points & Ordens Pendentes (Diário)
        </h3>
        <span className="text-sm text-gray-400">Preço Atual: <span className="text-cyan-400 font-bold">{formattedPrice(currentPrice)}</span></span>
      </div>

      {/* Pivot Analysis Section */}
      <div className="space-y-4 mb-6 pb-6 border-b border-gray-700/50">
        <p className={`text-base font-semibold ${currentStatusColor} flex items-center gap-2`}>{icon} {currentStatusText}</p>
        
        {analysisMessages.length > 0 && (
          <div className="text-sm text-gray-300 space-y-2">
            {analysisMessages.map((msg, index) => (
              <p key={index} className="flex items-start">
                <span className="text-cyan-400 mr-2">•</span> {msg}
              </p>
            ))}
          </div>
        )}

        <p className={`text-base ${nextTargetColor}`}>{nextTargetText}</p>

        {action === SignalAction.HOLD && (
            <p className="text-sm text-gray-400 italic mt-3">
                Em modo "Manter", o mercado geralmente consolida entre níveis de suporte e resistência. Aguarde um rompimento claro para definir a próxima direção.
            </p>
        )}
      </div>

      {/* Pending Orders Section */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Ordens Pendentes Sugeridas</h3>
        
        {suggestions.length === 0 ? (
            <div className="p-4 rounded-lg border border-gray-700 bg-gray-900/30 text-center text-gray-500">
                {action === SignalAction.HOLD ? 'Nenhuma ordem pendente de reversão clara identificada para este momento.' : 'Nenhum alvo de VWAP, Fibo ou Pivot claro identificado para ordens pendentes.'}
            </div>
        ) : (
            <div>
                {renderOrderSuggestions('BUY', buySuggestions)}
                {renderOrderSuggestions('SELL', sellSuggestions)}
            </div>
        )}
      </div>
    </div>
  );
};