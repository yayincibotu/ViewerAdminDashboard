import React from 'react';
import { Link } from 'wouter';

interface LogoProps {
  className?: string;
  textColorClass?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '', textColorClass = 'text-blue-500' }) => {
  return (
    <Link href="/">
      <div className={`flex items-center cursor-pointer ${className}`}>
        <div className={`text-xl font-bold ${textColorClass}`}>
          <i className="fas fa-eye mr-2"></i>VIEWERAPPS
        </div>
      </div>
    </Link>
  );
};

export default Logo;
