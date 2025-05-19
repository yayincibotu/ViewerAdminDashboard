/**
 * Görüntü optimizasyon yardımcı işlevleri
 * Sayfa yükleme sürelerini iyileştirmek için görüntüleri optimize eder
 */

// Görüntüleri geciktirme ve lazy loading
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  quality?: number;
}

/**
 * Optimize edilmiş görüntü özelliklerini döndürür
 * @param params Görüntü özellikleri
 * @returns Optimize edilmiş görüntü özellikleri
 */
export function getOptimizedImageProps({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  loading,
  sizes,
  quality = 80
}: OptimizedImageProps): React.ImgHTMLAttributes<HTMLImageElement> {
  return {
    src,
    alt,
    width,
    height,
    className,
    loading: priority ? 'eager' : loading || 'lazy',
    decoding: priority ? 'sync' : 'async',
    fetchPriority: priority ? 'high' : 'auto',
    sizes,
    style: {
      maxWidth: '100%',
      height: 'auto'
    }
  };
}

/**
 * Görüntüleri responsive olarak yüklemek için srcset oluşturur
 * @param baseSrc Görüntünün temel URL'si
 * @param widths Yüklenecek genişlikler
 * @param format Görüntü formatı (webp, jpg, png)
 * @returns srcset ve sizes özellikleri için string
 */
export function generateResponsiveImageSrcSet(
  baseSrc: string,
  widths: number[] = [640, 750, 828, 1080, 1200, 1920],
  format: 'webp' | 'jpg' | 'png' = 'webp'
): string {
  // Bu normal bir web uygulamasında CDN'e farklı boyutlar için istek yaparak çalışır
  // Ancak bu örnekte sadece mevcut görüntüyü kullanacağız ve özelliği simüle edeceğiz
  return widths.map(w => `${baseSrc} ${w}w`).join(', ');
}

/**
 * Bir görüntü galerisi için preload hint'leri oluşturur
 * Bu, tarayıcıya görüntüleri önceden yükleme talimatı verir
 */
export function preloadCriticalImages(imageSrcs: string[]): void {
  if (typeof document === 'undefined') return;

  imageSrcs.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
}

/**
 * Arka plan görüntülerinin optimizasyonu için CSS sınıfı oluşturur
 */
export function getOptimizedBackgroundImage(src: string): string {
  return `
    background-image: url(${src});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  `;
}