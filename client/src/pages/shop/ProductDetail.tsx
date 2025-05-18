import React, { useState, useEffect } from 'react';
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
import ProductComparison from '@/components/shop/ProductComparison';
import StickyBuyButton from '@/components/shop/StickyBuyButton';

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
  
  // Fetch product details with direct API call and enhanced error handling
  const { 
    data: product, 
    isLoading, 
    error,
    isError 
  } = useQuery<Product>({
    queryKey: ['/api/digital-products', productId],
    queryFn: () => {
      console.log('Fetching product data for ID:', productId);
      return apiRequest('GET', `/api/digital-products/${productId}`)
        .then(async res => {
          const data = await res.json();
          
          if (!res.ok) {
            console.error('Product fetch failed with status:', res.status);
            // If we got JSON with error info, log it
            console.error('Error response:', data);
            throw new Error('Failed to fetch product');
          }
          
          // Check if the data has expected product properties
          if (!data || !data.id || !data.name) {
            console.error('Invalid product data received:', data);
            throw new Error('Invalid product data received');
          }
          
          return data;
        })
        .catch(err => {
          console.error('Error in product fetch:', err);
          throw err;
        });
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3, // Increased retry attempts
  });
  
  // Fetch related products
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
  
  // We now use isError instead of checking error directly
  // and we give our API multiple retries, so if we get an error it's probably legitimate
  if (isError || (product === undefined && !isLoading)) {
    // Log detailed error information for debugging
    console.error("Product detail error:", error);
    console.error("ProductID:", productId);
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Loading Product...</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              We're having trouble loading this product. Please try again in a moment.
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
                Try Again
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
        {/* Breadcrumb and back button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-2 sm:mb-0">
            <Link href={`/shop`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shop
            </Link>
          </Button>
          
          <div className="text-sm text-gray-500 flex flex-wrap items-center">
            <Link href="/shop" className="hover:underline">Shop</Link>
            <span className="mx-2">/</span>
            <Link href={`/shop/${product.platform.slug}`} className="hover:underline">{product.platform.name}</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - Product image and details */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              {/* Product Header - Mobile Only */}
              <div className="p-4 lg:hidden">
                <h1 className="text-xl font-bold">{product.name}</h1>
                <div className="flex items-center text-sm mt-2">
                  <Badge variant="outline" className="mr-2">{product.platform.name}</Badge>
                  <Badge variant="outline">{product.category.name}</Badge>
                </div>
              </div>
              
              {/* Premium Product Showcase */}
              <div className="relative">
                <ProductShowcase 
                  imageUrl={product.imageUrl || `/images/products/product-${product.id}.jpg`}
                  platformName={product.platform.name}
                  categoryName={product.category.name}
                />
                
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
                    <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
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
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2 text-primary" />
                          How long does delivery take?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm ml-6">
                          Most orders are processed within {product.deliveryTime || '24-48 hours'}. 
                          You'll receive a notification once the service has been completed.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2 text-primary" />
                          Is this service safe for my {product.platform.name} account?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm ml-6">
                          Yes, our services are 100% safe and comply with {product.platform.name}'s terms of service. 
                          We never ask for your password or access to your account.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2 text-primary" />
                          Can I get a refund if I'm not satisfied?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm ml-6">
                          We offer a satisfaction guarantee. If the service is not delivered as described, 
                          you can request a refund within 7 days of purchase.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2 text-primary" />
                          What information do you need from me?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm ml-6">
                          We only need your {product.platform.name} username (public information). 
                          We never require passwords or other sensitive account details.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2 text-primary" />
                          Do you offer bulk discounts?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm ml-6">
                          Yes, the more you order, the lower the price per unit. Try different quantities 
                          in the calculator to see your personalized discount.
                        </p>
                      </div>
                    </div>
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
            
            {/* Product Comparison - Hidden on small screens */}
            <div className="mt-8 hidden md:block">
              <h2 className="text-xl font-bold mb-4">Compare with Similar Products</h2>
              <ProductComparison productId={product.id} />
            </div>
          </div>
          
          {/* Right side - Pricing and purchase */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card className="shadow-lg border-2 border-primary/10">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Customize Your Order</h2>
                  
                  <PricingCalculator 
                    minQuantity={product.minOrder}
                    maxQuantity={product.maxOrder}
                    pricePerUnit={product.price}
                    discountPercentage={product.discountPercentage || 0}
                    setQuantity={setQuantity}
                    quantity={quantity}
                    total={total}
                    isProcessing={isProcessing}
                    onBuyNow={handleBuyNow}
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
                    deliveryTime={product.deliveryTime || '24-48 hours'}
                    deliverySpeed={product.deliverySpeed || 'Standard'}
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