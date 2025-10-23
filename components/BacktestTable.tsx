import React from 'react';
import { SignalAction, type BacktestEntry } from '../types';

interface BacktestTableProps {
  data: BacktestEntry[];
}

export const BacktestTable: React.FC<BacktestTableProps> = ({ data }) => {
  return (
    <div className="overflow-x-auto bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 shadow-lg">
      <table className="min-w-full text-sm text-left text-gray-300">
        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
          <tr>
            <th scope="col" className="px-6 py-3">Data</th>
            <th scope="col" className="px-6 py-3">Preço BTC</th>
            <th scope="col" className="px-6 py-3">RSI Diário (30/70)</th>
            <th scope="col" className="px-6 py-3">VWAP Diário</th>
            <th scope="col" className="px-6 py-3">VWAP Semanal</th>
            <th scope="col" className="px-6 py-3">MM80</th>
            <th scope="col" className="px-6 py-3">5ª Banda VWAP</th>
            <th scope="col" className="px-6 py-3">Sinal</th>
            <th scope="col" className="px-6 py-3">Resultado</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, index) => (
            <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-200">
              <td className="px-6 py-4 whitespace-nowrap">{entry.date}</td>
              <td className="px-6 py-4 font-medium text-white">{entry.price}</td>
              <td className="px-6 py-4">{entry.rsiDaily}</td>
              <td className="px-6 py-4">{entry.vwapDaily}</td>
              <td className="px-6 py-4">{entry.vwapWeekly}</td>
              <td className="px-6 py-4">{entry.mm80}</td>
              <td className="px-6 py-4">{entry.vwapBand5}</td>
              <td className={`px-6 py-4 font-bold ${entry.signal === SignalAction.BUY ? 'text-green-400' : 'text-red-400'}`}>
                {entry.signal}
              </td>
               <td className="px-6 py-4 text-cyan-400">{entry.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};