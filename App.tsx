import React, { useState, useEffect } from 'react';
import { type Signal } from './types';
import { SignalCard } from './components/SignalCard';
import { updateAndGenerateSignal } from './services/mockSignalService';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="py-12 md:py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-white">{title}</h2>
        {children}
    </section>
);


const App: React.FC = () => {
    const [signal, setSignal] = useState<Signal | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPriceAndGenerateSignal = async () => {
            try {
                const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
                if (!response.ok) {
                    throw new Error(`Erro ao buscar dados da API: ${response.statusText}`);
                }
                const data = await response.json();
                const currentPrice = parseFloat(data.price);
                
                if (isNaN(currentPrice)) {
                    throw new Error('Formato de preço inválido recebido da API.');
                }

                setSignal(updateAndGenerateSignal(currentPrice));
                if (error) setError(null); // Clear previous errors on success
            } catch (err) {
                console.error("Falha ao buscar preço ou gerar sinal:", err);
                if (err instanceof Error) {
                  setError(err.message);
                } else {
                  setError("Ocorreu um erro desconhecido.");
                }
            }
        };

        fetchPriceAndGenerateSignal(); // Chamada inicial para carregar dados imediatamente
        const interval = setInterval(fetchPriceAndGenerateSignal, 3000); // Atualiza a cada 3 segundos

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 bg-gradient-to-br from-gray-900 via-gray-900 to-slate-800 text-gray-200">
            <header className="py-6 text-center border-b border-gray-800">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                    <span className="text-cyan-400">BTC</span> Confluence Pro <span className="text-2xl md:text-3xl text-gray-400 font-medium">(Análise H1)</span>
                </h1>
                <p className="text-gray-400 mt-2">Sinais de trading para BTC/USD baseados em confluência de indicadores.</p>
            </header>

            <main className="container mx-auto px-4">
                <Section title="Sinal Atual BTC/USD">
                     <div className="max-w-4xl mx-auto">
                        {error ? (
                            <div className="bg-red-900/50 border border-red-500 text-red-300 p-6 rounded-xl shadow-lg text-center">
                              <h3 className="text-xl font-bold mb-2">Falha na Conexão</h3>
                              <p>Não foi possível obter os dados de preço mais recentes.</p>
                              <p className="text-sm text-red-400 mt-1">({error})</p>
                            </div>
                        ) : (
                            <SignalCard signal={signal} />
                        )}
                     </div>
                </section>

            </main>

            <footer className="text-center py-8 border-t border-gray-800 mt-12">
                <p className="text-gray-500">&copy; {new Date().getFullYear()} BTC Confluence Pro. Todos os direitos reservados.</p>
                 <p className="text-xs text-gray-500 mt-2">
                    Fonte de dados de preço: <a href="https://br.tradingview.com/symbols/BTCUSD/" target="_blank" rel="noopener noreferrer" className="underline hover:text-cyan-400">TradingView</a>
                </p>
                <p className="text-xs text-gray-600 mt-2">Aviso: Investimentos em criptomoedas envolvem alto risco. Não nos responsabilizamos por perdas financeiras.</p>
            </footer>
        </div>
    );
};

export default App;
