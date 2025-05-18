import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Clock, ShieldCheck, Award, Star, Users, TrendingUp, Lightning } from 'lucide-react';
import NavBar from '@/components/NavBar';
import PricingCalculator from '@/components/shop/PricingCalculator';
import ProductShowcase from '@/components/shop/ProductShowcase';
import DeliveryEstimator from '@/components/shop/DeliveryEstimator';
import ProductComparison from '@/components/shop/ProductComparison';
import StickyBuyButton from '@/components/shop/StickyBuyButton';

interface Product {
  id: number;
  name: string;
  description: string;
  longDescription?: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  platform: {
    id: number;
    name: string;
    slug: string;
  };
  category: {
    id: number;
    name: string;
    slug: string;
  };
  minOrder: number;
  maxOrder: number;
  deliveryTime?: string;
  deliverySpeed?: string;
  satisfactionRate?: number;
  popularityScore?: number;
  imageUrl?: string;
}

const ProductDetail = () => {
  const [, setLocation] = useLocation();
  const { productId } = useParams();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(100);
  const [total, setTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Fetch product details
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['/api/digital-products', productId],
    enabled: !!productId,
  });
  
  useEffect(() => {
    if (product && product.price) {
      setQuantity(product.minOrder || 100);
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
    
    // Here you would typically make an API call to create an order
    setTimeout(() => {
      setIsProcessing(false);
      
      // Redirect to checkout page with product details
      setLocation(`/shop/checkout?product=${product.id}&quantity=${quantity}&total=${total}`);
    }, 800);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
            <p className="text-gray-500 mb-8">The product you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link href="/shop">Back to Shop</Link>
            </Button>
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
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href={`/shop/${product.platform.slug}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {product.platform.name}
            </Link>
          </Button>
          
          <div className="text-sm text-gray-500 flex items-center">
            <Link href="/shop" className="hover:underline">Shop</Link>
            <span className="mx-2">/</span>
            <Link href={`/shop/${product.platform.slug}`} className="hover:underline">{product.platform.name}</Link>
            <span className="mx-2">/</span>
            <Link href={`/shop/${product.platform.slug}/${product.category.slug}`} className="hover:underline">{product.category.name}</Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Product images and details */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              {/* Product Showcase Component */}
              <ProductShowcase 
                name={product.name}
                platform={product.platform.name}
                category={product.category.name}
                imageUrl={product.imageUrl}
                discount={product.discountPercentage}
              />
              
              <div className="p-6">
                {/* Product badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.deliverySpeed && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                      <Lightning className="h-3 w-3 mr-1" />
                      {product.deliverySpeed}
                    </Badge>
                  )}
                  
                  {product.popularityScore && product.popularityScore > 80 && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-200">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                  
                  {product.satisfactionRate && product.satisfactionRate > 90 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">
                      <Star className="h-3 w-3 mr-1" />
                      {product.satisfactionRate}% Satisfied
                    </Badge>
                  )}
                </div>
                
                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-300">{product.description}</p>
                </div>
                
                {/* Features */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Service Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                      <div>
                        <h4 className="font-medium">High Quality</h4>
                        <p className="text-sm text-gray-500">Premium accounts with real behavior</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                      <div>
                        <h4 className="font-medium">Fast Delivery</h4>
                        <p className="text-sm text-gray-500">Starts within 30 minutes after order</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <ShieldCheck className="h-5 w-5 text-purple-500 mt-0.5 mr-2" />
                      <div>
                        <h4 className="font-medium">Safe & Secure</h4>
                        <p className="text-sm text-gray-500">No password required, complies with platform ToS</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Award className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                      <div>
                        <h4 className="font-medium">Guaranteed Results</h4>
                        <p className="text-sm text-gray-500">Refill guarantee if drops within 30 days</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tabs for more information */}
                <Tabs defaultValue="details" className="mt-8">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
                    <TabsTrigger value="faq">FAQ</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="mt-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Service Details</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {product.longDescription || `Our ${product.category.name} service for ${product.platform.name} provides high-quality viewers from diverse geographic locations. This service helps increase your visibility and credibility on the platform.`}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Minimum Order:</span>
                              <span className="ml-2 font-medium">{product.minOrder}</span>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">Maximum Order:</span>
                              <span className="ml-2 font-medium">{product.maxOrder}</span>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">Average Delivery:</span>
                              <span className="ml-2 font-medium">{product.deliveryTime || "1-2 days"}</span>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">Delivery Speed:</span>
                              <span className="ml-2 font-medium">{product.deliverySpeed || "Standard"}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="how-it-works" className="mt-4">
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-medium mb-3">How Our Service Works</h4>
                        <ol className="list-decimal pl-5 space-y-3">
                          <li className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Place Your Order</span> - Select the desired quantity and complete your purchase
                          </li>
                          <li className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Provide Channel URL</span> - Enter your stream or channel URL during checkout
                          </li>
                          <li className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Order Processing</span> - Our system will verify your details and prepare the delivery
                          </li>
                          <li className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Delivery Begins</span> - Service starts within 30 minutes to 12 hours (depending on order size)
                          </li>
                          <li className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Completion & Support</span> - Track progress in your dashboard and contact support if needed
                          </li>
                        </ol>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="faq" className="mt-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium">Is this service safe?</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Yes, our service is completely safe. We don't require any passwords or sensitive information, and our methods comply with platform guidelines.
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">How long does delivery take?</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Delivery typically begins within 30 minutes to 12 hours after order confirmation. The complete delivery time depends on the order size.
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Do you offer a guarantee?</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Yes, we offer a 30-day guarantee. If you experience any drop in the delivered service, we'll refill it free of charge.
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Can I split my order between multiple streams?</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              No, each order is for a single stream or channel. For multiple destinations, please place separate orders.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            {/* Similar Products Comparison */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Compare Similar Services</h3>
              <ProductComparison 
                currentProductId={product.id} 
                platformSlug={product.platform.slug} 
                categorySlug={product.category.slug} 
              />
            </div>
          </div>
          
          {/* Right column - Pricing and purchase */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-medium mb-4">Order Details</h3>
              
              {/* Price display with discount */}
              <div className="mb-6">
                {product.originalPrice && product.originalPrice > product.price ? (
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold">₺{product.price.toFixed(2)}</span>
                    <span className="ml-2 text-gray-500 line-through text-sm">₺{product.originalPrice.toFixed(2)}</span>
                    <Badge className="ml-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {product.discountPercentage}% OFF
                    </Badge>
                  </div>
                ) : (
                  <span className="text-2xl font-bold">₺{product.price.toFixed(2)}</span>
                )}
                <p className="text-sm text-gray-500 mt-1">Per {product.category.name.toLowerCase()}</p>
              </div>
              
              {/* Pricing Calculator Component */}
              <PricingCalculator
                minQuantity={product.minOrder}
                maxQuantity={product.maxOrder}
                pricePerUnit={product.price}
                discountPercentage={product.discountPercentage}
                onChange={setQuantity}
                defaultValue={product.minOrder}
              />
              
              <Separator className="my-6" />
              
              {/* Delivery estimator */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Estimated Delivery</h4>
                <DeliveryEstimator
                  baseDeliveryTime={product.deliveryTime || "24-48 hours"}
                  quantity={quantity}
                  speedFactor={product.deliverySpeed === "Ultra Fast" ? 0.5 : 1}
                />
              </div>
              
              {/* Social proof */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-blue-500" />
                    <span>{Math.floor(Math.random() * 20) + 10} people viewing</span>
                  </div>
                  <div>
                    <span className="text-green-500 font-medium">In Stock</span>
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <Star className="h-4 w-4 mr-1 text-amber-500" />
                  <span>{product.satisfactionRate || 98}% satisfaction rate</span>
                </div>
              </div>
              
              {/* Buy button */}
              <Button
                onClick={handleBuyNow}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Buy Now'}
              </Button>
              
              <p className="text-xs text-center text-gray-500 mt-4">
                Secure payment via Stripe. 30-day guarantee included.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sticky Buy Button */}
      <StickyBuyButton
        productId={product.id}
        price={product.price}
        quantity={quantity}
        total={total}
        onBuyNow={handleBuyNow}
        disabled={isProcessing}
      />
    </div>
  );
};

export default ProductDetail;