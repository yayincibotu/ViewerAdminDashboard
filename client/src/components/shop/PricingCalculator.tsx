import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Check, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PricingCalculatorProps {
  minQuantity: number;
  maxQuantity: number;
  price: number;
  discountPercentage?: number;
  onChange: (value: number) => void;
  defaultValue?: number;
}

const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  minQuantity,
  maxQuantity,
  price,
  discountPercentage = 0,
  onChange,
  defaultValue
}) => {
  const [quantity, setQuantity] = useState(defaultValue || minQuantity);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate the price with discount
  const calculateDiscountedPrice = (qty: number): number => {
    const basePrice = price * qty;
    return discountPercentage > 0 
      ? basePrice * (1 - (discountPercentage / 100)) 
      : basePrice;
  };
  
  // Total price with discount applied
  const totalPrice = calculateDiscountedPrice(quantity);
  
  // Calculate savings if there's a discount
  const savings = discountPercentage > 0 
    ? (price * quantity) - totalPrice 
    : 0;
  
  // Common quantity presets
  const presets = [
    { label: "Min", value: minQuantity },
    { label: "1000", value: 1000 },
    { label: "5000", value: 5000 },
    { label: "10K", value: 10000 },
    { label: "Max", value: maxQuantity }
  ].filter(preset => 
    preset.value >= minQuantity && 
    preset.value <= maxQuantity
  );
  
  // Handle manual input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value.replace(/\D/g, ''));
    
    if (isNaN(value)) {
      setError("Please enter a valid number");
      return;
    }
    
    if (value < minQuantity) {
      setError(`Minimum order is ${minQuantity}`);
      setQuantity(value);
      return;
    }
    
    if (value > maxQuantity) {
      setError(`Maximum order is ${maxQuantity}`);
      setQuantity(value);
      return;
    }
    
    setError(null);
    setQuantity(value);
  };
  
  // Handle preset selection
  const handlePresetClick = (value: number) => {
    setQuantity(value);
    setError(null);
  };
  
  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    setQuantity(value[0]);
    setError(null);
  };
  
  // Notify parent component when quantity changes
  useEffect(() => {
    if (!error) {
      onChange(quantity);
    }
  }, [quantity, error, onChange]);
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">Quantity</label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-gray-500">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">
                Adjust the quantity to see how it affects the total price. Larger orders may qualify for volume discounts.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Quantity input */}
      <div className="relative mb-4">
        <Input
          type="text"
          value={quantity}
          onChange={handleInputChange}
          className={error ? 'border-red-500' : ''}
        />
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
      
      {/* Slider */}
      <div className="mb-6">
        <Slider
          defaultValue={[defaultValue || minQuantity]}
          min={minQuantity}
          max={maxQuantity}
          step={Math.max(1, Math.floor((maxQuantity - minQuantity) / 100))}
          value={[quantity]}
          onValueChange={handleSliderChange}
          className="py-4"
        />
        
        {/* Min/max labels */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>{minQuantity}</span>
          <span>{maxQuantity}</span>
        </div>
      </div>
      
      {/* Quick presets */}
      <div className="flex flex-wrap gap-2 mb-6">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset.value)}
            className={`px-3 py-1 text-sm rounded-full border ${
              quantity === preset.value
                ? 'bg-primary text-white border-primary'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      
      {/* Price summary */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Price per unit:</span>
          <span className="text-sm font-medium">₺{price.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Quantity:</span>
          <span className="text-sm font-medium">{quantity.toLocaleString()}</span>
        </div>
        
        {discountPercentage > 0 && (
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Discount:</span>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {discountPercentage}% off (₺{savings.toFixed(2)})
            </span>
          </div>
        )}
        
        <div className="border-t dark:border-gray-700 my-2 pt-2 flex justify-between items-center">
          <span className="text-sm font-medium">Total:</span>
          <span className="text-lg font-bold">₺{totalPrice.toFixed(2)}</span>
        </div>
        
        {!error && (
          <div className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center justify-end">
            <Check className="h-3 w-3 mr-1" />
            Ready to order
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingCalculator;