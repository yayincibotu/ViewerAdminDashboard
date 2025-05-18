import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Percent, 
  TrendingUp, 
  Sparkles 
} from 'lucide-react';

interface PricingCalculatorProps {
  basePrice: number;
  minQuantity: number;
  maxQuantity: number;
  onChange: (quantity: number, price: number) => void;
  initialQuantity?: number;
}

const PricingCalculator: React.FC<PricingCalculatorProps> = ({ 
  basePrice, 
  minQuantity, 
  maxQuantity, 
  onChange,
  initialQuantity = minQuantity
}) => {
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [discount, setDiscount] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(basePrice * quantity);

  // Tier discount levels - the more you buy, the bigger the discount
  const discountTiers = [
    { threshold: 0, percentage: 0 },
    { threshold: 100, percentage: 5 },
    { threshold: 500, percentage: 10 },
    { threshold: 1000, percentage: 15 },
    { threshold: 5000, percentage: 20 },
  ];

  useEffect(() => {
    // Find applicable discount tier
    const applicableTier = [...discountTiers]
      .reverse()
      .find(tier => quantity >= tier.threshold);
    
    const discountPercent = applicableTier ? applicableTier.percentage : 0;
    setDiscount(discountPercent);
    
    // Calculate total price with discount
    const rawTotal = basePrice * quantity;
    const discountAmount = rawTotal * (discountPercent / 100);
    const finalPrice = rawTotal - discountAmount;
    
    setTotalPrice(finalPrice);
    onChange(quantity, finalPrice);
  }, [quantity, basePrice, onChange]);

  const handleSliderChange = (value: number[]) => {
    setQuantity(value[0]);
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setQuantity(Math.min(Math.max(value, minQuantity), maxQuantity));
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium">Price Calculator</h3>
        </div>
        {discount > 0 && (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <Percent className="w-3 h-3 mr-1" /> {discount}% Discount
          </Badge>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Quantity</span>
          <div className="flex items-center">
            <input
              type="number"
              value={quantity}
              onChange={handleQuantityInputChange}
              min={minQuantity}
              max={maxQuantity}
              className="w-16 h-7 px-2 text-sm text-center border rounded mr-1"
            />
            <span className="text-xs text-gray-500">/ {maxQuantity}</span>
          </div>
        </div>
        
        <Slider
          value={[quantity]}
          min={minQuantity}
          max={maxQuantity}
          step={10}
          onValueChange={handleSliderChange}
          className="py-4"
        />
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>{minQuantity}</span>
          <span>{Math.round(maxQuantity * 0.33)}</span>
          <span>{Math.round(maxQuantity * 0.66)}</span>
          <span>{maxQuantity}</span>
        </div>
      </div>
      
      <div className="pt-2 border-t">
        <div className="flex justify-between text-sm mb-1">
          <span>Base Price ({quantity} × ₺{basePrice.toFixed(2)})</span>
          <span>₺{(basePrice * quantity).toFixed(2)}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600 mb-1">
            <span>Volume Discount ({discount}%)</span>
            <span>-₺{((basePrice * quantity) * (discount / 100)).toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between font-medium mt-2 pt-2 border-t">
          <span>Total Price</span>
          <div className="flex items-center">
            <span className="text-lg">₺{totalPrice.toFixed(2)}</span>
            {discount > 0 && <Sparkles className="w-4 h-4 ml-1 text-amber-500" />}
          </div>
        </div>
      </div>
      
      {discount > 0 && (
        <div className="flex items-center text-xs text-green-600 mt-1">
          <TrendingUp className="w-3 h-3 mr-1" />
          <span>Buy more to unlock bigger discounts!</span>
        </div>
      )}
    </div>
  );
};

export default PricingCalculator;