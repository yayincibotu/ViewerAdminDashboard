/**
 * Performans ve kullanıcı deneyimi optimizasyonu yardımcıları
 * Core Web Vitals ve sayfa hızını iyileştirmek için fonksiyonlar
 */

export interface ImageOptimizationProps {
  src: string;
  width?: number;
  height?: number;
  alt: string;
  quality?: number;
  loading?: 'lazy' | 'eager';
  className?: string;
  placeholderColor?: string;
  style?: React.CSSProperties;
}

/**
 * LCP (Largest Contentful Paint) değerini iyileştirmek için sayfa içinde 
 * kritik ve önemli JS dosyalarını önceden yükler
 */
export const preloadCriticalChunks = () => {
  const preloadLinks = [
    { href: '/src/main.tsx', as: 'script' },
    { href: '/src/App.tsx', as: 'script' },
  ];
  
  preloadLinks.forEach(({ href, as }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  });
};

/**
 * CLS (Cumulative Layout Shift) değerini iyileştirmek için
 * sayfa yüklenirken elementler için yer tutucu (placeholder) ekler
 */
export const reserveSpaceForImage = (width: number, height: number, color = '#f3f4f6') => {
  const style: React.CSSProperties = {
    backgroundColor: color,
    width: `${width}px`,
    height: `${height}px`,
    display: 'block',
  };
  
  return style;
};

/**
 * Lazy loading yöntemiyle optimize edilmiş resim bileşeni
 * Intersection Observer API kullanarak viewport'a giren görüntüleri yükler
 */
export const OptimizedImage: React.FC<ImageOptimizationProps> = ({
  src,
  alt,
  width,
  height,
  quality = 85,
  loading = 'lazy',
  className = '',
  placeholderColor = '#f3f4f6',
  style = {}
}) => {
  // Bu fonksiyon React komponentinde kullanılarak lazy loading uygulanabilir
  const imageStyle = {
    ...style,
    backgroundColor: placeholderColor,
  };
  
  // data-src özelliği lazy loading API için kullanılır, srcset için farklı çözünürlük ekleyebilirsiniz
  return {
    type: 'img',
    props: {
      src,
      alt,
      width,
      height,
      loading,
      className: `optimized-image ${className}`,
      style: imageStyle,
      'data-quality': quality,
      'data-priority': loading === 'eager' ? 'high' : 'low',
    }
  };
};

/**
 * FID (First Input Delay) değerini iyileştirmek için
 * kritik olmayan JS kodlarını gecikmeli olarak çalıştırır
 */
export const deferNonCriticalJS = (callback: () => void, timeout = 1000) => {
  if (typeof window !== 'undefined') {
    // requestIdleCallback öncelikli olarak kullan, desteklenmiyorsa setTimeout kullan
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        callback();
      });
    } else {
      setTimeout(callback, timeout);
    }
  }
};

/**
 * Dinamik içerikleri performanslı şekilde yükler
 * Bu fonksiyon sayfa performansını bozmadan lazy loading yapar
 */
export const lazyLoadComponent = (importFunc: () => Promise<any>, fallbackElement?: JSX.Element) => {
  // React.lazy ve Suspense kullanılmalıdır
  // Bu fonksiyon dinamik içerik importları için kullanılır
  return {
    loader: importFunc,
    fallback: fallbackElement || null
  };
};

/**
 * Tarayıcı önbelleği için Cache-Control header değerlerini optimize eder
 * Bu fonksiyonu server-side rendering kullanıyorsanız kullanabilirsiniz
 */
export const getOptimalCacheControl = (contentType: 'image' | 'style' | 'script' | 'font' | 'api') => {
  const cacheSettings = {
    image: 'public, max-age=86400, stale-while-revalidate=604800', // 1 gün cache, 7 gün stale-while-revalidate
    style: 'public, max-age=31536000, immutable', // 1 yıl cache, değişmezse
    script: 'public, max-age=31536000, immutable',
    font: 'public, max-age=31536000, immutable',
    api: 'private, max-age=0, must-revalidate' // API önbelleğe alınmamalı
  };
  
  return cacheSettings[contentType];
};

/**
 * Core Web Vitals metriklerini toplamak için yardımcı fonksiyon
 * Bu veriler performans iyileştirmeleri için kullanılabilir
 */
export const collectWebVitals = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Web Vitals API erişimi
    // performance.getEntriesByType ve PerformanceObserver kullanılır
    try {
      // First Contentful Paint (FCP)
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcpEntry) {
        console.debug('FCP:', fcpEntry.startTime);
      }
      
      // PerformanceObserver ile LCP, FID, CLS metriklerini topla
      if ('PerformanceObserver' in window) {
        // LCP observer
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.debug('LCP:', lastEntry.startTime);
        });
        
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        
        // Layout shift observer
        const clsObserver = new PerformanceObserver((entryList) => {
          let clsValue = 0;
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          console.debug('CLS:', clsValue);
        });
        
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        
        // First Input Delay observer
        const fidObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            const delay = (entry as any).processingStart - (entry as any).startTime;
            console.debug('FID:', delay);
          }
        });
        
        fidObserver.observe({ type: 'first-input', buffered: true });
      }
    } catch (error) {
      console.error('Error collecting web vitals:', error);
    }
  }
};

/**
 * Kritik CSS içeriklerini satır içi (inline) ekleyerek LCP değerini iyileştirir
 */
export const injectCriticalCSS = (cssContent: string) => {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.setAttribute('data-critical', 'true');
    style.textContent = cssContent;
    document.head.appendChild(style);
  }
};

/**
 * LCP için önemli resimleri önceden yükler
 */
export const preloadLCPImage = (imageUrl: string) => {
  if (typeof document !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = imageUrl;
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
  }
};

/**
 * Resim boyutlarını otomatik olarak optimize eder
 */
export const getOptimizedImageUrl = (originalUrl: string, width: number, quality = 80) => {
  // CDN kullanıyorsanız burada CDN'in resim optimizasyonu parametrelerini ekleyebilirsiniz
  // Örnek: Cloudinary, Imgix gibi servisler için
  
  if (originalUrl.startsWith('http')) {
    // Burada bir resim optimizasyon servisi kullanılabilir
    return originalUrl;
  }
  
  // Yerel resimlere genişlik ve kalite parametreleri ekler
  return `${originalUrl}?w=${width}&q=${quality}`;
};

/**
 * Tüm site performansı optimizasyonlarını uygulayan başlatma fonksiyonu
 */
export const initPerformanceOptimizations = () => {
  if (typeof window !== 'undefined') {
    // Sayfa yüklendiğinde performans optimizasyonlarını başlat
    window.addEventListener('load', () => {
      // Kritik olmayan JS'leri gecikmeli yükle
      deferNonCriticalJS(() => {
        // Analytics, reklam kodu gibi kritik olmayan script'leri burada yükle
        console.debug('Non-critical scripts loaded');
      });
      
      // Web Vitals metriklerini topla
      collectWebVitals();
    });
    
    // Intersection Observer ile lazy loading uygula
    if ('IntersectionObserver' in window) {
      const lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const lazyImage = entry.target as HTMLImageElement;
            if (lazyImage.dataset.src) {
              lazyImage.src = lazyImage.dataset.src;
              lazyImage.removeAttribute('data-src');
              lazyImageObserver.unobserve(lazyImage);
            }
          }
        });
      });
      
      // Lazy loading uygulanacak tüm resim elementlerini gözle
      document.querySelectorAll('img[data-src]').forEach(img => {
        lazyImageObserver.observe(img);
      });
    }
  }
};