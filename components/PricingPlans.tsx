
import React from 'react';
import { CheckCircleIcon } from './icons';
import { type Plan } from '../types';

interface PricingPlansProps {
  plans: Plan[];
}

export const PricingPlans: React.FC<PricingPlansProps> = ({ plans }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {plans.map((plan, index) => (
        <div 
          key={index} 
          className={`bg-gray-800/50 backdrop-blur-sm rounded-xl border ${plan.isPopular ? 'border-cyan-500' : 'border-gray-700'} p-8 flex flex-col shadow-lg transform hover:-translate-y-2 transition-transform duration-300 relative`}
        >
          {plan.isPopular && (
            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-cyan-500 text-gray-900 px-4 py-1 text-sm font-bold rounded-full">
              MAIS POPULAR
            </div>
          )}
          <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
          <div className="mt-4">
            <span className="text-5xl font-extrabold text-white">{plan.price}</span>
            <span className="text-lg font-medium text-gray-400">{plan.priceDetails}</span>
          </div>
          <ul className="mt-8 space-y-4 text-gray-300 flex-grow">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-center">
                <CheckCircleIcon className="h-6 w-6 text-cyan-400 mr-3" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <button className={`mt-8 w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-300 ${plan.isPopular ? 'bg-cyan-500 text-gray-900 hover:bg-cyan-400' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
            Assinar Agora
          </button>
        </div>
      ))}
    </div>
  );
};
