import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface Feature {
  name: string;
  included: boolean;
}

interface PricingCardProps {
  name: string;
  price: number;
  period: string;
  features: Feature[];
  popular?: boolean;
  planId: number;
}

const PricingCard: React.FC<PricingCardProps> = ({ name, price, period, features, popular = false, planId }) => {
  const { user } = useAuth();
  
  const borderClass = popular 
    ? "border-primary-200 ring-2 ring-primary-500" 
    : "border-gray-100";
  
  const headerClass = popular 
    ? "border-b bg-primary-50" 
    : "border-b";
  
  const titleClass = popular 
    ? "text-xl font-bold text-primary-700" 
    : "text-xl font-bold";
  
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border ${borderClass} hover:shadow-lg transition flex flex-col relative`}>
      {popular && (
        <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs font-bold px-3 py-1 transform translate-x-2 -translate-y-2 rotate-45">
          POPULAR
        </div>
      )}
      <div className={`p-6 ${headerClass}`}>
        <h3 className={titleClass}>{name}</h3>
        <div className="mt-4 mb-1 flex items-baseline">
          <span className="text-3xl font-bold">${price}</span>
          <span className="text-gray-500 ml-1">/{period}</span>
        </div>
      </div>
      <div className="p-6 bg-gray-50 flex-grow">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              {feature.included ? (
                <i className="fas fa-check text-green-500 mr-2"></i>
              ) : (
                <i className="fas fa-times text-red-500 mr-2"></i>
              )}
              <span className={feature.included ? "" : "text-gray-400"}>{feature.name}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-6 border-t">
        {user ? (
          <Link href={`/subscribe/${planId}`}>
            <div className="cursor-pointer block w-full py-3 px-4 text-center bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-md font-medium transition shadow-md hover:shadow-lg">
              Purchase Now
            </div>
          </Link>
        ) : (
          <Link href="/auth">
            <div className="cursor-pointer block w-full py-3 px-4 text-center bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-md font-medium transition shadow-md hover:shadow-lg">
              Sign Up to Purchase
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default PricingCard;
