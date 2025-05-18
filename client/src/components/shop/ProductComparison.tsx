import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { 
  Scale,
  Info,
  Check,
  X,
  Star,
  ChevronRight,
  ChevronDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface ComparisonProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  platform: { name: string; slug: string };
  category: { name: string; slug: string };
  minOrder: number;
  maxOrder: number;
  deliveryTime?: string;
  deliverySpeed?: string;
  satisfactionRate?: number;
  discountPercentage?: number;
  popularityScore?: number;
}

interface ProductComparisonProps {
  currentProductId: number;
  platformSlug: string;
  categorySlug: string;
}

const ProductComparison: React.FC<ProductComparisonProps> = ({
  currentProductId,
  platformSlug,
  categorySlug
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  
  // Fetch similar products in the same category or platform
  const { data: similarProducts = [], isLoading } = useQuery({
    queryKey: ['/api/digital-products/similar', platformSlug, categorySlug],
    queryFn: () => apiRequest('GET', `/api/digital-products/similar?platform=${platformSlug}&category=${categorySlug}`).then(res => res.json()),
    // Only enable if we have valid slugs
    enabled: !!platformSlug && !!categorySlug,
  });
  
  // Filter out current product and limit to 5 products max for comparison
  useEffect(() => {
    if (similarProducts.length > 0) {
      const otherProducts = similarProducts.filter((p: ComparisonProduct) => p.id !== currentProductId);
      // Pre-select up to 2 products for comparison
      setSelectedProducts(otherProducts.slice(0, 2).map((p: ComparisonProduct) => p.id));
    }
  }, [similarProducts, currentProductId]);
  
  // Get current product data
  const { data: currentProduct } = useQuery({
    queryKey: ['/api/digital-products', currentProductId],
    queryFn: () => apiRequest('GET', `/api/digital-products/${currentProductId}`).then(res => res.json()),
    enabled: !!currentProductId,
  });
  
  const toggleProductSelection = (productId: number) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    } else {
      if (selectedProducts.length < 3) { // Limit to comparing 3 products at a time
        setSelectedProducts(prev => [...prev, productId]);
      }
    }
  };
  
  // Get all products for comparison (current + selected)
  const getComparisonProducts = () => {
    if (!currentProduct) return [];
    
    const productsToCompare = [currentProduct];
    
    similarProducts.forEach((product: ComparisonProduct) => {
      if (selectedProducts.includes(product.id)) {
        productsToCompare.push(product);
      }
    });
    
    return productsToCompare;
  };
  
  const comparisonProducts = getComparisonProducts();
  
  // Comparison aspects
  const comparisonAspects = [
    { id: 'price', label: 'Price', type: 'price' },
    { id: 'delivery', label: 'Delivery Time', type: 'text' },
    { id: 'minOrder', label: 'Minimum Order', type: 'number' },
    { id: 'maxOrder', label: 'Maximum Order', type: 'number' },
    { id: 'satisfaction', label: 'Satisfaction Rate', type: 'percentage' },
    { id: 'discount', label: 'Discount', type: 'percentage' },
  ];
  
  // Helper to get value based on aspect
  const getAspectValue = (product: ComparisonProduct, aspect: string) => {
    switch (aspect) {
      case 'price':
        return product.price;
      case 'delivery':
        return product.deliveryTime || 'Standard';
      case 'minOrder':
        return product.minOrder;
      case 'maxOrder':
        return product.maxOrder;
      case 'satisfaction':
        return product.satisfactionRate || 95;
      case 'discount':
        return product.discountPercentage || 0;
      default:
        return 'N/A';
    }
  };
  
  // Helper to format the display value
  const formatValue = (value: any, type: string) => {
    switch (type) {
      case 'price':
        return `₺${value.toFixed(2)}`;
      case 'percentage':
        return `${value}%`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };
  
  // Determine if a product has the best value for a given aspect
  const isBestValue = (products: ComparisonProduct[], product: ComparisonProduct, aspect: string) => {
    if (products.length <= 1) return false;
    
    const value = getAspectValue(product, aspect);
    
    // For these aspects, lower is better
    if (aspect === 'price') {
      return value === Math.min(...products.map(p => getAspectValue(p, aspect)));
    }
    
    // For these aspects, higher is better
    if (aspect === 'maxOrder' || aspect === 'satisfaction' || aspect === 'discount') {
      return value === Math.max(...products.map(p => getAspectValue(p, aspect)));
    }
    
    return false;
  };
  
  // Highlight the current product
  const isCurrentProduct = (product: ComparisonProduct) => {
    return product.id === currentProductId;
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Scale className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium">Product Comparison</h3>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }
  
  // Don't show if there are no similar products
  if (similarProducts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Scale className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium">Product Comparison</h3>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0">
                <Info className="h-4 w-4 text-gray-500" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-72">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p>Compare this product with similar options to find the best fit for your needs.</p>
                <p className="mt-2 text-xs text-gray-500">Select up to 3 products to compare side by side.</p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <Minimize2 className="h-3 w-3 mr-1" />
              Minimize
            </>
          ) : (
            <>
              <Maximize2 className="h-3 w-3 mr-1" />
              Expand
            </>
          )}
        </Button>
      </div>
      
      {/* Product Selection */}
      <div className="flex flex-col space-y-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Select products to compare (up to 3):
        </div>
        <div className="flex flex-wrap gap-2">
          {similarProducts.map((product: ComparisonProduct) => {
            const isSelected = selectedProducts.includes(product.id);
            return (
              <Badge
                key={product.id}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer ${isSelected ? 'bg-blue-500' : ''}`}
                onClick={() => toggleProductSelection(product.id)}
              >
                {isSelected ? <Check className="h-3 w-3 mr-1" /> : null}
                {product.name.length > 20 ? `${product.name.substring(0, 20)}...` : product.name}
              </Badge>
            );
          })}
        </div>
      </div>
      
      {/* Comparison Table */}
      <div className="border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-2 p-3 bg-gray-50 dark:bg-gray-800 border-b">
          <div className="col-span-2 font-medium">Feature</div>
          {comparisonProducts.map((product, index) => (
            <div key={index} className={`text-center ${isCurrentProduct(product) ? 'font-bold' : ''}`}>
              <div className={`text-sm mb-1 truncate ${isCurrentProduct(product) ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                {product.name.length > 15 ? `${product.name.substring(0, 15)}...` : product.name}
              </div>
              {isCurrentProduct(product) && (
                <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Current
                </Badge>
              )}
            </div>
          ))}
        </div>
        
        {/* Table Body */}
        <div className="divide-y">
          {comparisonAspects.map((aspect, i) => (
            <div key={i} className={`grid grid-cols-5 gap-2 p-3 ${i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
              <div className="col-span-2 flex items-center">
                <span className="text-sm">{aspect.label}</span>
              </div>
              
              {comparisonProducts.map((product, j) => {
                const value = getAspectValue(product, aspect.id);
                const formattedValue = formatValue(value, aspect.type);
                const best = isBestValue(comparisonProducts, product, aspect.id);
                
                return (
                  <div 
                    key={j} 
                    className={`text-center ${isCurrentProduct(product) ? 'font-semibold' : ''}`}
                  >
                    <div className="flex flex-col items-center">
                      <span className={best ? 'text-green-600 dark:text-green-400' : ''}>
                        {formattedValue}
                      </span>
                      {best && (
                        <Badge variant="outline" className="mt-1 text-xs bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">
                          <Star className="h-3 w-3 mr-1 text-amber-500" />
                          Best Value
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          
          {/* Action Row */}
          <div className="grid grid-cols-5 gap-2 p-3 bg-gray-50 dark:bg-gray-800">
            <div className="col-span-2"></div>
            {comparisonProducts.map((product, index) => (
              <div key={index} className="text-center">
                {!isCurrentProduct(product) && (
                  <Link href={`/shop/product/${product.id}`}>
                    <Button size="sm" variant="outline" className="w-full text-xs h-8">
                      View Details
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                )}
                {isCurrentProduct(product) && (
                  <Badge variant="outline" className="w-full justify-center py-1 text-xs bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                    Current Selection
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Optional: Expanded Content with more details */}
      {isExpanded && (
        <div className="border rounded-lg p-4 mt-4 space-y-4">
          <div className="text-sm font-medium">Detailed Comparison</div>
          
          {/* Add more detailed comparison information here */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisonProducts.map((product, index) => (
              <div 
                key={index} 
                className={`border rounded p-3 ${isCurrentProduct(product) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
              >
                <div className="font-medium mb-2">{product.name}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">{product.description}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-medium">₺{product.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <span>{product.deliveryTime || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Limit:</span>
                    <span>{product.minOrder} - {product.maxOrder}</span>
                  </div>
                  {product.satisfactionRate && (
                    <div className="flex justify-between">
                      <span>Satisfaction:</span>
                      <span>{product.satisfactionRate}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductComparison;