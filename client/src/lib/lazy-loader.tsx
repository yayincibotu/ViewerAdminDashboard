import React, { lazy, Suspense } from 'react';
import { startPerformanceMeasure, endPerformanceMeasure } from './performance-utils';

// Lazy loading için yükleme göstergesi
const DefaultLoadingComponent = () => (
  <div className="animate-pulse flex space-x-4 p-4">
    <div className="rounded-full bg-slate-200 h-10 w-10"></div>
    <div className="flex-1 space-y-3 py-1">
      <div className="h-2 bg-slate-200 rounded"></div>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-4">
          <div className="h-2 bg-slate-200 rounded col-span-2"></div>
          <div className="h-2 bg-slate-200 rounded col-span-1"></div>
        </div>
        <div className="h-2 bg-slate-200 rounded"></div>
      </div>
    </div>
  </div>
);

/**
 * Ağır bileşenleri lazy loading ile yüklemek için yardımcı fonksiyon.
 * 
 * @param importFunc - Lazy load edilecek modülü import eden fonksiyon
 * @param options - Yapılandırma seçenekleri
 * @returns Lazy loaded React bileşeni
 * 
 * Örnek kullanım:
 * const LazyComponent = lazyLoad(() => import('./HeavyComponent'));
 */
export const lazyLoad = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: {
    fallback?: React.ReactNode;
    onLoad?: () => void;
    loadingKey?: string;
  } = {}
) => {
  const {
    fallback = <DefaultLoadingComponent />,
    onLoad,
    loadingKey = 'component',
  } = options;

  // Performance ölçümü için yükleme izleyicisi ekle
  const LazyComponent = lazy(() => {
    // Yüklemeye başladığında performans ölçümünü başlat
    startPerformanceMeasure(`load-${loadingKey}`);
    
    return importFunc().then(module => {
      // Yükleme tamamlandığında performans ölçümünü sonlandır
      endPerformanceMeasure(`load-${loadingKey}`);
      
      // Yükleme fonksiyonu çağrılmışsa çalıştır
      if (onLoad) {
        setTimeout(onLoad, 0);
      }
      
      return module;
    });
  });

  // Suspense ile sarılmış bileşeni döndür
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Ağır bileşenleri yalnızca görünür olduklarında lazy loading ile yükleyen HOC.
 * 
 * @param importFunc - Lazy load edilecek modülü import eden fonksiyon
 * @param options - Yapılandırma seçenekleri
 * @returns IntersectionObserver ile birlikte çalışan lazy loaded React bileşeni
 */
export const lazyLoadOnVisible = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: {
    fallback?: React.ReactNode;
    rootMargin?: string;
    loadingKey?: string;
  } = {}
) => {
  const {
    fallback = <DefaultLoadingComponent />,
    rootMargin = '100px',
    loadingKey = 'visible-component',
  } = options;

  // LazyComponent tanımını dışarıda tutuyoruz, böylece ref içinden bileşene erişebiliriz
  let LazyComponent: React.LazyExoticComponent<T> | null = null;
  
  return (props: React.ComponentProps<T>) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);
    
    React.useEffect(() => {
      if (!ref.current) return;
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            
            // Bileşen görünür olduğunda, tanımını lazy-load et
            LazyComponent = lazy(() => {
              startPerformanceMeasure(`load-${loadingKey}`);
              return importFunc().then(module => {
                endPerformanceMeasure(`load-${loadingKey}`);
                return module;
              });
            });
            
            // Gözlemlemeyi durdur
            observer.disconnect();
          }
        },
        { rootMargin }
      );
      
      observer.observe(ref.current);
      
      return () => {
        observer.disconnect();
      };
    }, []);
    
    if (!isVisible) {
      return <div ref={ref}>{fallback}</div>;
    }
    
    if (!LazyComponent) {
      LazyComponent = lazy(() => {
        startPerformanceMeasure(`load-${loadingKey}`);
        return importFunc().then(module => {
          endPerformanceMeasure(`load-${loadingKey}`);
          return module;
        });
      });
    }
    
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
};