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

export const CentAccountCalculatorCard: React.FC<{ signal: Signal | null }> = ({ signal }) => {
    const [balance, setBalance] = useState<number>(100);

    const calculations = useMemo(() => {
        if (!signal || !balance || balance <= 0 || signal.action === SignalAction.HOLD) {
            return null;
        }

        const riskPercentage = 0.01; // 1% risk per trade
        const riskAmount = balance * riskPercentage;
        
        const entryPrice = signal.currentPrice;
        const stopLossPrice = signal.stopLoss;
        const takeProfitPrice = signal.takeProfit;

        const stopLossDistance = Math.abs(entryPrice - stopLossPrice);
        if (stopLossDistance === 0) return null; // Avoid division by zero

        // Lot Size = (Risk Amount in USD) / (Stop Loss Distance in USD)
        // For BTC/USD, 1 lot = 1 BTC, so a $1 price move = $1 profit/loss per lot.
        const lotSize = riskAmount / stopLossDistance;

        const takeProfitDistance = Math.abs(takeProfitPrice - entryPrice);
        const returnAmount = lotSize * takeProfitDistance;
        
        const goal = balance * 2;

        return {
            entryPrice,
            lotSize,
            leverage: '1:100',
            stopLossPrice,
            takeProfitPrice,
            riskAmount,
            returnAmount,
            goal,
        };
    }, [signal, balance]);

    const getWindowStatusColor = (status: 'IN_WINDOW' | 'APPROACHING' | 'OUTSIDE' | undefined) => {
        switch (status) {
            case 'IN_WINDOW': return 'text-cyan-400';
            case 'APPROACHING': return 'text-yellow-400';
            default: return 'text-gray-400'; // OUTSIDE or undefined
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

            {!calculations || !signal ? (
                <div className="text-center py-8 bg-gray-900/30 rounded-lg">
                    <p className="text-gray-400">
                        {signal?.action === SignalAction.HOLD ? 'Calculadora inativa em modo "Manter".' : 'Insira a banca e aguarde um sinal de Compra/Venda.'}
                    </p>
                </div>
            ) : (
                <div>
                    <InfoRow
                        label={`Preço de Entrada (${signal.action})`}
                        value={formattedPrice(calculations.entryPrice)}
                        valueClassName={signal.action === SignalAction.BUY ? 'text-green-400' : 'text-red-400'}
                    />
                     <InfoRow 
                        label="Melhor Horário p/ Operar" 
                        value={`${signal.recommendedTradingWindow.start} - ${signal.recommendedTradingWindow.end} (UTC)`}
                        valueClassName={getWindowStatusColor(signal.recommendedTradingWindow.status)}
                        tooltip={signal.recommendedTradingWindow.reason}
                    />
                    <InfoRow 
                        label="Stop Loss (Sugerido 0.50%)" 
                        value={formattedPrice(calculations.stopLossPrice)} 
                        valueClassName="text-red-400"
                        tooltip="Stop loss sugerido pela estratégia, posicionado a 0.50% do preço de entrada."
                    />
                    <InfoRow 
                        label="Take Profit (Sugerido 1.50%)" 
                        value={formattedPrice(calculations.takeProfitPrice)} 
                        valueClassName="text-green-400"
                        tooltip="Take profit sugerido para uma relação Risco/Retorno de 1:3."
                    />

                    {signal.fiboExtensionTarget && (
                        <InfoRow
                            label={`Ordem Pendente Assertiva (${signal.action === SignalAction.BUY ? 'Venda' : 'Compra'})`}
                            value={formattedPrice(signal.fiboExtensionTarget.value)}
                            valueClassName={signal.action === SignalAction.BUY ? 'text-red-400' : 'text-green-400'}
                            tooltip={`Baseado em ${signal.fiboExtensionTarget.label}. Alvo de confluência forte para possível reversão ou realização de lucro.`}
                        />
                    )}
                    
                    <InfoRow label="Lote para Entrar (BTC)" value={formatNumber(calculations.lotSize, 6)} tooltip="Calculado para arriscar 1% da banca" />
                    <InfoRow label="Alavancagem Sugerida" value={calculations.leverage} />
                    
                    <InfoRow label="Risco na Operação" value={`${formattedPrice(calculations.riskAmount)} (1%)`} valueClassName="text-red-400" />
                    <InfoRow label="Retorno Potencial" value={formattedPrice(calculations.returnAmount)} valueClassName="text-green-400" />
                    <InfoRow label="Meta (Dobrar a Banca)" value={formattedPrice(calculations.goal)} valueClassName="text-yellow-400 font-bold" />
                </div>
            )}
             <p className="text-xs text-gray-500 mt-4 text-center italic">
                *Cálculos baseados em um risco de 1% do capital por operação. Ajuste conforme sua estratégia.
            </p>
        </div>
    );
};