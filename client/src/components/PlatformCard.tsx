import React from 'react';
import { Link } from 'wouter';

interface PlatformService {
  name: string;
  url: string;
}

interface PlatformCardProps {
  icon: string;
  bgColor: string;
  name: string;
  description: string;
  services: PlatformService[];
}

const PlatformCard: React.FC<PlatformCardProps> = ({ icon, bgColor, name, description, services }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className={`${bgColor} p-2 rounded text-white mr-3`}>
            <i className={`${icon} text-xl`}></i>
          </div>
          <h3 className="text-xl font-semibold">{name}</h3>
        </div>
        <p className="text-gray-600 mb-4">{description}</p>
        <ul className="space-y-2 mb-4">
          {services.map((service, index) => (
            <li key={index} className="flex items-center text-sm text-gray-700">
              <span className="text-primary-500 mr-2">•</span>
              <Link href={service.url} className="hover:text-primary-600 transition">
                {service.name}
              </Link>
            </li>
          ))}
        </ul>
        <Link href={`/${name.toLowerCase()}`} className="text-primary-600 font-medium text-sm hover:text-primary-800 transition">
          Learn more →
        </Link>
      </div>
    </div>
  );
};

export default PlatformCard;
