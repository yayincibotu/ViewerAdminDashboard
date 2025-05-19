import React, { useState, useEffect } from 'react';
import { getOptimizedImageProps, OptimizedImageProps } from '@/utils/imageOptimizer';

/**
 * Optimize edilmiş görüntü bileşeni
 * - Lazy loading
 * - WebP formatı (mümkünse)
 * - Responsive görüntüler
 * - Görüntü optimizasyonu
 * - Estetik blur-up yükleme efekti
 */
const OptimizedImage: React.FC<OptimizedImageProps & { blur?: boolean }> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  loading,
  sizes,
  quality = 80,
  blur = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [localSrc, setLocalSrc] = useState(src);
  
  useEffect(() => {
    // Görüntünün WebP versiyonunu yüklenebiliyorsa kullan
    const supportsWebP = () => {
      const elem = document.createElement('canvas');
      if (elem.getContext && elem.getContext('2d')) {
        return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
      return false;
    };
    
    // Eğer tarayıcı WebP destekliyorsa ve görüntü jpg/png ise, webp'ye dönüştürmeyi dene
    // Bu normal bir projede backend veya CDN tarafında yapılır.
    // Burada sadece konsept gösterimi için yapıyoruz.
    if (supportsWebP() && (src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png'))) {
      // Gerçek bir uygulamada burada WebP versiyonunu yüklerdik
      // Şimdilik değişikliği simüle ediyoruz
      console.log('WebP supported, would convert:', src);
      // setLocalSrc(src.replace(/\.(jpg|jpeg|png)$/, '.webp'));
    }
  }, [src]);
  
  // Görüntü için optimize edilmiş özellikleri al
  const imgProps = getOptimizedImageProps({
    src: localSrc,
    alt,
    width,
    height,
    className: `${className} ${blur && !isLoaded ? 'blur-sm scale-105' : 'blur-0 scale-100'} transition-all duration-500`,
    priority,
    loading,
    sizes,
    quality
  });
  
  return (
    <div className="relative overflow-hidden" style={{width, height: height || 'auto'}}>
      <img 
        {...imgProps} 
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          console.error('Image failed to load:', src);
          // Yedek görüntüye dön
          if (localSrc !== '/images/fallback-image.jpg') {
            setLocalSrc('/images/fallback-image.jpg');
          }
        }}
      />
      
      {/* Görüntü yüklenene kadar blur-up efekti için gölge */}
      {blur && !isLoaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 
                    animate-pulse rounded-md"
          style={{width, height}}
        />
      )}
    </div>
  );
};

export default OptimizedImage;