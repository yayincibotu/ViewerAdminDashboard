import React, { lazy, Suspense } from 'react';

// Anasayfa bileşenlerini tembel yükleme için
// HeroSection ve PlatformCard gibi görünür alanlarda kullanılan bileşenler kritik, onları normal import etmeliyiz

// HeroSection yükleme sırasında görünür olduğu için lazy loading kullanmıyoruz
// export const LazyHeroSection = lazy(() => import('./HeroSection'));

// Tembelce yüklenen bileşenler - her biri için ayrı hata yönetimi
export const LazyFeatureCard = lazy(() => 
  import('./FeatureCard').catch(() => {
    console.error('Failed to load FeatureCard component');
    return { default: () => <div>Failed to load feature card</div> };
  })
);

export const LazyPlatformCard = lazy(() => 
  import('./PlatformCard').catch(() => {
    console.error('Failed to load PlatformCard component');
    return { default: () => <div>Failed to load platform card</div> };
  })
);

export const LazyBenefitCard = lazy(() => 
  import('./BenefitCard').catch(() => {
    console.error('Failed to load BenefitCard component');
    return { default: () => <div>Failed to load benefit card</div> };
  })
);

export const LazyPricingCard = lazy(() => 
  import('./PricingCard').catch(() => {
    console.error('Failed to load PricingCard component');
    return { default: () => <div>Failed to load pricing card</div> };
  })
);

export const LazyPaymentMethodCard = lazy(() => 
  import('./PaymentMethodCard').catch(() => {
    console.error('Failed to load PaymentMethodCard component');
    return { default: () => <div>Failed to load payment method card</div> };
  })
);

/**
 * Lazy loading için yükleme göstergesi
 */
export const LazyLoadComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg p-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2.5"></div>
          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
};

/**
 * Tembelce yüklenen ve optimize edilmiş FeatureCard bileşeni
 */
export const OptimizedFeatureCard: React.FC<any> = (props) => {
  return (
    <LazyLoadComponent>
      <LazyFeatureCard {...props} />
    </LazyLoadComponent>
  );
};

/**
 * Tembelce yüklenen ve optimize edilmiş PlatformCard bileşeni
 */
export const OptimizedPlatformCard: React.FC<any> = (props) => {
  return (
    <LazyLoadComponent>
      <LazyPlatformCard {...props} />
    </LazyLoadComponent>
  );
};

/**
 * Tembelce yüklenen ve optimize edilmiş BenefitCard bileşeni
 */
export const OptimizedBenefitCard: React.FC<any> = (props) => {
  return (
    <LazyLoadComponent>
      <LazyBenefitCard {...props} />
    </LazyLoadComponent>
  );
};

/**
 * Tembelce yüklenen ve optimize edilmiş PricingCard bileşeni
 */
export const OptimizedPricingCard: React.FC<any> = (props) => {
  return (
    <LazyLoadComponent>
      <LazyPricingCard {...props} />
    </LazyLoadComponent>
  );
};

/**
 * Tembelce yüklenen ve optimize edilmiş PaymentMethodCard bileşeni
 */
export const OptimizedPaymentMethodCard: React.FC<any> = (props) => {
  return (
    <LazyLoadComponent>
      <LazyPaymentMethodCard {...props} />
    </LazyLoadComponent>
  );
};