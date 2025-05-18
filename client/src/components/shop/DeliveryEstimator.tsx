import React, { useState, useEffect } from 'react';
import { Clock, Rocket, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DeliveryEstimatorProps {
  baseDeliveryTime: string;
  quantity: number;
  speedFactor?: number; // 1 = normal, < 1 = faster, > 1 = slower
}

const DeliveryEstimator: React.FC<DeliveryEstimatorProps> = ({
  baseDeliveryTime,
  quantity,
  speedFactor = 1
}) => {
  const [estimatedTime, setEstimatedTime] = useState('');
  const [timeInMinutes, setTimeInMinutes] = useState(0);
  const [deliveryStatus, setDeliveryStatus] = useState<'normal' | 'express' | 'delayed'>('normal');
  
  useEffect(() => {
    // Parse base delivery time (e.g., "30 minutes", "1-2 hours", "24 hours")
    let baseMinutes = 30; // Default
    
    if (baseDeliveryTime) {
      if (baseDeliveryTime.includes('minute')) {
        const minutes = parseInt(baseDeliveryTime);
        if (!isNaN(minutes)) baseMinutes = minutes;
      } else if (baseDeliveryTime.includes('hour')) {
        const hoursText = baseDeliveryTime.split(' ')[0];
        if (hoursText.includes('-')) {
          // Range like "1-2 hours"
          const [minHours, maxHours] = hoursText.split('-').map(h => parseInt(h));
          if (!isNaN(minHours) && !isNaN(maxHours)) {
            // Use average for estimation
            baseMinutes = ((minHours + maxHours) / 2) * 60;
          }
        } else {
          // Single value like "2 hours"
          const hours = parseInt(hoursText);
          if (!isNaN(hours)) baseMinutes = hours * 60;
        }
      }
    }
    
    // Calculate estimated time based on quantity
    // Formula: base time + (quantity factor * base time)
    const quantityFactor = Math.log10(Math.max(quantity, 10)) / 2; // Logarithmic scaling
    const calculatedMinutes = baseMinutes * (1 + quantityFactor) * speedFactor;
    setTimeInMinutes(Math.round(calculatedMinutes));
    
    // Format the display time
    let timeDisplay = '';
    if (calculatedMinutes < 60) {
      timeDisplay = `${Math.round(calculatedMinutes)} minutes`;
    } else if (calculatedMinutes < 120) {
      timeDisplay = `1 hour ${Math.round(calculatedMinutes - 60)} minutes`;
    } else {
      const hours = Math.floor(calculatedMinutes / 60);
      const minutes = Math.round(calculatedMinutes % 60);
      timeDisplay = `${hours} hours${minutes > 0 ? ` ${minutes} minutes` : ''}`;
    }
    setEstimatedTime(timeDisplay);
    
    // Set delivery status based on calculated time
    if (calculatedMinutes < baseMinutes * 0.8) {
      setDeliveryStatus('express');
    } else if (calculatedMinutes > baseMinutes * 1.5) {
      setDeliveryStatus('delayed');
    } else {
      setDeliveryStatus('normal');
    }
  }, [baseDeliveryTime, quantity, speedFactor]);
  
  // Delivery status colors and labels
  const statusConfig = {
    express: {
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      progressColor: 'bg-green-500',
      label: 'Express Delivery'
    },
    normal: {
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      progressColor: 'bg-blue-500',
      label: 'Standard Delivery'
    },
    delayed: {
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      progressColor: 'bg-amber-500',
      label: 'Extended Delivery'
    }
  };
  
  // Calculate estimated completion percentage (max delivery time arbitrarily set to 24 hours)
  const maxDeliveryMinutes = 24 * 60;
  const completionPercentage = Math.min(100, Math.max(5, 100 - (timeInMinutes / maxDeliveryMinutes * 100)));

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium">Delivery Time Estimate</h3>
        </div>
        <Badge
          variant="outline"
          className={statusConfig[deliveryStatus].color}
        >
          {statusConfig[deliveryStatus].label}
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-end text-sm">
          <span>Estimated completion time:</span>
          <span className="font-semibold text-base">{estimatedTime}</span>
        </div>
        
        <Progress 
          value={completionPercentage} 
          className={`h-2 ${statusConfig[deliveryStatus].progressColor}`}
        />
        
        <div className="flex justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <Rocket className="w-3 h-3 mr-1" />
            <span>Starts immediately</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>Completes in {estimatedTime}</span>
          </div>
        </div>
      </div>
      
      {deliveryStatus === 'delayed' && (
        <div className="flex items-start mt-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>Larger orders take more time to process. Consider breaking into smaller orders for faster delivery.</span>
        </div>
      )}
    </div>
  );
};

export default DeliveryEstimator;