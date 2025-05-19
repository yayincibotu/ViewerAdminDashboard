import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderSize?: 'small' | 'medium' | 'large';
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

/**
 * OptimizedImage Component
 * 
 * Provides optimized image loading with:
 * - Lazy loading
 * - WebP support detection
 * - Blur-up image loading
 * - Fixed dimensions to prevent CLS
 * - Responsive images
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  placeholderSize = 'small',
  priority = false,
  objectFit = 'cover',
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [supportsWebP, setSupportsWebP] = useState(false);
  
  useEffect(() => {
    // Check for WebP support
    const checkWebP = () => {
      const canvas = document.createElement('canvas');
      if (canvas.getContext && canvas.getContext('2d')) {
        // WebP detection
        canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
          ? setSupportsWebP(true)
          : setSupportsWebP(false);
      } else {
        setSupportsWebP(false);
      }
    };
    
    checkWebP();
  }, []);
  
  // Determine if image is external
  const isExternalImage = src.startsWith('http') || src.startsWith('//');
  
  // Get optimized image URL
  const getOptimizedImageUrl = () => {
    if (isExternalImage) {
      // Can't optimize external images directly
      return src;
    }
    
    // For internal images, check if WebP is supported
    if (supportsWebP && !src.includes('.svg') && !src.includes('.webp')) {
      // Convert to WebP if supported and not already WebP or SVG
      const baseSrc = src.split('.').slice(0, -1).join('.');
      return `${baseSrc}.webp`;
    }
    
    return src;
  };
  
  // Create placeholder gradient based on size
  const getPlaceholderStyle = () => {
    const colors = {
      small: 'rgba(229, 231, 235, 0.3)',
      medium: 'rgba(209, 213, 219, 0.5)',
      large: 'rgba(156, 163, 175, 0.7)'
    };
    
    return {
      backgroundColor: colors[placeholderSize],
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: loaded ? 0 : 1,
      transition: 'opacity 0.3s ease-in-out'
    };
  };
  
  return (
    <div 
      className={cn("relative overflow-hidden", className)}
      style={{ 
        width: width ? `${width}px` : '100%', 
        height: height ? `${height}px` : 'auto',
        aspectRatio: width && height ? `${width} / ${height}` : 'auto'
      }}
    >
      <div style={getPlaceholderStyle()} aria-hidden="true" />
      <img
        src={getOptimizedImageUrl()}
        alt={alt}
        width={width}
        height={height}
        onLoad={() => setLoaded(true)}
        loading={priority ? 'eager' : 'lazy'}
        style={{
          objectFit,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          width: '100%',
          height: '100%'
        }}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;