import React, { useState, useEffect } from 'react';
import { ShoppingCart, ChevronUp, Users, ZapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StickyBuyButtonProps {
  productId: number;
  price: number;
  quantity: number;
  total: number;
  onBuyNow: () => void;
  disabled?: boolean;
}

const StickyBuyButton: React.FC<StickyBuyButtonProps> = ({
  productId,
  price,
  quantity,
  total,
  onBuyNow,
  disabled = false
}) => {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [currentViewers, setCurrentViewers] = useState(0);
  const [recentPurchases, setRecentPurchases] = useState(0);
  
  // Show sticky button when user scrolls past the original buy button
  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled down 300px
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
        setExpanded(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Simulate social proof with random viewers and purchases
  useEffect(() => {
    // Generate random number of current viewers (12-45)
    setCurrentViewers(Math.floor(Math.random() * 34) + 12);
    
    // Generate random number of recent purchases (3-15)
    setRecentPurchases(Math.floor(Math.random() * 13) + 3);
    
    // Update viewers count periodically to create a live feeling
    const viewersInterval = setInterval(() => {
      setCurrentViewers(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(8, prev + change); // Don't go below 8
      });
    }, 5000);
    
    return () => clearInterval(viewersInterval);
  }, [productId]);
  
  if (!visible) return null;
  
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t shadow-lg transform transition-transform duration-300 ${
        expanded ? 'h-auto' : 'h-16'
      } z-50`}
    >
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => setExpanded(!expanded)}
            >
              <ChevronUp className={`h-5 w-5 transform transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </Button>
            
            <div>
              <div className="font-medium">₺{price.toFixed(2)} × {quantity}</div>
              <div className="text-xs text-gray-500">Total: ₺{total.toFixed(2)}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                <Users className="h-3 w-3 mr-1" />
                {currentViewers} viewing now
              </Badge>
              
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">
                <ZapIcon className="h-3 w-3 mr-1" />
                {recentPurchases} purchased today
              </Badge>
            </div>
            
            <Button 
              onClick={onBuyNow}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              disabled={disabled}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buy Now
            </Button>
          </div>
        </div>
        
        {/* Expanded content */}
        {expanded && (
          <div className="py-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">People viewing now</div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-lg font-semibold">{currentViewers}</span>
                <span className="text-xs text-gray-500 ml-2">users</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium">Purchased Today</div>
              <div className="flex items-center">
                <ZapIcon className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-lg font-semibold">{recentPurchases}</span>
                <span className="text-xs text-gray-500 ml-2">orders</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium">Remaining Stock</div>
              <div className="flex items-center">
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  Limited Availability
                </Badge>
              </div>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={onBuyNow} 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                disabled={disabled}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy Now - ₺{total.toFixed(2)}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StickyBuyButton;