import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import SeoContentGenerator, { GeneratedSeoContent } from './SeoContentGenerator';
import { Sparkles } from 'lucide-react';

interface SeoContentGeneratorDialogProps {
  productId: number;
  productName: string;
  platform: string;
  category: string;
  price: number;
  minOrder: number;
  maxOrder: number;
  serviceType?: string;
  features?: string[];
  onContentGenerated?: (content: GeneratedSeoContent) => void;
  buttonLabel?: string;
  triggerClassName?: string;
}

const SeoContentGeneratorDialog: React.FC<SeoContentGeneratorDialogProps> = ({
  productId,
  productName,
  platform,
  category,
  price,
  minOrder,
  maxOrder,
  serviceType,
  features,
  onContentGenerated,
  buttonLabel = "Generate SEO Content",
  triggerClassName,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleContentGenerated = (content: GeneratedSeoContent) => {
    if (onContentGenerated) {
      onContentGenerated(content);
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`flex items-center gap-1 ${triggerClassName}`}
        >
          <Sparkles className="w-4 h-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>AI SEO Content Generator</DialogTitle>
          <DialogDescription>
            Generate optimized content for your product using Perplexity AI
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <SeoContentGenerator
            productId={productId}
            productName={productName}
            platform={platform}
            category={category}
            price={price}
            minOrder={minOrder}
            maxOrder={maxOrder}
            serviceType={serviceType}
            features={features}
            onContentGenerated={handleContentGenerated}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SeoContentGeneratorDialog;