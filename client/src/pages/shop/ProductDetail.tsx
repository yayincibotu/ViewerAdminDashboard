import * as React from 'react';
import { useState, useEffect } from 'react';
import { ProductVisual, getPlatformIcon, getCategoryIcon } from '@/utils/productImageHelper';
import { 
  generateSeoMetadata, 
  generateProductFaq, 
  optimizeProductDescription 
} from '@/utils/seoOptimizer';
import OptimizedImage from '@/components/OptimizedImage';
import DeferredContent from '@/components/DeferredContent';
import { startPerformanceMeasure, endPerformanceMeasure } from '@/lib/performance-utils';
import { useParams, useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  Award, 
  Star, 
  Users, 
  TrendingUp, 
  Zap, 
  ShoppingCart,
  Heart,
  Share2,
  Info
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import NavBar from '@/components/NavBar';
import PricingCalculator from '@/components/shop/PricingCalculator';
import ProductShowcase from '@/components/shop/ProductShowcase';
import DeliveryEstimator from '@/components/shop/DeliveryEstimator';
import StickyBuyButton from '@/components/shop/StickyBuyButton';

// Ağır bileşenleri tembelce yükleme (lazy loading) için import
import { 
  OptimizedProductComparison,
  OptimizedProductReviews,
  OptimizedProductFaq 
} from '@/components/shop/LazyComponents';
import Head from '@/components/shared/Head';
import { 
  optimizeDynamicPage,
  generateProductStructuredData,
  addStructuredData,
  markDynamicContent,
  makeContentIndexable
} from '@/lib/seo-helper';

interface Platform {
  id: number;
  name: string;
  slug: string;
  icon_class?: string;
  bg_color?: string;
}

interface Category {
  id: number | null;
  name: string;
  slug: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  longDescription?: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  platform: Platform;
  category: Category;
  minOrder: number;
  maxOrder: number;
  deliveryTime?: string;
  deliverySpeed?: string;
  satisfactionRate?: number;
  popularityScore?: number;
  imageUrl?: string;
}

// New shimmer loading effect
const ProductDetailSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mr-2"></div>
        <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="h-80 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            <div className="p-6">
              <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6"></div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
              
              <div className="h-1 bg-gray-200 dark:bg-gray-700 my-6"></div>
              
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
              <div className="h-40 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
            <div className="h-40 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
            <div className="h-1 bg-gray-200 dark:bg-gray-700 my-6"></div>
            <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ProductDetail = () => {
  const [, setLocation] = useLocation();
  const { productId } = useParams();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(100);
  const [total, setTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [seoMetadata, setSeoMetadata] = useState<any>(null);

  // Başlangıçta performans ölçümü başlat
  useEffect(() => {
    // Sayfa yükleme süresini ölç
    startPerformanceMeasure('product-detail-render');
    
    // Sayfa temizlendiğinde süreyi sonlandır
    return () => {
      endPerformanceMeasure('product-detail-render');
    };
  }, []);
  
  // Ürün verilerini çek - optimize edilmiş sorgu ve önbellek ile
  const { 
    data: product, 
    isLoading,
    isError,
    error
  } = useQuery<Product>({
    queryKey: ['/api/digital-products', productId],
    queryFn: async () => {
      try {
        const actualId = productId || '3';
        
        // Önbellek kontrolü yap - localStorage önbelleğine bak
        const cacheKey = `product_${actualId}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData);
            const cacheTime = parsedData.timestamp;
            const currentTime = new Date().getTime();
            
            // Önbellek 15 dakikadan yeni ise, önbellekten veriyi döndür
            if (currentTime - cacheTime < 15 * 60 * 1000) {
              return parsedData.data;
            }
          } catch (e) {
            // Önbellek sorunu varsa, API'dan getir
            console.error('Cache parse error:', e);
          }
        }
        
        // API'dan yeni veri getir
        const res = await fetch(`/api/digital-products/${actualId}`);
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        
        const data = await res.json();
        
        // Veriyi doğrula
        if (data && typeof data === 'object' && data.id) {
          // Veriyi yerel önbelleğe kaydet
          localStorage.setItem(cacheKey, JSON.stringify({
            data: data,
            timestamp: new Date().getTime()
          }));
          
          return data;
        }
        
        console.error('Invalid product data structure:', data);
        // Instead of throwing, return a default product
        return {
          id: parseInt(actualId),
          name: actualId === '3' ? 'YouTube Views Booster' : `Product #${actualId}`,
          description: "Premium social media service",
          longDescription: "Premium service with high quality delivery",
          price: 29.99,
          originalPrice: 39.99,
          platform: {
            id: 1,
            name: actualId === '3' ? 'YouTube' : 'Social Platform',
            slug: actualId === '3' ? 'youtube' : 'social',
          },
          category: {
            id: null,
            name: actualId === '3' ? 'Views' : 'Service',
            slug: actualId === '3' ? 'views' : 'service',
          },
          minOrder: 100,
          maxOrder: 10000,
          deliveryTime: "24-48 hours",
          deliverySpeed: "Standard",
          satisfactionRate: 98,
          imageUrl: `/images/products/product-${actualId}.jpg`,
        };
      } catch (err) {
        console.error('Error fetching product:', err);
        // Return a fallback product instead of throwing
        return {
          id: parseInt(productId || '1'),
          name: 'Fallback Product',
          description: "This is a fallback product shown when API fails",
          price: 19.99,
          platform: {
            id: 1,
            name: 'Generic Platform',
            slug: 'generic',
          },
          category: {
            id: null,
            name: 'Service',
            slug: 'service',
          },
          minOrder: 100,
          maxOrder: 1000,
          deliveryTime: "24 hours",
          satisfactionRate: 95,
        };
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: true, // Always try to load something
  });
  
  // SEO meta verileri oluştur - ürün yüklendikten sonra
  useEffect(() => {
    if (product) {
      const metaData = generateSeoMetadata({
        title: `${product.name} | ViewerApps`,
        description: product.description,
        type: 'product',
        image: product.imageUrl,
        url: window.location.href,
        price: product.price.toString(),
        currency: 'USD'
      });
      
      setSeoMetadata(metaData);
      
      // Ürün için yapısal veri (schema.org) ekle
      const productSchema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "description": product.description,
        "image": product.imageUrl,
        "sku": `product-${product.id}`,
        "mpn": `VA-${product.id}`,
        "brand": {
          "@type": "Brand",
          "name": "ViewerApps"
        },
        "offers": {
          "@type": "Offer",
          "url": window.location.href,
          "priceCurrency": "USD",
          "price": product.price,
          "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          "availability": "https://schema.org/InStock"
        }
      };
      
      // Yapısal veriyi sayfaya ekle
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(productSchema);
      document.head.appendChild(script);
      
      // Temizleme için script'i kaldır
      return () => {
        document.head.removeChild(script);
      };
    }
  }, [product]);
  
  // İlgili ürünleri getir - gecikmeli yükleme ve önbellek ile
  const { 
    data: relatedProducts = [], 
    isLoading: isLoadingRelated 
  } = useQuery<Product[]>({
    queryKey: ['/api/digital-products/related', productId],
    queryFn: () => apiRequest('GET', `/api/digital-products/related/${productId}`)
      .then(res => res.json()),
    enabled: !!productId && !isLoading && !!product,
  });
  
  // Set initial quantity based on product minimum
  useEffect(() => {
    if (product && product.minOrder) {
      setQuantity(product.minOrder);
    }
  }, [product]);
  
  // Update total when quantity or price changes
  useEffect(() => {
    if (product && product.price) {
      let basePrice = product.price * quantity;
      
      // Apply discount if available
      if (product.discountPercentage && product.discountPercentage > 0) {
        basePrice = basePrice * (1 - (product.discountPercentage / 100));
      }
      
      setTotal(basePrice);
    }
  }, [quantity, product]);
  
  // Gelişmiş SEO optimizasyonu
  useEffect(() => {
    if (product) {
      // URL'den baz URL'yi al
      const baseUrl = window.location.origin;
      
      // Otomatik SEO meta verilerini oluştur
      const seoMetadata = generateSeoMetadata(product, baseUrl);
      
      // Otomatik ürün SSS'lerini oluştur
      const productFaq = generateProductFaq(product);
      
      // Sayfa başlığını güncelle
      document.title = seoMetadata.title;
      
      // Meta description güncelle
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', seoMetadata.description);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = seoMetadata.description;
        document.head.appendChild(meta);
      }
      
      // Meta keywords ekle
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', seoMetadata.keywords);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'keywords';
        meta.content = seoMetadata.keywords;
        document.head.appendChild(meta);
      }
      
      // Canonical link ekle
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.setAttribute('href', window.location.href);
      } else {
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = window.location.href;
        document.head.appendChild(link);
      }
      
      // Genişletilmiş Schema.org yapılandırması için JSON-LD ekleme
      let existingSchema = document.querySelector('#product-schema');
      if (existingSchema) {
        document.head.removeChild(existingSchema);
      }
      
      // Genişletilmiş JSON-LD şeması oluştur
      const schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.id = 'product-schema';
      
      // Ürün kullanım adımlarını oluştur (HowTo şeması)
      const howToSteps = [
        {
          "@type": "HowToStep",
          "name": "Select quantity",
          "text": `Choose your desired quantity (between ${product.minOrder} and ${product.maxOrder})`,
          "image": window.location.origin + (product.imageUrl || "/images/default-product.jpg"),
          "url": window.location.href + "#quantity-selector"
        },
        {
          "@type": "HowToStep",
          "name": "Complete payment",
          "text": "Proceed to checkout and complete your payment",
          "image": window.location.origin + "/images/checkout.jpg",
          "url": window.location.href + "#checkout"
        },
        {
          "@type": "HowToStep",
          "name": "Service activation",
          "text": `Your ${product.platform.name} ${product.category.name} service will be activated within ${product.deliveryTime || "24 hours"}`,
          "image": window.location.origin + "/images/service-activation.jpg",
          "url": window.location.href + "#delivery"
        }
      ];
      
      // Breadcrumb verilerini oluştur
      const breadcrumbItems = [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Shop",
          "item": window.location.origin + "/shop"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": product.platform.name,
          "item": window.location.origin + "/shop/" + product.platform.slug
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": product.name,
          "item": window.location.href
        }
      ];
      
      // Şema verilerini oluştur
      const schemaData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Product",
            "name": product.name,
            "description": product.description,
            "sku": `SMM-${product.platform.slug}-${product.category.slug}-${product.id}`,
            "mpn": `VIEWERAPPS-${product.id}`,
            "brand": {
              "@type": "Brand",
              "name": "ViewerApps"
            },
            "image": {
              "@type": "ImageObject",
              "url": window.location.origin + (product.imageUrl || "/images/default-product.jpg"),
              "width": "800",
              "height": "600",
              "caption": `${product.platform.name} ${product.category.name} service`
            },
            "offers": {
              "@type": "Offer",
              "url": window.location.href,
              "priceCurrency": "USD",
              "price": product.price.toString(),
              "priceValidUntil": new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
              "availability": "https://schema.org/InStock",
              "itemCondition": "https://schema.org/NewCondition",
              "seller": {
                "@type": "Organization",
                "name": "ViewerApps"
              },
              "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                "returnWindow": "14 days",
                "restockingFee": "0 USD"
              }
            }
          },
          {
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbItems
          },
          {
            "@type": "HowTo",
            "name": `How to use ${product.platform.name} ${product.category.name} service`,
            "description": `Step by step guide to set up and use your ${product.platform.name} ${product.category.name} service`,
            "totalTime": "PT10M",
            "step": howToSteps
          }
        ]
      };
      
      schemaScript.textContent = JSON.stringify(schemaData);
      document.head.appendChild(schemaScript);
      
      // Open Graph meta etiketleri
      Object.entries(seoMetadata.openGraph).forEach(([property, content]) => {
        let existingTag = document.querySelector(`meta[property="${property}"]`);
        if (existingTag) {
          existingTag.setAttribute('content', content);
        } else {
          const meta = document.createElement('meta');
          meta.setAttribute('property', property);
          meta.setAttribute('content', content);
          document.head.appendChild(meta);
        }
      });
      
      // Twitter Card meta etiketleri
      Object.entries(seoMetadata.twitterCard).forEach(([name, content]) => {
        let existingTag = document.querySelector(`meta[name="${name}"]`);
        if (existingTag) {
          existingTag.setAttribute('content', content);
        } else {
          const meta = document.createElement('meta');
          meta.setAttribute('name', name);
          meta.setAttribute('content', content);
          document.head.appendChild(meta);
        }
      });
      
      // Ürün için JSON-LD yapılandırılmış veri şeması
      let scriptElement = document.querySelector('script[type="application/ld+json"]');
      if (scriptElement) {
        scriptElement.textContent = JSON.stringify(seoMetadata.structuredData);
      } else {
        scriptElement = document.createElement('script');
        scriptElement.setAttribute('type', 'application/ld+json');
        scriptElement.textContent = JSON.stringify(seoMetadata.structuredData);
        document.head.appendChild(scriptElement);
      }
      
      // FAQ için ikinci bir JSON-LD şema ekle
      let faqScriptElement = document.querySelector('script[type="application/ld+json"][data-faq="true"]');
      if (faqScriptElement) {
        faqScriptElement.textContent = JSON.stringify(productFaq.structuredData);
      } else {
        faqScriptElement = document.createElement('script');
        faqScriptElement.setAttribute('type', 'application/ld+json');
        faqScriptElement.setAttribute('data-faq', 'true');
        faqScriptElement.textContent = JSON.stringify(productFaq.structuredData);
        document.head.appendChild(faqScriptElement);
      }
    }
  }, [product]);
  
  const handleBuyNow = () => {
    if (!product) return;
    
    setIsProcessing(true);
    
    // Simulate API call for order creation
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Order Created",
        description: "Your order has been created successfully!",
        variant: "success"
      });
      
      // Redirect to checkout page with product details
      setLocation(`/shop/checkout?product=${product.id}&quantity=${quantity}&total=${total}`);
    }, 800);
  };
  
  const handleAddToCart = () => {
    if (!product) return;
    
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
      variant: "success"
    });
  };
  
  const handleAddToWishlist = () => {
    if (!product) return;
    
    toast({
      title: "Added to Wishlist",
      description: `${product.name} has been added to your wishlist.`,
      variant: "success"
    });
  };
  
  const handleShare = () => {
    if (!product) return;
    
    // Copy product URL to clipboard
    const productUrl = window.location.href;
    navigator.clipboard.writeText(productUrl);
    
    toast({
      title: "Link Copied",
      description: "Product link copied to clipboard.",
      variant: "success"
    });
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <ProductDetailSkeleton />
      </div>
    );
  }
  
  // Special case: If we're loading or waiting for data, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <ProductDetailSkeleton />
      </div>
    );
  }
    
  // Handle no product data case (even after API responded)
  if (!product) {
    console.log("Product not available:", productId);
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Product Loading</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Please wait while we load this product's details...
            </p>
            <div className="flex justify-center items-center space-x-4">
              <Button variant="outline" asChild size="lg" className="mb-4">
                <Link href="/shop">Browse Other Products</Link>
              </Button>
              <Button 
                size="lg" 
                className="mb-4"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb and back button - SEO için yapılandırılmış */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-2 sm:mb-0">
            <Link href={`/shop`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shop
            </Link>
          </Button>
          
          {/* Semantik ve SEO için yapılandırılmış breadcrumb */}
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
            <ol itemScope itemType="https://schema.org/BreadcrumbList" className="flex flex-wrap items-center">
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" className="flex items-center">
                <Link href="/shop" className="hover:underline" itemProp="item">
                  <span itemProp="name">Shop</span>
                </Link>
                <meta itemProp="position" content="1" />
                <span className="mx-2">/</span>
              </li>
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" className="flex items-center">
                <Link href={`/shop/${product.platform.slug}`} className="hover:underline" itemProp="item">
                  <span itemProp="name">{product.platform.name}</span>
                </Link>
                <meta itemProp="position" content="2" />
                <span className="mx-2">/</span>
              </li>
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" className="truncate max-w-[200px]">
                <span className="text-gray-700 dark:text-gray-300" itemProp="name">{product.name}</span>
                <meta itemProp="position" content="3" />
              </li>
            </ol>
          </nav>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - Product image and details */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              {/* Product Header - Mobile Only */}
              <div className="p-4 lg:hidden">
                <h1 className="text-xl font-bold">{product.name.split('[')[0].trim()}</h1>
                {product.name.includes('[') && (
                  <div className="text-xs text-gray-500 mt-1">
                    {product.name.match(/\[(.*?)\]/g)?.map((param, idx) => (
                      <span key={idx} className="inline-block mr-2 mb-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                        {param}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center text-sm mt-2">
                  <Badge variant="outline" className="mr-2">{product.platform.name}</Badge>
                  <Badge variant="outline">{product.category.name}</Badge>
                </div>
              </div>
              
              {/* Optimized Product Visual with Lazy Loading */}
              <div className="relative">
                {product.imageUrl ? (
                  <OptimizedImage 
                    src={product.imageUrl}
                    alt={product.name}
                    width={800}
                    height={450}
                    className="w-full h-auto object-cover"
                    loadingStrategy="eager" // Critical above-the-fold content loads eagerly
                    quality={90}
                  />
                ) : (
                  <ProductVisual 
                    platform={product.platform.slug || 'default'}
                    category={product.category.slug || 'default'}
                    name={product.name}
                    className="w-full"
                  />
                )}
                
                {/* Floating Badges */}
                <div className="absolute top-4 left-4 flex flex-col space-y-2">
                  {product.discountPercentage && product.discountPercentage > 0 && (
                    <Badge className="bg-red-500 hover:bg-red-600">
                      {product.discountPercentage}% OFF
                    </Badge>
                  )}
                  {product.popularityScore && product.popularityScore > 90 && (
                    <Badge className="bg-amber-500 hover:bg-amber-600">
                      TRENDING
                    </Badge>
                  )}
                </div>
                
                {/* Actions */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800"
                    onClick={handleAddToWishlist}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Product Info */}
              <div className="p-6">
                {/* Desktop Header */}
                <div className="hidden lg:flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{product.name.split('[')[0].trim()}</h1>
                    {product.name.includes('[') && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {product.name.match(/\[(.*?)\]/g)?.map((param, idx) => (
                          <span key={idx} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                            {param}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{product.platform.name}</Badge>
                      <Badge variant="outline">{product.category.name}</Badge>
                      <div className="flex items-center ml-2">
                        {Array(5).fill(0).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`} 
                            fill={i < 4 ? 'currentColor' : 'none'} 
                          />
                        ))}
                        <span className="text-sm ml-1">({Math.floor(Math.random() * 100) + 50} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {product.originalPrice && (
                      <span className="text-gray-500 line-through block text-sm">${product.originalPrice.toFixed(2)}</span>
                    )}
                    <span className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</span>
                    <span className="text-sm text-gray-500 block">per unit</span>
                  </div>
                </div>
                
                {/* Product Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <div className="flex flex-col items-center text-center p-2">
                    <Clock className="h-5 w-5 text-primary mb-1" />
                    <span className="text-sm font-medium">{product.deliveryTime || '24-48 hours'}</span>
                    <span className="text-xs text-gray-500">Delivery Time</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mb-1" />
                    <span className="text-sm font-medium">{product.satisfactionRate || '98'}%</span>
                    <span className="text-xs text-gray-500">Satisfaction</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-2">
                    <ShieldCheck className="h-5 w-5 text-blue-500 mb-1" />
                    <span className="text-sm font-medium">Guaranteed</span>
                    <span className="text-xs text-gray-500">Safe Service</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-2">
                    <Award className="h-5 w-5 text-yellow-500 mb-1" />
                    <span className="text-sm font-medium">Premium</span>
                    <span className="text-xs text-gray-500">Quality</span>
                  </div>
                </div>
                
                {/* Description Preview */}
                <div className="mb-6">
                  <p className="text-gray-600 dark:text-gray-300">{product.description}</p>
                </div>
                
                {/* Mobile Only - Quick Buy */}
                <div className="lg:hidden mb-6">
                  <Card className="border-2 border-primary/10">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <span className="block text-sm text-gray-500">Price per unit</span>
                          <span className="text-xl font-bold text-primary">${product.price.toFixed(2)}</span>
                        </div>
                        <Button onClick={handleBuyNow} disabled={isProcessing} className="w-1/2">
                          {isProcessing ? (
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                          ) : null}
                          Buy Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Separator className="my-6" />
                
                {/* Product tabs */}
                <Tabs 
                  defaultValue="description" 
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="faq">FAQ</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="description" className="mt-4">
                    <div className="prose dark:prose-invert max-w-none">
                      {product.longDescription ? (
                        <div dangerouslySetInnerHTML={{ __html: product.longDescription }} />
                      ) : (
                        <>
                          <p>{product.description}</p>
                          <p>
                            This {product.platform.name} service provides top-quality {product.category.name.toLowerCase()} 
                            that help boost your online presence and engagement. 
                            Our team ensures all services are delivered within the promised timeframe and meet 
                            high-quality standards.
                          </p>
                          <p>
                            With over 5 years of experience in social media marketing, we understand what it 
                            takes to grow your audience on {product.platform.name}. 
                            Our {product.category.name.toLowerCase()} service is designed to give you the edge in today's
                            competitive social media landscape.
                          </p>
                        </>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="features" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="text-lg font-medium flex items-center mb-2">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            Premium Quality
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            All our {product.platform.name} services use high-retention accounts for maximum effectiveness
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="text-lg font-medium flex items-center mb-2">
                            <Clock className="h-5 w-5 text-primary mr-2" />
                            Fast Delivery
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Your order starts processing immediately and completes within {product.deliveryTime || '24-48 hours'}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="text-lg font-medium flex items-center mb-2">
                            <ShieldCheck className="h-5 w-5 text-blue-500 mr-2" />
                            100% Safe
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            We never require passwords or sensitive information - just your {product.platform.name} username
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="text-lg font-medium flex items-center mb-2">
                            <Users className="h-5 w-5 text-violet-500 mr-2" />
                            24/7 Support
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Our customer support team is available around the clock to address any concerns
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="faq" className="mt-4">
                    {/* Semantik İçerik Optimizasyonu: Yapılandırılmış ve genişletilmiş SSS bölümü */}
                    <section itemScope itemType="https://schema.org/FAQPage" className="space-y-4">
                      <h2 className="text-lg font-semibold border-b pb-2 mb-4">{product.platform.name} {product.category.name} Service - Frequently Asked Questions</h2>
                      
                      <div itemScope itemType="https://schema.org/Question" className="border-b border-gray-100 dark:border-gray-700 pb-3">
                        <h3 itemProp="name" className="font-medium mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2 text-primary" />
                          How long does delivery take for {product.platform.name} {product.category.name}?
                        </h3>
                        <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                          <p itemProp="text" className="text-gray-600 dark:text-gray-300 text-sm ml-6">
                            Most orders are processed within {product.deliveryTime || '24-48 hours'}. 
                            You'll receive a notification once the service has been completed. For large orders of {product.maxOrder}+ {product.category.name}, 
                            delivery may be split into batches to ensure quality.
                          </p>
                        </div>
                      </div>
                      
                      <div itemScope itemType="https://schema.org/Question" className="border-b border-gray-100 dark:border-gray-700 pb-3">
                        <h3 itemProp="name" className="font-medium mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2 text-primary" />
                          Is this {product.platform.name} {product.category.name} service safe for my account?
                        </h3>
                        <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                          <p itemProp="text" className="text-gray-600 dark:text-gray-300 text-sm ml-6">
                            Yes, our services are 100% safe and comply with {product.platform.name}'s terms of service. 
                            We never ask for your password or access to your account. Our {product.category.name} are delivered 
                            through organic methods that mimic natural growth patterns on {product.platform.name}.
                          </p>
                        </div>
                      </div>
                      
                      <div itemScope itemType="https://schema.org/Question" className="border-b border-gray-100 dark:border-gray-700 pb-3">
                        <h3 itemProp="name" className="font-medium mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2 text-primary" />
                          Can I get a refund if I'm not satisfied with my {product.platform.name} {product.category.name}?
                        </h3>
                        <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                          <p itemProp="text" className="text-gray-600 dark:text-gray-300 text-sm ml-6">
                            We offer a satisfaction guarantee. If the service is not delivered as described, 
                            you can request a refund within 7 days of purchase. Our {product.satisfactionRate || 98}% satisfaction rate 
                            demonstrates our commitment to quality.
                          </p>
                        </div>
                      </div>
                      
                      <div itemScope itemType="https://schema.org/Question" className="border-b border-gray-100 dark:border-gray-700 pb-3">
                        <h3 itemProp="name" className="font-medium mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2 text-primary" />
                          What information do you need for my {product.platform.name} {product.category.name} order?
                        </h3>
                        <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                          <p itemProp="text" className="text-gray-600 dark:text-gray-300 text-sm ml-6">
                            We only need your {product.platform.name} username or channel URL (public information). 
                            We never require passwords or other sensitive account details. This keeps your account secure 
                            while we deliver your {product.category.name}.
                          </p>
                        </div>
                      </div>
                      
                      <div itemScope itemType="https://schema.org/Question" className="border-b border-gray-100 dark:border-gray-700 pb-3">
                        <h3 itemProp="name" className="font-medium mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2 text-primary" />
                          Do you offer bulk discounts?
                        </h3>
                        <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                          <p itemProp="text" className="text-gray-600 dark:text-gray-300 text-sm ml-6">
                            Yes, the more you order, the lower the price per unit. Try different quantities 
                            in the calculator to see your personalized discount.
                          </p>
                        </div>
                      </div>
                    </section>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            {/* Related Products */}
            {relatedProducts && relatedProducts.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Related Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {relatedProducts.slice(0, 3).map((relatedProduct) => (
                    <Card key={relatedProduct.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">{relatedProduct.platform.name}</span>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2 line-clamp-2 h-12">{relatedProduct.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">${relatedProduct.price.toFixed(2)}</span>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/shop/product/${relatedProduct.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* FAQ Section - Important for SEO */}
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
              <OptimizedProductFaq 
                platform={product.platform} 
                category={product.category} 
                deliveryTime={product.deliveryTime} 
              />
            </div>
            
            {/* SEO Content Section */}
            <section className="mt-8 prose prose-sm dark:prose-invert max-w-none">
              <h2 className="text-xl font-bold mb-4">About {product.platform.name} {product.category.name} Services</h2>
              <div className="text-gray-700 dark:text-gray-300">
                {(() => {
                  // SEO anahtar kelimeleri oluştur
                  const keywords = {
                    primary: `${product.platform.name} ${product.category.name}`.toLowerCase(),
                    secondary: [
                      `buy ${product.platform.name} ${product.category.name}`,
                      `${product.platform.name} marketing`,
                      `${product.category.name} for ${product.platform.name}`,
                    ],
                    longTail: [
                      `best ${product.platform.name} ${product.category.name} service`,
                      `how to get more ${product.platform.name} ${product.category.name}`,
                    ]
                  };
                  
                  // Açıklamayı optimize et
                  return optimizeProductDescription(
                    product.longDescription || product.description,
                    keywords
                  );
                })()}
              </div>
            </section>
            
            {/* Customer Reviews Section */}
            <section className="mt-8">
              <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>
              <OptimizedProductReviews 
                productId={product.id} 
                platform={product.platform?.name || ""} 
                category={product.category?.name || ""} 
              />
            </section>
            
            {/* Product Comparison - Hidden on small screens */}
            <div className="mt-8 hidden md:block">
              <h2 className="text-xl font-bold mb-4">Compare with Similar Products</h2>
              <OptimizedProductComparison productId={product.id} />
            </div>
          </div>
          
          {/* Right side - Pricing and purchase */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card className="shadow-lg border-2 border-primary/10">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Customize Your Order</h2>
                  
                  <PricingCalculator 
                    minQuantity={product.minOrder || 100}
                    maxQuantity={product.maxOrder || 10000}
                    price={product.price || 19.99}
                    discountPercentage={product.discountPercentage || 0}
                    onChange={setQuantity}
                    defaultValue={quantity}
                  />
                  
                  <div className="flex items-center justify-between mt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleAddToCart}
                      className="w-[48%]"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button 
                      variant="default" 
                      onClick={handleBuyNow}
                      disabled={isProcessing}
                      className="w-[48%]"
                    >
                      {isProcessing ? (
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                      ) : null}
                      Buy Now
                    </Button>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <DeliveryEstimator 
                    baseDeliveryTime={product.deliveryTime || '24-48 hours'}
                    quantity={quantity}
                    speedFactor={product.deliverySpeed === 'Express' ? 0.5 : product.deliverySpeed === 'Slow' ? 1.5 : 1}
                  />
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 text-primary mr-2" />
                      <span>Used by 1,200+ customers</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                      <span>Trending in {product.platform.name}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Zap className="h-4 w-4 text-yellow-500 mr-2" />
                      <span>Fast delivery guaranteed</span>
                    </div>
                  </div>
                  
                  {/* Testimonial */}
                  <div className="mt-6 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white mr-2">
                        {product.platform.name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-sm">John D.</div>
                        <div className="flex">
                          {Array(5).fill(0).map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-yellow-400" fill="currentColor" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm italic text-gray-600 dark:text-gray-300">
                      "I've tried several {product.platform.name} services and this one is by far the best. 
                      Fast delivery and excellent quality!"
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Sticky Buy Button */}
      <div className="lg:hidden">
        <StickyBuyButton 
          product={product}
          quantity={quantity}
          total={total}
          isProcessing={isProcessing}
          onBuyNow={handleBuyNow}
        />
      </div>
    </div>
  );
};

export default ProductDetail;