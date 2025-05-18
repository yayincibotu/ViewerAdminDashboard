import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { HelpCircle, Rocket, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DeliveryEstimatorProps {
  baseDeliveryTime: string;
  quantity: number;
  speedFactor?: number; // 1 = normal, < 1 = faster, > 1 = slower
}

// Parse time string like "1-2 hours" or "24 hours" to minutes
const parseTimeToMinutes = (timeString: string): { min: number; max: number } => {
  // Handle ranges like "1-2 hours"
  if (timeString.includes('-')) {
    const [minStr, maxPart] = timeString.split('-');
    const [maxStr, unit] = maxPart.trim().split(' ');
    
    const min = parseInt(minStr.trim());
    const max = parseInt(maxStr.trim());
    
    // Convert to minutes based on unit
    if (unit.toLowerCase().includes('minute')) {
      return { min, max };
    } else if (unit.toLowerCase().includes('hour')) {
      return { min: min * 60, max: max * 60 };
    } else if (unit.toLowerCase().includes('day')) {
      return { min: min * 24 * 60, max: max * 24 * 60 };
    }
  } 
  // Handle single values like "24 hours"
  else {
    const [valueStr, unit] = timeString.trim().split(' ');
    const value = parseInt(valueStr);
    
    // Convert to minutes based on unit
    if (unit.toLowerCase().includes('minute')) {
      return { min: value, max: value };
    } else if (unit.toLowerCase().includes('hour')) {
      return { min: value * 60, max: value * 60 };
    } else if (unit.toLowerCase().includes('day')) {
      return { min: value * 24 * 60, max: value * 24 * 60 };
    }
  }
  
  // Default
  return { min: 60, max: 120 };
};

// Format minutes to human-readable time
const formatMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else if (minutes < 1440) { // less than a day
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} hours ${mins} minutes` : `${hours} hours`;
  } else {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return hours > 0 ? `${days} days ${hours} hours` : `${days} days`;
  }
};

const DeliveryEstimator: React.FC<DeliveryEstimatorProps> = ({
  baseDeliveryTime,
  quantity,
  speedFactor = 1
}) => {
  const [estimatedTime, setEstimatedTime] = useState('Calculating...');
  const [deliveryStatus, setDeliveryStatus] = useState('normal');
  const [completionPercentage, setCompletionPercentage] = useState(50);
  
  // Calculate adjusted delivery time based on quantity and speed factor
  useEffect(() => {
    // Parse the base delivery time to minutes
    const { min, max } = parseTimeToMinutes(baseDeliveryTime);
    
    // Apply quantity scaling - larger quantities take more time
    const quantityFactor = Math.log10(quantity) / Math.log10(1000);
    const quantityAdjustment = 1 + (quantityFactor > 1 ? quantityFactor - 1 : 0);
    
    // Apply speed factor (from props)
    const adjustedMin = Math.ceil(min * quantityAdjustment * speedFactor);
    const adjustedMax = Math.ceil(max * quantityAdjustment * speedFactor);
    
    // Format the result
    let result = '';
    if (adjustedMin === adjustedMax) {
      result = formatMinutes(adjustedMin);
    } else {
      result = `${formatMinutes(adjustedMin)} - ${formatMinutes(adjustedMax)}`;
    }
    
    setEstimatedTime(result);
    
    // Set delivery status based on time
    if (adjustedMax < 30) { // less than 30 minutes
      setDeliveryStatus('fast');
      setCompletionPercentage(90);
    } else if (adjustedMax > 1440) { // more than a day
      setDeliveryStatus('slow');
      setCompletionPercentage(30);
    } else {
      setDeliveryStatus('normal');
      setCompletionPercentage(60);
    }
    
  }, [baseDeliveryTime, quantity, speedFactor]);
  
  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium flex items-center">
          Delivery Estimate
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ml-1 text-gray-400 hover:text-gray-600">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  This is an estimated time for your order to be completed based on current platform traffic and order size.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h3>
        <span className={`text-sm font-medium`}>
          {deliveryStatus === 'fast' ? 'Express' : deliveryStatus === 'slow' ? 'Standard' : 'Priority'}
        </span>
      </div>
      
      <div className="mb-2 flex justify-between text-sm">
        <span>Estimated completion time:</span>
        <span className="font-semibold text-base">{estimatedTime}</span>
      </div>
      
      <Progress 
        value={completionPercentage} 
        className="h-2"
      />
      
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <div className="flex items-center">
          <Rocket className="w-3 h-3 mr-1" />
          <span>Order Processing</span>
        </div>
        <div className="flex items-center">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          <span>Completion</span>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>* Actual delivery times may vary based on platform conditions and order volume.</p>
      </div>
    </div>
  );
};

export default DeliveryEstimator;