import React, { lazy, Suspense } from 'react';

// Ağır bileşenleri ayrı ayrı lazy-load için import ediyoruz
export const LazyProductComparison = lazy(() => import('./ProductComparison'));
export const LazyProductReviews = lazy(() => import('./ProductReviews'));
export const LazyProductFaq = lazy(() => import('./ProductFaq'));

interface LazyLoadComponentProps {
  children: React.ReactNode;
}

/**
 * Suspense ile sarılmış lazy loading bileşeni
 * Herhangi bir lazy-loaded bileşeni sarmalamak için kullanılabilir
 */
export const LazyLoadComponent: React.FC<LazyLoadComponentProps> = ({ children }) => {
  return (
    <Suspense
      fallback={
        <div className="w-full p-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded-md mb-4"></div>
          <div className="h-32 bg-gray-100 rounded-md"></div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
};

/**
 * Tembelce ProductComparison bileşenini yükler
 */
export const OptimizedProductComparison: React.FC<any> = (props) => {
  return (
    <LazyLoadComponent>
      <LazyProductComparison {...props} />
    </LazyLoadComponent>
  );
};

/**
 * Tembelce ProductReviews bileşenini yükler
 */
export const OptimizedProductReviews: React.FC<any> = (props) => {
  return (
    <LazyLoadComponent>
      <LazyProductReviews {...props} />
    </LazyLoadComponent>
  );
};

/**
 * Tembelce ProductFaq bileşenini yükler
 */
export const OptimizedProductFaq: React.FC<any> = (props) => {
  return (
    <LazyLoadComponent>
      <LazyProductFaq {...props} />
    </LazyLoadComponent>
  );
};