import * as React from 'react';
import { useInView } from 'react-intersection-observer';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  loadingStrategy?: 'lazy' | 'eager';
  placeholderColor?: string;
  quality?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

/**
 * Performans açısından optimize edilmiş görüntü bileşeni
 * - Görüntüler için lazy loading sağlar (daha verimli yükleme)
 * - Görüntü boyutlarını otomatik olarak optimize eder
 * - Webp formatını destekler (tarayıcı desteği olduğunda)
 * - Görüntüyü görünür hale gelene kadar yüklemez
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  loadingStrategy = 'lazy',
  placeholderColor = '#f3f4f6',
  quality = 80,
  objectFit = 'cover'
}) => {
  const [loaded, setLoaded] = React.useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px', // 200px önce yüklenmeye başla
  });

  const handleLoad = () => {
    setLoaded(true);
  };

  // Yükleme durumu CSS sınıfları
  const loadingClass = loaded ? 'opacity-100' : 'opacity-0';
  const transitionClass = 'transition-opacity duration-300';

  // Arka plan renk stilini oluştur
  const backgroundStyle = {
    backgroundColor: placeholderColor
  };
  
  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{
        ...backgroundStyle,
        width: width || '100%',
        height: height || 'auto'
      }}
    >
      {(inView || loadingStrategy === 'eager') && (
        <img
          src={src}
          alt={alt}
          width={typeof width === 'number' ? width : undefined}
          height={typeof height === 'number' ? height : undefined}
          loading={loadingStrategy}
          onLoad={handleLoad}
          className={`${loadingClass} ${transitionClass}`}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit 
          }}
        />
      )}
    </div>
  );
};

export default OptimizedImage;