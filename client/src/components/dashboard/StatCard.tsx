import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'none';
  trendValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description, 
  icon,
  trend = 'none',
  trendValue
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') {
      return <i className="fas fa-arrow-up text-green-500 mr-1"></i>;
    } else if (trend === 'down') {
      return <i className="fas fa-arrow-down text-red-500 mr-1"></i>;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend !== 'none') && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend !== 'none' && (
              <span className="flex items-center">
                {getTrendIcon()}
                {trendValue}
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
