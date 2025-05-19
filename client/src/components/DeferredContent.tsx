import * as React from 'react';

interface DeferredContentProps {
  children: React.ReactNode;
  defer?: number; // Milisaniye cinsinden gecikme süresi (varsayılan: 200ms)
  fallback?: React.ReactNode; // Yükleme sırasında gösterilecek yer tutucu
  onVisible?: () => void; // İçerik görünür olduğunda çağrılacak fonksiyon
}

/**
 * DeferredContent - Düşük öncelikli içerikleri gecikme ile yükler
 * Bu bileşen, başlangıç yüklemesinin hızını artırmak için içeriğin gösterimini geciktirir
 * 
 * Kullanım:
 * <DeferredContent defer={500} fallback={<LoadingSpinner />}>
 *   <HeavyComponent />
 * </DeferredContent>
 */
const DeferredContent: React.FC<DeferredContentProps> = ({
  children,
  defer = 200, 
  fallback = null,
  onVisible
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  React.useEffect(() => {
    // Sayfa ilk yüklenirken kritik olmayan içerikleri geciktirerek göster
    const timer = setTimeout(() => {
      setIsVisible(true);
      if (onVisible) {
        onVisible();
      }
    }, defer);

    // Temizleme fonksiyonu
    return () => clearTimeout(timer);
  }, [defer, onVisible]);

  return (
    <>
      {!isVisible && fallback}
      {isVisible && children}
    </>
  );
};

export default DeferredContent;