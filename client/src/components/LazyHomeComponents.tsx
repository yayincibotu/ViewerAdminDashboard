import * as React from 'react';
import { lazyLoad } from '@/lib/lazy-loader';
import DeferredContent from '@/components/DeferredContent';

// Lazy loading ile yüklenecek ağır bileşenler
export const LazyTestimonials = lazyLoad(() => import('@/components/Testimonials'), {
  loadingKey: 'testimonials',
  fallback: (
    <div className="w-full p-6 bg-gray-50 rounded-lg animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  )
});

export const LazyFeatures = lazyLoad(() => import('@/components/Features'), {
  loadingKey: 'features',
  fallback: (
    <div className="w-full p-6 bg-gray-50 rounded-lg animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 bg-white rounded-lg shadow-sm">
            <div className="h-10 w-10 bg-gray-200 rounded-full mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  )
});

export const LazyPartners = lazyLoad(() => import('@/components/Partners'), {
  loadingKey: 'partners',
  fallback: (
    <div className="w-full p-6 bg-gray-50 rounded-lg animate-pulse">
      <div className="h-5 bg-gray-200 rounded mb-4 w-1/4 mx-auto"></div>
      <div className="flex flex-wrap justify-center gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-12 w-24 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  )
});

// Render performansı için yüklemeyi geciktiren sarmalayıcı
export const DeferredHomeSection: React.FC<{
  children: React.ReactNode;
  title?: string;
  delay?: number;
}> = ({ children, title, delay = 500 }) => {
  return (
    <DeferredContent 
      defer={delay}
      fallback={
        <div className="w-full p-6 bg-gray-50 rounded-lg animate-pulse">
          {title && <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>}
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      }
    >
      {children}
    </DeferredContent>
  );
};