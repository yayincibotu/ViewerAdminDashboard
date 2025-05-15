import React from 'react';
import { Link } from 'wouter';

interface BenefitCardProps {
  icon: string;
  title: string;
  description: string;
  link: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ icon, title, description, link }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-100 hover:shadow-lg transition flex flex-col h-full">
      <div className="flex items-center mb-4">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600 mr-3">
          <i className={icon}></i>
        </span>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-gray-600 text-sm flex-grow">{description}</p>
      <Link href={link} className="text-primary-600 font-medium mt-4 inline-block text-sm hover:text-primary-700">
        Learn more →
      </Link>
    </div>
  );
};

export default BenefitCard;
