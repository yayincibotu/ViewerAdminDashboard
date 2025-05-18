import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StickyBuyButtonProps {
  price: number;
  quantity: number;
  discount?: number;
  isProcessing: boolean;
  onBuyNow: () => void;
}

const StickyBuyButton: React.FC<StickyBuyButtonProps> = ({
  price,
  quantity,
  discount = 0,
  isProcessing,
  onBuyNow
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [total, setTotal] = useState(0);
  
  // Calculate total price with discount
  useEffect(() => {
    const baseTotal = price * quantity;
    const discountAmount = discount > 0 ? (baseTotal * discount / 100) : 0;
    setTotal(baseTotal - discountAmount);
  }, [price, quantity, discount]);
  
  // Control visibility based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled 300px or more
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg py-3 px-4 z-40 transform transition-transform duration-300 ease-in-out">
      <div className="container mx-auto flex items-center justify-between">
        <div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Total:</span>
            <span className="text-xl font-bold">₺{total.toFixed(2)}</span>
          </div>
          <div className="text-xs text-gray-500">
            {quantity.toLocaleString()} items at ₺{price.toFixed(2)} each
            {discount > 0 && <span className="text-green-500 ml-1">(Save {discount}%)</span>}
          </div>
        </div>
        
        <Button 
          size="lg" 
          onClick={onBuyNow} 
          disabled={isProcessing}
          className="w-40 h-12"
        >
          {isProcessing ? (
            <div className="flex items-center">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Processing
            </div>
          ) : (
            <div className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Buy Now
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StickyBuyButton;