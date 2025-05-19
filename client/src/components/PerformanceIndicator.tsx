import * as React from 'react';
import { useState, useEffect } from 'react';
import { calculatePageWeight } from '@/lib/performance-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Info } from 'lucide-react';

interface PerformanceMetrics {
  totalBytes: string;
  jsLoadTime: string;
  cssLoadTime: string;
  imageLoadTime: string;
  imageCount: number;
  imageBytes: string;
}

interface PerformanceIndicatorProps {
  pageId: string;
  showDetails?: boolean;
}

/**
 * Displays the performance metrics of the current page
 * This component can be used to show users the performance improvements we've made
 * and how fast the page loads compared to industry standards
 */
const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({ 
  pageId,
  showDetails = false 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<boolean>(showDetails);

  useEffect(() => {
    // Wait for page load before calculating metrics
    const timer = setTimeout(async () => {
      const pageMetrics = await calculatePageWeight();
      setMetrics(pageMetrics as PerformanceMetrics);
      
      if (pageMetrics) {
        // Calculate a simple performance score (0-100)
        let calculatedScore = 100;
        
        // Reduce score based on total page size (MB)
        const totalMB = parseFloat(pageMetrics.totalBytes.split(' ')[0]);
        if (totalMB > 5) calculatedScore -= 30;
        else if (totalMB > 3) calculatedScore -= 20;
        else if (totalMB > 1) calculatedScore -= 10;
        
        // Reduce score based on image count
        if (pageMetrics.imageCount > 20) calculatedScore -= 20;
        else if (pageMetrics.imageCount > 10) calculatedScore -= 10;
        else if (pageMetrics.imageCount > 5) calculatedScore -= 5;
        
        // Reduce score based on JS load time
        const jsTime = parseFloat(pageMetrics.jsLoadTime.split(' ')[0]);
        if (jsTime > 1000) calculatedScore -= 20;
        else if (jsTime > 500) calculatedScore -= 10;
        else if (jsTime > 200) calculatedScore -= 5;
        
        setScore(Math.max(0, Math.min(100, calculatedScore)));
      }
      
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Skip rendering if we're still loading
  if (loading) return null;
  
  // Skip rendering if measurements failed
  if (!metrics) return null;

  const getScoreColor = () => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const scoreLabel = () => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Average';
    return 'Poor';
  };

  return (
    <div className="my-4 animate-fadeIn">
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-sm flex items-center">
              <span className="mr-1">Page Performance</span>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </h3>
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary hover:underline"
            >
              {expanded ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          <div className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-muted-foreground">Score</span>
              <span className="text-xs font-medium">{scoreLabel()}</span>
            </div>
            <Progress value={score} className={`h-2 ${getScoreColor()}`} />
          </div>
          
          {expanded && (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground">Page size</p>
                  <p className="font-medium">{metrics.totalBytes}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Images</p>
                  <p className="font-medium">{metrics.imageCount} ({metrics.imageBytes})</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-muted-foreground">JS Load</p>
                  <p className="font-medium">{metrics.jsLoadTime}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CSS Load</p>
                  <p className="font-medium">{metrics.cssLoadTime}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Images Load</p>
                  <p className="font-medium">{metrics.imageLoadTime}</p>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-muted-foreground">Optimizations:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Image optimization</li>
                  <li>Lazy loading</li>
                  <li>Local caching</li>
                  <li>Deferred content</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceIndicator;