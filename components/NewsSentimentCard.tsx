import React, { useState, useEffect } from 'react';
import { type NewsAnalysis, type NewsSentiment } from '../types';

const getSentimentStyles = (sentiment: NewsSentiment) => {
    switch (sentiment) {
        case 'Positive':
            return {
                bg: 'bg-green-900/50',
                border: 'border-green-500',
                text: 'text-green-400',
                icon: '▲',
                label: 'Positivo',
            };
        case 'Negative':
            return {
                bg: 'bg-red-900/50',
                border: 'border-red-500',
                text: 'text-red-400',
                icon: '▼',
                label: 'Negativo',
            };
        default: // Neutral
            return {
                bg: 'bg-gray-700/50',
                border: 'border-gray-500',
                text: 'text-gray-400',
                icon: '●',
                label: 'Neutro',
            };
    }
};

const NewsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 18V6.375c0-.621.504-1.125 1.125-1.125H9.75" />
    </svg>
);


export const NewsSentimentCard: React.FC<{ news: NewsAnalysis | null; nextUpdateTime: Date | null }> = ({ news, nextUpdateTime }) => {
    const [countdown, setCountdown] = useState<string>('');

    useEffect(() => {
        if (!nextUpdateTime) return;

        const intervalId = setInterval(() => {
            const now = new Date().getTime();
            const distance = nextUpdateTime.getTime() - now;

            if (distance < 0) {
                setCountdown('Atualizando...');
                clearInterval(intervalId);
                return;
            }

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const formattedMinutes = minutes.toString().padStart(2, '0');
            const formattedSeconds = seconds.toString().padStart(2, '0');

            setCountdown(`${formattedMinutes}:${formattedSeconds}`);
        }, 1000);

        return () => clearInterval(intervalId); // Cleanup on unmount or prop change
    }, [nextUpdateTime]);

    if (!news) {
        return (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6 flex items-center justify-center min-h-[200px]">
                <p className="text-gray-400 text-center">Analisando sentimento das notícias...</p>
            </div>
        );
    }
    
    const sentimentStyles = getSentimentStyles(news.overallSentiment);

    return (
        <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6`}>
            <div className="flex items-start justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <NewsIcon />
                    Sentimento (Notícias)
                </h3>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${sentimentStyles.bg} ${sentimentStyles.border}`}>
                    <span className={sentimentStyles.text}>{sentimentStyles.icon}</span>
                    <span className={sentimentStyles.text}>{sentimentStyles.label}</span>
                </div>
            </div>

            {countdown && (
                <div className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span>Próxima atualização em: <strong className="font-mono text-gray-300">{countdown}</strong></span>
                </div>
            )}
            
            <p className="text-sm text-gray-300 italic my-5">
                "{news.summary}"
            </p>

            <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Manchetes Analisadas</h4>
                <ul className="list-disc list-inside text-sm text-gray-400 space-y-2">
                    {news.headlines.map((headline, index) => (
                        <li key={index}>
                            <span className="text-gray-300">{headline.title}</span> <span className="text-gray-500 text-xs">({headline.source})</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};