import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useRoute, Link, useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormSkeleton } from '@/components/skeletons/FormSkeleton';
import { useToast } from '@/hooks/use-toast';

// İkonlar
import { 
  ShoppingCart, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  HelpCircle, 
  ArrowLeft, 
  Truck, 
  ListChecks, 
  ThumbsUp,
  AlertCircle,
  Activity
} from 'lucide-react';

const ProductDetail = () => {
  const [, params] = useRoute('/shop/product/:id');
  const productId = params?.id;
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [, setLocation] = useLocation();

  // Ürün detaylarını çek
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['/api/digital-products', productId],
    queryFn: () => apiRequest('GET', `/api/digital-products/${productId}`).then(res => res.json()),
    enabled: !!productId
  });
  
  // Hata durumunda kullanıcıya bildirim göster
  React.useEffect(() => {
    if (error) {
      toast({
        title: 'Product Could Not Be Loaded',
        description: 'There was a problem loading the product details. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // İlgili ürünleri çek (aynı kategorideki veya platformdaki)
  const { data: relatedProducts = [], isLoading: isLoadingRelated } = useQuery({
    queryKey: ['/api/digital-products/related', productId],
    queryFn: () => apiRequest('GET', `/api/digital-products/related/${productId}`).then(res => res.json()),
    enabled: !!product,
  });

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (product && product.maxOrder && value > product.maxOrder) {
      setQuantity(product.maxOrder);
    } else {
      setQuantity(value);
    }
  };

  const handleBuyNow = () => {
    if (!productId || !product) return;
    
    // Ödeme sayfasına yönlendir
    setLocation(`/shop/checkout/${productId}?quantity=${quantity}`);
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;
    return (product.price * quantity).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
        <FormSkeleton />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="mb-6">
          <Link href="/shop">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Product Not Found</CardTitle>
            <CardDescription>
              The requested product was not found or an error occurred.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/shop">
              <Button>Return to Shop</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const platformColor = {
    'twitch': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'youtube': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'instagram': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'tiktok': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
    'default': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  };

  const getColor = (platform: string) => {
    return platformColor[platform.toLowerCase() as keyof typeof platformColor] || platformColor.default;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/shop">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol Kolon - Ürün Ana Bilgileri */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className={`${getColor(product.platform.slug)}`}>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-2">{product.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{product.platform.name}</Badge>
                    <Badge variant="outline">{product.category.name}</Badge>
                    {product.popularityScore > 80 && (
                      <Badge className="bg-orange-500 hover:bg-orange-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                </div>
                {product.discountPercentage > 0 && (
                  <Badge className="bg-red-500 hover:bg-red-600">
                    {product.discountPercentage}% Discount
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Product Description</h3>
                  <p className="text-gray-700 dark:text-gray-300">{product.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium flex items-center mb-3">
                      <ListChecks className="h-5 w-5 mr-2 text-blue-500" />
                      Features
                    </h4>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        <span>Order quantity: {product.minOrder} - {product.maxOrder}</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        <span>Instant start</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        <span>High-quality and permanent service</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        <span>24/7 Support</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium flex items-center mb-3">
                      <Truck className="h-5 w-5 mr-2 text-blue-500" />
                      Delivery Information
                    </h4>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-amber-500" />
                        <span>Delivery Time: {product.deliveryTime || "1-2 hours"}</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <Activity className="h-4 w-4 mr-2 text-purple-500" />
                        <span>Delivery Speed: {product.deliverySpeed || "Normal"}</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <ThumbsUp className="h-4 w-4 mr-2 text-blue-500" />
                        <span>Customer Satisfaction: {product.satisfactionRate || 98}%</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <Tabs defaultValue="details" className="mt-6">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="usage">Usage</TabsTrigger>
                    <TabsTrigger value="faq">FAQs</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div>
                      <h4 className="font-medium mb-2">What does this product provide?</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {product.longDescription || 
                          `This is a professional service designed to increase your ${product.category.name.toLowerCase()} count on the ${product.platform.name} platform. It works securely and in compliance with platform guidelines.`}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Service Quality</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        We provide high-quality engagement from real accounts. This service is completely safe for your accounts and complies with platform guidelines.
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="usage" className="space-y-4 mt-4">
                    <div>
                      <h4 className="font-medium mb-2">How to Use?</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>Complete your purchase</li>
                        <li>After order confirmation, you can view order details in your profile</li>
                        <li>Enter the required connection information (profile URL, username, etc.)</li>
                        <li>Service activation typically completes within 5-30 minutes</li>
                        <li>You can track your order status from the "My Orders" page</li>
                      </ol>
                    </div>
                  </TabsContent>
                  <TabsContent value="faq" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium flex items-center">
                          <HelpCircle className="h-4 w-4 mr-2 text-blue-500" />
                          Hesabım güvende mi?
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-6">
                          Evet, tüm hizmetlerimiz platform kurallarına uygun şekilde sağlanmaktadır. Şifreniz istenmez ve hesap güvenliğiniz %100 korunur.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium flex items-center">
                          <HelpCircle className="h-4 w-4 mr-2 text-blue-500" />
                          Sipariş ne kadar sürede teslim edilir?
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-6">
                          Siparişler genellikle 1-2 saat içinde başlar, büyük siparişlerde bu süre uzayabilir. Tam teslimat süresi ürün açıklamasında belirtilmiştir.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium flex items-center">
                          <HelpCircle className="h-4 w-4 mr-2 text-blue-500" />
                          Ödeme yöntemleri nelerdir?
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-6">
                          Kredi kartı, banka kartı ve diğer tüm popüler ödeme yöntemlerini destekliyoruz. Ödemeleriniz Stripe üzerinden güvenle işlenir.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ Kolon - Sipariş ve Ödeme */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-xl">Sipariş Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Birim Fiyat:</span>
                {product.discountPercentage > 0 ? (
                  <div className="text-right">
                    <span className="text-sm line-through text-gray-500">₺{product.originalPrice}</span>
                    <div className="text-lg font-bold text-green-600">₺{product.price}</div>
                  </div>
                ) : (
                  <span className="text-lg font-bold">₺{product.price}</span>
                )}
              </div>

              <div className="flex items-center">
                <span className="font-medium mr-4">Miktar:</span>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={handleQuantityChange}
                    min={1}
                    max={product.maxOrder}
                    className="w-16 h-8 mx-2 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(Math.min(product.maxOrder || 10000, quantity + 1))}
                    disabled={product.maxOrder && quantity >= product.maxOrder}
                  >
                    +
                  </Button>
                </div>
              </div>

              {product.minOrder && quantity < product.minOrder && (
                <div className="flex items-start mt-1 text-sm text-amber-600 dark:text-amber-500">
                  <AlertCircle className="h-4 w-4 mr-1 mt-0.5" />
                  <span>Minimum sipariş miktarı {product.minOrder}'dir.</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between items-center font-medium">
                <span>Total Price:</span>
                <span className="text-xl font-bold">${calculateTotalPrice()}</span>
              </div>

              <div className="mt-4">
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleBuyNow} 
                  disabled={product.minOrder && quantity < product.minOrder}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Buy Now
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <ShieldCheck className="h-4 w-4 mr-2 text-green-500" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4 mr-2 text-amber-500" />
                  <span>Fast Delivery</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  <span>100% Customer Satisfaction</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* İlgili Ürünler */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Benzer Ürünler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((relatedProduct: any) => (
              <Card key={relatedProduct.id} className="overflow-hidden transition-all duration-200 hover:shadow-lg">
                <CardHeader className={`${getColor(relatedProduct.platform.slug)}`}>
                  <CardTitle className="text-lg">{relatedProduct.name}</CardTitle>
                  <CardDescription className="text-black dark:text-white">
                    {relatedProduct.platform.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{relatedProduct.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <span className="font-bold">₺{relatedProduct.price}</span>
                  <Link href={`/shop/product/${relatedProduct.id}`}>
                    <Button variant="outline" size="sm">Detaylar</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;