import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Info, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProductShowcaseProps {
  name: string;
  platform: string;
  category: string;
  imageUrl?: string;
  discount?: number;
}

const ProductShowcase: React.FC<ProductShowcaseProps> = ({
  name,
  platform,
  category,
  imageUrl,
  discount
}) => {
  // Default images for different platforms (could be imported)
  const defaultImages = {
    'Twitch': [
      'https://media.istockphoto.com/id/1293231374/photo/glitch-logo-on-twitch-banner-concept-live-streaming-video-platform-for-gamers.jpg?s=612x612&w=0&k=20&c=O-BHdJpzDz8v_WZSB8AbhDqN2xTruofkEEEZQHPzOxQ=',
      'https://storage.googleapis.com/web-dev-assets/video-and-source-tags/poster.jpg'
    ],
    'YouTube': [
      'https://media.istockphoto.com/id/1403487506/photo/youtube-icon-design-3d-rendering.jpg?s=612x612&w=0&k=20&c=WqUydiYF-v0dJFZ6JBkDQ0q50qRq_xKyCpzKqB0axRs=',
      'https://placehold.co/800x450/red/white?text=YouTube+Stream'
    ],
    'Kick': [
      'https://media.istockphoto.com/id/1403487506/photo/youtube-icon-design-3d-rendering.jpg?s=612x612&w=0&k=20&c=WqUydiYF-v0dJFZ6JBkDQ0q50qRq_xKyCpzKqB0axRs=',
      'https://placehold.co/800x450/22aa55/white?text=Kick+Stream'
    ],
    'TikTok': [
      'https://media.istockphoto.com/id/1446114216/photo/tiktok-logo-tiktok-icon-3d-rendering.jpg?s=612x612&w=0&k=20&c=W0--xme0vNJX1GqgffFZHnFBIpLKH3DpBNcjae--y8g=',
      'https://placehold.co/800x450/000000/white?text=TikTok+Live'
    ],
    'Instagram': [
      'https://media.istockphoto.com/id/1401963302/photo/instagram-logo-3d-rendering-on-purple-background.jpg?s=612x612&w=0&k=20&c=WGwW5ifw2jnS0MmcJXJ9LsJJAHWgFXD7cIv0_plkWAM=',
      'https://placehold.co/800x450/5851db/white?text=Instagram+Live'
    ],
    'Trovo': [
      'https://placehold.co/800x450/1fbaed/white?text=Trovo+Stream',
      'https://placehold.co/800x450/1fbaed/white?text=Trovo+Live'
    ],
    'VK Play': [
      'https://placehold.co/800x450/4a76a8/white?text=VK+Play+Stream',
      'https://placehold.co/800x450/4a76a8/white?text=VK+Play+Live'
    ]
  };

  // Get platform-specific images or use default placeholder
  const platformImages = defaultImages[platform as keyof typeof defaultImages] || 
    ['https://placehold.co/800x450/cccccc/333333?text=Streaming+Service', 
     'https://placehold.co/800x450/333333/cccccc?text=Live+Stream'];
  
  // Add the custom image if provided
  const images = imageUrl ? [imageUrl, ...platformImages] : platformImages;
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative">
      {/* Main image */}
      <div className="relative h-[300px] md:h-[400px] bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <img
          src={images[currentImageIndex]}
          alt={`${name} - ${platform} ${category}`}
          className="w-full h-full object-cover object-center"
        />
        
        {/* Navigation arrows for gallery */}
        {images.length > 1 && (
          <>
            <Button 
              variant="secondary" 
              size="icon" 
              className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 dark:bg-black/50 shadow-md"
              onClick={prevImage}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 dark:bg-black/50 shadow-md"
              onClick={nextImage}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}
        
        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}
        
        {/* Discount label */}
        {discount && discount > 0 && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-red-600 text-white px-3 py-1.5 text-sm font-semibold">
              {discount}% OFF
            </Badge>
          </div>
        )}
      </div>
      
      {/* Product title and platform info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{name}</h1>
            <div className="flex items-center mt-1">
              <span className="text-sm opacity-80">{platform}</span>
              <span className="mx-2 opacity-50">•</span>
              <span className="text-sm opacity-80">{category}</span>
            </div>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="border-white/20 bg-black/30">
                  <ShieldCheck className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Safe & Secure Service</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Image thumbnails (optional for desktop) */}
      <div className="hidden md:flex justify-center mt-2 space-x-2 p-2">
        {images.slice(0, 5).map((img, index) => (
          <div 
            key={index}
            className={`h-16 w-16 rounded-md overflow-hidden cursor-pointer border-2 ${
              currentImageIndex === index ? 'border-primary' : 'border-transparent'
            }`}
            onClick={() => setCurrentImageIndex(index)}
          >
            <img 
              src={img} 
              alt={`Thumbnail ${index + 1}`} 
              className="h-full w-full object-cover"
            />
          </div>
        ))}
        
        {images.length > 5 && (
          <div className="h-16 w-16 rounded-md overflow-hidden cursor-pointer border-2 border-transparent bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">+{images.length - 5}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductShowcase;