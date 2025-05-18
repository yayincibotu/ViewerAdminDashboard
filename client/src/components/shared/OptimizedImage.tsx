import React, { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  placeholderColor?: string;
  priority?: boolean;
  lazyBoundary?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
  onLoad?: () => void;
  style?: React.CSSProperties;
}

/**
 * OptimizedImage - A component for rendering images with web vitals optimizations
 * Features:
 * - Lazy loading
 * - Placeholder during loading to prevent CLS
 * - Image dimensions to reserve space
 * - Blurred placeholder option
 * - Priority loading for LCP images
 * - Error handling and fallback
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholderColor = '#f3f4f6',
  priority = false,
  lazyBoundary = '200px',
  fetchPriority = 'auto',
  onLoad,
  style = {}
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    setError(false);
    
    const currentImg = imgRef.current;
    
    // Support native lazy loading
    if (!priority && 'loading' in HTMLImageElement.prototype) {
      if (currentImg) {
        currentImg.loading = 'lazy';
      }
    } else if (priority && 'fetchpriority' in HTMLImageElement.prototype) {
      // Use fetchpriority for important images
      if (currentImg) {
        // @ts-ignore - fetchpriority is not in the current TypeScript definitions
        currentImg.fetchpriority = 'high';
      }
    }
    
    // Use Intersection Observer for custom lazy loading on browsers without native support
    if (!priority && !('loading' in HTMLImageElement.prototype) && currentImg) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              if (currentImg) {
                // Actually start loading the image
                if (currentImg.dataset.src) {
                  currentImg.src = currentImg.dataset.src;
                }
                observer.unobserve(entry.target);
              }
            }
          });
        },
        { rootMargin: lazyBoundary }
      );
      
      observer.observe(currentImg);
      
      return () => {
        if (currentImg) {
          observer.unobserve(currentImg);
        }
      };
    }
  }, [src, priority, lazyBoundary]);
  
  // Compute placeholder dimensions to prevent CLS
  const placeholderStyle: React.CSSProperties = {
    backgroundColor: placeholderColor,
    ...(typeof width === 'number' ? { width: `${width}px` } : width ? { width } : {}),
    ...(typeof height === 'number' ? { height: `${height}px` } : height ? { height } : {}),
    display: 'block',
    ...style
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleImageError = () => {
    setError(true);
  };

  // If the image has an error, show a placeholder with an error indicator
  if (error) {
    return (
      <div
        className={`optimized-image-error ${className}`}
        style={{
          ...placeholderStyle,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#ef4444',
          fontSize: '14px'
        }}
        aria-label={`Failed to load image: ${alt}`}
      >
        <span>Image Failed to Load</span>
      </div>
    );
  }

  // The loading strategy changes based on priority
  return (
    <>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`optimized-image ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        style={{
          ...placeholderStyle,
          transition: 'opacity 0.3s ease-in-out',
          objectFit: 'cover',
        }}
        data-priority={priority ? 'high' : 'low'}
      />
      
      {/* Transparent SVG for aspect ratio placeholder (to prevent CLS) */}
      {(!isLoaded && !error) && (width && height) && (
        <svg
          width={typeof width === 'number' ? width : '100%'}
          height={typeof height === 'number' ? height : '100%'}
          style={{
            ...placeholderStyle,
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: -1,
            backgroundColor: placeholderColor,
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default OptimizedImage;