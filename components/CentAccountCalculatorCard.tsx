
import React, { useState, useMemo } from 'react';
import { SignalAction, type Signal } from '../types';

const formattedPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatNumber = (n: number, decimals = 8) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: decimals });

const InfoRow: React.FC<{ label: string, value: string | number, valueClassName?: string, tooltip?: string }> = ({ label, value, valueClassName = 'text-white', tooltip }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
        <span className="text-sm text-gray-400" title={tooltip}>{label}</span>
        <span className={`text-sm sm:text-base font-mono font-bold ${valueClassName}`}>{value}</span>
    </div>
);

const HoldSuggestion: React.FC<{
    type: 'BUY' | 'SELL';
    balance: number;
    level?: { label: string; value: number };
    targetLevel?: { label: string; value: number };
}> = ({ type, balance, level, targetLevel }) => {
    const calculations = useMemo(() => {
        if (!level || !targetLevel || !balance || balance <= 0) return null;

        const riskPercentage = 0.01;
        const riskAmount = balance * riskPercentage;

        const entryPrice = level.value;
        // SL fixed at 5% from entry for hypothetical limit order
        const stopLossPrice = type === 'BUY' ? entryPrice * 0.95 : entryPrice * 1.05; 
        const takeProfitPrice = targetLevel.value;

        const stopLossDistance = Math.abs(entryPrice - stopLossPrice);
        if (stopLossDistance === 0) return null;

        const lotSize = riskAmount / stopLossDistance;

        const takeProfitDistance = Math.abs(takeProfitPrice - entryPrice);
        const returnAmount = lotSize * takeProfitDistance;
        const riskRewardRatio = takeProfitDistance / stopLossDistance;
        
        // Calculate appropriate leverage
        const positionValue = lotSize * entryPrice;
        let suggestedLeverage = 1;
        if (positionValue > balance) {
            const minLeverage = positionValue / balance;
            const tiers = [10, 20, 25, 50, 100, 200, 500];
            const foundTier = tiers.find(tier => tier >= minLeverage);
            suggestedLeverage = foundTier || Math.ceil(minLeverage);
        }
        
        return { entryPrice, stopLossPrice, takeProfitPrice, lotSize, riskAmount, returnAmount, riskRewardRatio, suggestedLeverage };
    }, [level, targetLevel, balance, type]);

    if (!calculations) {
        return (
            <div className="p-4 rounded-lg bg-gray-900/30 border border-gray-700">
                <p className="text-sm text-gray-500 text-center">Não foi possível encontrar um nível claro para uma ordem limite de {type === 'BUY' ? 'compra' : 'venda'}.</p>
            </div>
        );
    }
    
    const isBuy = type === 'BUY';
    const styles = {
        title: isBuy ? 'text-green-400' : 'text-red-400',
        border: isBuy ? 'border-green-600/30' : 'border-red-600/30',
    };

    return (
        <div className={`p-4 rounded-lg bg-gray-900/30 border ${styles.border}`}>
            <h4 className={`text-lg font-bold mb-3 ${styles.title}`}>Sugestão de Ordem Limite ({type === 'BUY' ? 'Compra' : 'Venda'})</h4>
            <p className="text-xs text-gray-400 mb-4 italic">
                Estratégia de reversão: {type === 'BUY' ? `comprar no suporte` : `vender na resistência`} esperando que o preço reverta.
            </p>
            <InfoRow label="Gatilho de Entrada em" value={level ? level.label : '-'} />
            <InfoRow label="Preço de Entrada" value={formattedPrice(calculations.entryPrice)} valueClassName={styles.title} />
            <InfoRow label="Stop Loss (5%)" value={formattedPrice(calculations.stopLossPrice)} valueClassName="text-red-400" />
            <InfoRow label="Take Profit (Alvo)" value={formattedPrice(calculations.takeProfitPrice)} valueClassName="text-green-400" />
            <InfoRow label="Alvo em" value={targetLevel ? targetLevel.label : '-'} />
            <hr className="border-gray-700 my-2" />
            <InfoRow label="Lote para Entrar (BTC)" value={formatNumber(calculations.lotSize, 6)} tooltip="Calculado para arriscar 1% da banca" />
            <InfoRow 
                label="Alavancagem Sugerida" 
                value={`1:${calculations.suggestedLeverage}`} 
                tooltip="Alavancagem mínima sugerida para abrir a posição com sua banca em um cenário de ordem limite. Escolha este valor ou o próximo nível disponível em sua corretora."
            />
            <InfoRow label="Risco na Operação" value={`${formattedPrice(calculations.riskAmount)} (1%)`} valueClassName="text-red-400" />
            <InfoRow label="Retorno Potencial" value={formattedPrice(calculations.returnAmount)} valueClassName="text-green-400" />
            <InfoRow label="Risco/Retorno" value={`1:${calculations.riskRewardRatio.toFixed(2)}`} valueClassName="text-yellow-400" />
        </div>
    );
};


