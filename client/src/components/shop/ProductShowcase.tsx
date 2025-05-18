import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Image as ImageIcon, 
  Monitor, 
  Award, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductShowcaseProps {
  platform: string;
  category: string;
  platformImage?: string;
  previewImages?: string[];
}

// Mock showcase data for different platforms - in a real app, these would come from the server
const platformDemos = {
  twitch: {
    viewersAnimation: [120, 155, 198, 249, 310, 356, 425, 503, 595, 632, 744, 829],
    chatMessages: [
      { username: 'viewer1', message: 'Great stream today!' },
      { username: 'viewer2', message: 'Love the content!' },
      { username: 'viewer3', message: 'Just followed!' },
      { username: 'viewer4', message: 'Amazing gameplay!' },
      { username: 'viewer5', message: 'First time here, loving it!' },
    ]
  },
  youtube: {
    viewersAnimation: [240, 386, 467, 589, 752, 918, 1057, 1245, 1462, 1674, 1898, 2109],
    chatMessages: [
      { username: 'user1', message: 'Subscribed! Great video' },
      { username: 'user2', message: 'This is so helpful!' },
      { username: 'user3', message: 'Clicked the bell 🔔' },
      { username: 'user4', message: 'Amazing content as always' },
      { username: 'user5', message: 'New fan here!' },
    ]
  },
  tiktok: {
    viewersAnimation: [1200, 1756, 2342, 3120, 5782, 8943, 12445, 15888, 19342, 24567, 29876, 35421],
    chatMessages: [
      { username: 'follower1', message: 'Following!' },
      { username: 'follower2', message: '🔥🔥🔥' },
      { username: 'follower3', message: 'Love this trend!' },
      { username: 'follower4', message: 'This went viral!' },
      { username: 'follower5', message: 'New follower here!' },
    ]
  }
};

const ProductShowcase: React.FC<ProductShowcaseProps> = ({ 
  platform, 
  category,
  platformImage,
  previewImages = []
}) => {
  const [imageIndex, setImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewersCount, setViewersCount] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<Array<{username: string, message: string}>>([]);
  
  const platformKey = platform.toLowerCase() as keyof typeof platformDemos;
  const demo = platformDemos[platformKey] || platformDemos.twitch;
  
  // Simulate animated viewer count increase
  useEffect(() => {
    if (!isPlaying) return;
    
    let animationIndex = 0;
    const interval = setInterval(() => {
      if (animationIndex < demo.viewersAnimation.length) {
        setViewersCount(demo.viewersAnimation[animationIndex]);
        animationIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying, demo]);
  
  // Simulate chat messages appearing
  useEffect(() => {
    if (!isPlaying) return;
    
    let messageIndex = 0;
    const interval = setInterval(() => {
      if (messageIndex < demo.chatMessages.length) {
        setVisibleMessages(prev => [
          ...prev, 
          demo.chatMessages[messageIndex]
        ]);
        messageIndex++;
      } else {
        clearInterval(interval);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isPlaying, demo]);
  
  // Reset demo on stop
  useEffect(() => {
    if (!isPlaying) {
      setViewersCount(0);
      setVisibleMessages([]);
    }
  }, [isPlaying]);

  // Image gallery navigation
  const handlePrevImage = () => {
    setImageIndex(prev => (prev > 0 ? prev - 1 : previewImages.length - 1));
  };

  const handleNextImage = () => {
    setImageIndex(prev => (prev < previewImages.length - 1 ? prev + 1 : 0));
  };

  // Toggle demo playback
  const togglePlayback = () => {
    setIsPlaying(prev => !prev);
  };

  const renderDefaultPreview = () => {
    const platformColors: {[key: string]: string} = {
      twitch: 'bg-purple-800',
      youtube: 'bg-red-800',
      tiktok: 'bg-black',
      instagram: 'bg-pink-700',
      default: 'bg-blue-800'
    };
    
    const bgColor = platformColors[platform.toLowerCase()] || platformColors.default;
    
    return (
      <div className={`relative ${bgColor} h-64 rounded-t-lg flex flex-col`}>
        {/* Platform bar */}
        <div className="flex items-center justify-between p-3 bg-black/30">
          <div className="flex items-center space-x-2">
            <Monitor className="h-4 w-4 text-white" />
            <span className="text-white font-medium text-sm capitalize">{platform}</span>
          </div>
          <Badge variant="outline" className="bg-white/10 text-white text-xs">
            {isPlaying ? 'LIVE' : 'PREVIEW'}
          </Badge>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          {/* Viewer counter */}
          <div className="bg-black/20 p-2 rounded self-start flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500' : 'bg-gray-400'}`}></div>
            <span className="text-white text-sm">
              {viewersCount > 0 ? `${viewersCount.toLocaleString()} viewers` : 'Start demo to see viewers'}
            </span>
          </div>
          
          {/* Chat messages */}
          <div className="mt-auto">
            <div className="bg-black/30 rounded p-3 max-h-32 overflow-y-auto">
              {visibleMessages.length > 0 ? (
                visibleMessages.map((msg, i) => (
                  <div key={i} className="mb-2 last:mb-0 text-sm">
                    <span className="font-bold text-blue-300">{msg.username}: </span>
                    <span className="text-white">{msg.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-white/60 text-sm italic">
                  {isPlaying ? 'Chat messages will appear soon...' : 'Start demo to see chat messages'}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="absolute bottom-4 right-4">
          <Button 
            size="sm" 
            variant="secondary"
            className="h-8 w-8 rounded-full p-0 bg-white/20 hover:bg-white/30"
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 text-white" />
            ) : (
              <Play className="h-4 w-4 text-white" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Award className="h-5 w-5 text-blue-500" />
          <h3 className="font-medium">Service Showcase</h3>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden shadow-sm">
        {previewImages && previewImages.length > 0 ? (
          <>
            <div className="relative h-64 bg-gray-100 dark:bg-gray-800">
              <img
                src={previewImages[imageIndex]}
                alt={`${platform} ${category} preview`}
                className="w-full h-full object-cover"
              />
              
              {/* Image gallery controls */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 rounded-full p-0 bg-black/20 hover:bg-black/40"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 rounded-full p-0 bg-black/20 hover:bg-black/40"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </Button>
              </div>
              
              {/* Image indicator */}
              <div className="absolute bottom-2 inset-x-0 flex justify-center space-x-1">
                {previewImages.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i === imageIndex ? 'bg-white' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-700 text-xs text-center text-gray-500 dark:text-gray-300">
              {platformImage ? (
                <div className="flex items-center justify-center gap-2">
                  <ImageIcon className="h-3 w-3" />
                  <span>Screenshot {imageIndex + 1} of {previewImages.length}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <ImageIcon className="h-3 w-3" />
                  <span>Visual representation only</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {renderDefaultPreview()}
            <div className="p-3 bg-gray-50 dark:bg-gray-700 text-xs flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-300">Interactive Demo</span>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-6 text-xs"
                onClick={togglePlayback}
              >
                {isPlaying ? 'Reset Demo' : 'Start Demo'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductShowcase;