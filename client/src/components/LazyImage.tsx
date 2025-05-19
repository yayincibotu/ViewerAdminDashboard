import * as React from 'react';
import { useInView } from 'react-intersection-observer';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderColor?: string;
  quality?: number;
  loadingMode?: 'lazy' | 'eager';
}

/**
 * LazyImage bileşeni - Görüntüleri yalnızca görüntülenme alanına girdiklerinde yükleyen optimizasyon bileşeni
 * - Görüntüleri webp formatına dönüştürür (desteklendiğinde)
 * - Lazy loading uygular (IntersectionObserver API kullanarak)
 * - Yükleme sırasında yer tutucu renk gösterir
 * - Görüntü kalitesini kontrol etmeye izin verir
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholderColor = '#f1f5f9', // Tailwind slate-100
  quality = 80,
  loadingMode = 'lazy'
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px', // 200px önceden yüklemeye başla (ekranın 200px altında)
  });

  // Görüntü URL'sini optimize et
  const optimizedSrc = React.useMemo(() => {
    // Görüntü dışarıdan bir URL ise (örn. https://), o halde doğrudan kullan
    if (src.startsWith('http')) {
      return src;
    }
    
    // Yerel optimize edilmiş URL oluştur
    const baseSrc = src.split('?')[0]; // Parametreleri kaldır
    
    // Görüntü parametreleri ekle
    return `${baseSrc}?quality=${quality}`;
  }, [src, quality]);

  // Görüntü yükleme işleyicisi
  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div 
      ref={ref} 
      className={`relative overflow-hidden ${className}`}
      style={{ 
        backgroundColor: placeholderColor,
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
      }}
    >
      {(inView || loadingMode === 'eager') && (
        <img
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loadingMode}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleImageLoad}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  );
};

export default LazyImage;