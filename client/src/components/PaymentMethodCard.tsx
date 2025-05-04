import React from 'react';
import { Link } from 'wouter';

interface PaymentMethodCardProps {
  title: string;
  description: string;
  iconClass: string;
  bgColor: string;
  methodIcons: { icon: string; color: string }[];
  securityText: string;
  securityIcon: string;
  imageSrc: string;
  imageAlt: string;
  buttonText: string;
  buttonLink: string;
  buttonBgColor: string;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  title,
  description,
  iconClass,
  bgColor,
  methodIcons,
  securityText,
  securityIcon,
  imageSrc,
  imageAlt,
  buttonText,
  buttonLink,
  buttonBgColor,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
      <div className="flex items-center mb-4">
        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${bgColor} text-white mr-3`}>
          <i className={iconClass}></i>
        </span>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <p className="text-gray-600 mb-6">{description}</p>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-3">
          {methodIcons.map((method, index) => (
            <i key={index} className={`${method.icon} text-2xl ${method.color}`}></i>
          ))}
        </div>
        <span className="text-green-600 flex items-center">
          <i className={`${securityIcon} mr-1`}></i> {securityText}
        </span>
      </div>
      
      <img 
        src={imageSrc} 
        alt={imageAlt} 
        className="w-full h-48 object-cover rounded-lg mb-6" 
      />
      
      <Link href={buttonLink}>
        <a className={`block w-full py-3 text-center ${buttonBgColor} text-white rounded-md font-medium transition`}>
          {buttonText}
        </a>
      </Link>
    </div>
  );
};

export default PaymentMethodCard;
