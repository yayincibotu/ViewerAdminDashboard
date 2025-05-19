/**
 * Performans iyileştirmelerini içeren yardımcı fonksiyonlar
 */

// Görüntü önbelleğe alma (preloading) için yardımcı fonksiyon
export const preloadImages = (imageUrls: string[]) => {
  imageUrls.forEach((src) => {
    if (typeof window !== 'undefined') {
      const img = new Image();
      img.src = src;
    }
  });
};

// Öncelikli yükleme için kritik CSS sınıflarını belirleyen fonksiyon
export const getCriticalStyles = () => {
  return `
    .critical-component {
      display: block !important;
      visibility: visible !important;
    }
  `;
};

// Sayfa yükleme süresi ölçümü için performans işaretleri (performance marks)
export const startPerformanceMeasure = (markName: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    window.performance.mark(`${markName}-start`);
  }
};

export const endPerformanceMeasure = (markName: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    window.performance.mark(`${markName}-end`);
    window.performance.measure(
      markName,
      `${markName}-start`,
      `${markName}-end`
    );
    const measurements = window.performance.getEntriesByName(markName, 'measure');
    if (measurements.length > 0) {
      console.log(`${markName} took ${measurements[0].duration.toFixed(2)}ms`);
    }
  }
};

// Ekranın görünür alanını belirleyen yardımcı fonksiyon
export const isInViewport = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

// LocalStorage önbelleği için yardımcı fonksiyonlar 
export const cacheToLocalStorage = (key: string, data: any, expiryMinutes: number = 60) => {
  try {
    const item = {
      data,
      expiry: new Date().getTime() + expiryMinutes * 60 * 1000
    };
    localStorage.setItem(key, JSON.stringify(item));
    return true;
  } catch (error) {
    console.error('LocalStorage cache write error:', error);
    return false;
  }
};

export const getFromLocalStorageCache = (key: string) => {
  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    const now = new Date().getTime();
    
    // Önbellek süresi dolmuşsa, öğeyi kaldır ve null döndür
    if (now > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.data;
  } catch (error) {
    console.error('LocalStorage cache read error:', error);
    return null;
  }
};

// Sayfa iyileştirme önizlemesi için kod
export const calculatePageWeight = async () => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Sayfa ağırlığı hesapla
    const resources = window.performance.getEntriesByType('resource');
    let totalBytes = 0;
    
    resources.forEach((resource: any) => {
      if (resource.transferSize) {
        totalBytes += resource.transferSize;
      }
    });
    
    // JavaScript yükleme süresi
    const jsResources = resources.filter((res: any) => 
      res.name.endsWith('.js') || res.name.includes('javascript')
    );
    const jsLoadTime = jsResources.reduce((total: number, res: any) => 
      total + res.duration, 0
    );
    
    // CSS yükleme süresi
    const cssResources = resources.filter((res: any) => 
      res.name.endsWith('.css') || res.name.includes('stylesheet')
    );
    const cssLoadTime = cssResources.reduce((total: number, res: any) => 
      total + res.duration, 0
    );
    
    // Görüntü sayısı ve toplam boyutu
    const imageResources = resources.filter((res: any) => 
      res.name.endsWith('.png') || 
      res.name.endsWith('.jpg') || 
      res.name.endsWith('.jpeg') || 
      res.name.endsWith('.webp') || 
      res.name.endsWith('.gif') || 
      res.name.endsWith('.svg')
    );
    
    const imageLoadTime = imageResources.reduce((total: number, res: any) => 
      total + res.duration, 0
    );
    
    const imageCount = imageResources.length;
    const imageBytes = imageResources.reduce((total: number, res: any) => 
      total + (res.transferSize || 0), 0
    );
    
    return {
      totalBytes: (totalBytes / 1024 / 1024).toFixed(2) + ' MB',
      jsLoadTime: jsLoadTime.toFixed(2) + ' ms',
      cssLoadTime: cssLoadTime.toFixed(2) + ' ms',
      imageLoadTime: imageLoadTime.toFixed(2) + ' ms',
      imageCount,
      imageBytes: (imageBytes / 1024 / 1024).toFixed(2) + ' MB'
    };
  } catch (error) {
    console.error('Error calculating page metrics:', error);
    return null;
  }
};