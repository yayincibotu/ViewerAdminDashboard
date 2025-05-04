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
        <div className={`flex items-center font-bold ${textColorClass}`}>
          <span className="text-blue-500 mr-1">➤</span>
          <span>VIEWERAPPS</span>
        </div>
      </div>
    </Link>
  );
};

export default Logo;