export const CentAccountCalculatorCard: React.FC<{ signal: Signal | null }> = ({ signal }) => {
    const [balance, setBalance] = useState<number>(100);
    const [mode, setMode] = useState<'conservative' | 'aggressive'>('conservative');

    const calculations = useMemo(() => {
        if (!signal || !balance || balance <= 0 || signal.action === SignalAction.HOLD) {
            return null;
        }

        const entryPrice = signal.currentPrice;
        const stopLossPrice = signal.stopLoss;
        const takeProfitPrice = signal.takeProfit;

        const stopLossDistance = Math.abs(entryPrice - stopLossPrice);
        const takeProfitDistance = Math.abs(takeProfitPrice - entryPrice);

        if (stopLossDistance === 0 || takeProfitDistance === 0) return null; // Avoid division by zero

        let lotSize, riskAmount, returnAmount, suggestedLeverage;
        const goal = balance * 2;

        if (mode === 'conservative') {
            const riskPercentage = 0.01; // 1% risk per trade
            riskAmount = balance * riskPercentage;
            lotSize = riskAmount / stopLossDistance;
            returnAmount = lotSize * takeProfitDistance;
            suggestedLeverage = 10; // A low, common leverage is sufficient.
        } else { // aggressive mode (dobrar banca)
            // Goal: Return amount is equal to initial balance to double the account
            returnAmount = balance; 
            lotSize = returnAmount / takeProfitDistance;
            riskAmount = lotSize * stopLossDistance;
            
            // Calculate appropriate leverage for aggressive mode
            const positionValue = lotSize * entryPrice;
            suggestedLeverage = 1;
            if (positionValue > balance) {
                const minLeverage = positionValue / balance;
                // Find the next common tier, or calculate a close-enough value.
                const tiers = [10, 20, 25, 50, 100, 200, 500];
                const foundTier = tiers.find(tier => tier >= minLeverage);
                suggestedLeverage = foundTier || Math.ceil(minLeverage);
            }
        }
        
        return {
            entryPrice,
            lotSize,
            leverage: `1:${suggestedLeverage}`,
            stopLossPrice,
            takeProfitPrice,
            riskAmount,
            returnAmount,
            riskPercentage: (riskAmount / balance) * 100,
            returnPercentage: (returnAmount / balance) * 100,
            goal,
        };
    }, [signal, balance, mode]);

    const getHoldingPeriodStatusColor = (status: 'SIGNAL_ACTIVE' | 'NO_SIGNAL' | undefined) => {
        switch (status) {
            case 'SIGNAL_ACTIVE': return 'text-cyan-400';
            default: return 'text-gray-400'; // NO_SIGNAL or undefined
        }
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Calculadora de Gerenciamento</h3>
            
            <div className="mb-6">
                <label htmlFor="balance" className="block text-sm font-medium text-gray-300 mb-2">Valor da Banca (USD)</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</span>
                    <input
                        type="number"
                        id="balance"
                        value={balance}
                        onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                        placeholder="100.00"
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-8 pr-4 py-2 text-white font-mono text-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    />
                </div>
            </div>

            {signal?.action !== SignalAction.HOLD && (
                <div className="flex justify-center gap-2 mb-6">
                    <button
                        onClick={() => setMode('conservative')}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full sm:w-auto ${
                            mode === 'conservative'
                                ? 'bg-cyan-500 text-gray-900'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Conservador (1% Risco)
                    </button>
                    <button
                        onClick={() => setMode('aggressive')}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full sm:w-auto ${
                            mode === 'aggressive'
                                ? 'bg-yellow-500 text-gray-900'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Agressivo (Dobrar Banca)
                    </button>
                </div>
            )}

            {signal?.action === SignalAction.HOLD ? (
                 <div className="space-y-6 mt-4">
                    <div className="text-center p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                        <h4 className="font-bold text-yellow-300">Modo Manter: Análise de Limites</h4>
                        <p className="text-xs text-yellow-400">O mercado está sem tendência clara (RSI neutro). As sugestões abaixo são para ordens limite em níveis chave de suporte/resistência, que possuem maior risco.</p>
                    </div>
                    <HoldSuggestion 
                        type="BUY" 
                        balance={balance} 
                        level={signal.closestSupport}
                        targetLevel={signal.closestResistance}
                    />
                    <HoldSuggestion 
                        type="SELL" 
                        balance={balance} 
                        level={signal.closestResistance}
                        targetLevel={signal.closestSupport}
                    />
                </div>
            ) : !calculations || !signal ? (
                <div className="text-center py-8 bg-gray-900/30 rounded-lg">
                    <p className="text-gray-400">
                        Insira a banca e aguarde um sinal de Compra/Venda.
                    </p>
                </div>
            ) : (
                <div>
                    {mode === 'aggressive' && (
                        <div className="text-center p-3 mb-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                            <h4 className="font-bold text-yellow-300">⚠️ Modo Agressivo Ativado</h4>
                            <p className="text-xs text-yellow-400">Este modo arrisca uma parte significativa da sua banca para tentar dobrá-la em uma única operação. Use com extrema cautela.</p>
                        </div>
                    )}
                    <InfoRow
                        label={`Preço de Entrada (${signal.action})`}
                        value={formattedPrice(calculations.entryPrice)}
                        valueClassName={signal.action === SignalAction.BUY ? 'text-green-400' : 'text-red-400'}
                    />
                     <InfoRow 
                        label="Período Recomendado" 
                        value={`${signal.recommendedHoldingPeriod.period}`}
                        valueClassName={getHoldingPeriodStatusColor(signal.recommendedHoldingPeriod.status)}
                        tooltip={signal.recommendedHoldingPeriod.reason}
                    />
                    <InfoRow 
                        label="Stop Loss (Sugerido 5.00%)" 
                        value={formattedPrice(calculations.stopLossPrice)} 
                        valueClassName="text-red-400"
                        tooltip="Stop loss sugerido pela estratégia, posicionado a 5.00% do preço de entrada para Position Trading."
                    />
                    <InfoRow 
                        label="Take Profit (Sugerido 15.00%)" 
                        value={formattedPrice(calculations.takeProfitPrice)} 
                        valueClassName="text-green-400"
                        tooltip="Take profit sugerido para uma relação Risco/Retorno de 1:3 para Position Trading."
                    />

                    {signal.fiboExtensionTarget && (
                        <InfoRow
                            label={`Ordem Pendente Assertiva (${signal.action === SignalAction.BUY ? 'Venda' : 'Compra'})`}
                            value={formattedPrice(signal.fiboExtensionTarget.value)}
                            valueClassName={signal.action === SignalAction.BUY ? 'text-red-400' : 'text-green-400'}
                            tooltip={`Baseado em ${signal.fiboExtensionTarget.label}. Alvo de confluência forte para possível reversão ou realização de lucro.`}
                        />
                    )}
                    
                    <InfoRow 
                        label="Lote para Entrar (BTC)" 
                        value={formatNumber(calculations.lotSize, 6)} 
                        tooltip="Volume de Bitcoin necessário para abrir a posição com o risco/retorno selecionado." 
                    />
                    <InfoRow 
                        label="Alavancagem Sugerida" 
                        value={calculations.leverage} 
                        tooltip={
                            mode === 'aggressive'
                            ? "Alavancagem mínima sugerida para abrir a posição calculada com sua banca. Escolha este valor ou o próximo nível disponível em sua corretora."
                            : "Uma alavancagem baixa como 1:10 é suficiente para a estratégia conservadora, pois o risco é baixo."
                        }
                    />
                    
                    <InfoRow label="Risco na Operação" value={`${formattedPrice(calculations.riskAmount)} (${calculations.riskPercentage.toFixed(2)}%)`} valueClassName="text-red-400" />
                    <InfoRow label="Retorno Potencial" value={`${formattedPrice(calculations.returnAmount)} (+${calculations.returnPercentage.toFixed(0)}%)`} valueClassName="text-green-400" />
                    <InfoRow label="Meta (Dobrar a Banca)" value={formattedPrice(calculations.goal)} valueClassName="text-yellow-400 font-bold" />
                </div>
            )}
             <p className="text-xs text-gray-500 mt-4 text-center italic">
                *Cálculos baseados na estratégia de risco selecionada. Ajuste conforme seu perfil.
            </p>
        </div>
    );
};
