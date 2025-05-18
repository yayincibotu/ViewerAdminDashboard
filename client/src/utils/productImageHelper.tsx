import React from 'react';
import { FaTwitch, FaYoutube, FaInstagram, FaTiktok, FaFacebook, FaTwitter, FaPlayCircle, FaHeart, FaUserFriends, FaComments, FaShareAlt, FaThumbsUp } from 'react-icons/fa';

// Platform-specific color schemes
const platformColors = {
  twitch: {
    primary: '#9146FF',
    secondary: '#6441a5',
    accent: '#b9a3e3',
  },
  youtube: {
    primary: '#FF0000',
    secondary: '#282828',
    accent: '#ff6666',
  },
  instagram: {
    primary: '#E1306C',
    secondary: '#F56040',
    accent: '#833AB4',
  },
  tiktok: {
    primary: '#000000',
    secondary: '#EE1D52',
    accent: '#69C9D0',
  },
  facebook: {
    primary: '#1877F2',
    secondary: '#3b5998',
    accent: '#8b9dc3',
  },
  twitter: {
    primary: '#1DA1F2',
    secondary: '#14171A',
    accent: '#AAB8C2',
  },
  default: {
    primary: '#2563EB',
    secondary: '#1E40AF',
    accent: '#93C5FD',
  }
};

// Category icons mapping
const categoryIcons: {[key: string]: React.ReactNode} = {
  views: <FaPlayCircle />,
  likes: <FaThumbsUp />,
  followers: <FaUserFriends />,
  comments: <FaComments />,
  shares: <FaShareAlt />,
  hearts: <FaHeart />,
  default: <FaPlayCircle />
};

// Platform icons mapping
const platformIcons: {[key: string]: React.ReactNode} = {
  twitch: <FaTwitch />,
  youtube: <FaYoutube />,
  instagram: <FaInstagram />,
  tiktok: <FaTiktok />,
  facebook: <FaFacebook />,
  twitter: <FaTwitter />,
  default: <FaPlayCircle />
};

/**
 * Generates a gradient SVG background based on platform colors
 */
export const generateProductBackground = (platform: string, category: string): string => {
  // Get color palette (default if platform not found)
  const platformSlug = platform?.toLowerCase() || 'default';
  const colors = platformColors[platformSlug as keyof typeof platformColors] || platformColors.default;
  
  // Create a unique SVG pattern
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:0.9" />
        </linearGradient>
        <pattern id="pattern1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="2" fill="${colors.accent}" fill-opacity="0.3" />
        </pattern>
      </defs>
      <rect width="800" height="400" fill="url(#grad1)" />
      <rect width="800" height="400" fill="url(#pattern1)" />
      <g transform="translate(400, 200) scale(5)">
        <text x="-20" y="0" fill="white" fill-opacity="0.1" font-family="Arial" font-size="24" font-weight="bold">${platformSlug.toUpperCase()}</text>
      </g>
    </svg>
  `;
  
  // Convert to base64 for direct embedding in CSS
  const base64Svg = btoa(svgContent);
  return `data:image/svg+xml;base64,${base64Svg}`;
};

/**
 * Renders a platform icon based on platform slug
 */
export const getPlatformIcon = (platform: string, size = 24): React.ReactNode => {
  const platformSlug = platform?.toLowerCase() || 'default';
  const IconComponent = platformIcons[platformSlug as keyof typeof platformIcons] || platformIcons.default;
  
  return (
    <div className="platform-icon" style={{ fontSize: `${size}px` }}>
      {IconComponent}
    </div>
  );
};

/**
 * Renders a category icon based on category slug
 */
export const getCategoryIcon = (category: string, size = 20): React.ReactNode => {
  const categorySlug = category?.toLowerCase() || 'default';
  const IconComponent = categoryIcons[categorySlug as keyof typeof categoryIcons] || categoryIcons.default;
  
  return (
    <div className="category-icon" style={{ fontSize: `${size}px` }}>
      {IconComponent}
    </div>
  );
};

/**
 * Generates a styled product visual component
 */
export const ProductVisual: React.FC<{
  platform: string;
  category: string;
  name: string;
  className?: string;
}> = ({ platform, category, name, className = '' }) => {
  const platformSlug = platform?.toLowerCase() || 'default';
  const categorySlug = category?.toLowerCase() || 'default';
  const colors = platformColors[platformSlug as keyof typeof platformColors] || platformColors.default;
  
  return (
    <div 
      className={`product-visual relative overflow-hidden rounded-lg ${className}`}
      style={{ 
        backgroundColor: colors.secondary,
        backgroundImage: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        height: '240px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: 'white',
        textAlign: 'center',
        padding: '20px'
      }}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, ${colors.accent} 0%, transparent 50%)`,
        }}></div>
        <div className="grid grid-cols-10 grid-rows-10 h-full w-full">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="opacity-10" style={{
              transform: `rotate(${Math.random() * 360}deg)`,
            }}>
              {Math.random() > 0.7 ? getPlatformIcon(platform, 12) : getCategoryIcon(category, 12)}
            </div>
          ))}
        </div>
      </div>
      
      <div className="z-10 mb-4 text-5xl">
        {getPlatformIcon(platform, 64)}
      </div>
      
      <div className="z-10 flex items-center mb-2 text-xl">
        {getCategoryIcon(category, 24)}
        <span className="ml-2 font-medium">{categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)}</span>
      </div>
      
      <div className="z-10 text-sm max-w-xs opacity-90">
        {name.length > 50 ? name.substring(0, 50) + '...' : name}
      </div>
      
      <div className="absolute bottom-3 right-3 opacity-50 text-xs">
        viewerapps.com
      </div>
    </div>
  );
};

export default {
  generateProductBackground,
  getPlatformIcon,
  getCategoryIcon,
  ProductVisual
};