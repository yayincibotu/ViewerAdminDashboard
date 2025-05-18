import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, FileText, CheckCircle, AlertCircle, Copy, List, MessageSquare, TagIcon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface SeoContentGeneratorProps {
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
}

interface GeneratedSeoContent {
  title: string;
  metaDescription: string;
  mainContent: string;
  faq: { question: string; answer: string }[];
  lsiKeywords: string[];
  citations: string[];
}

const SeoContentGenerator: React.FC<SeoContentGeneratorProps> = ({
  productId,
  productName,
  platform,
  category,
  price,
  minOrder,
  maxOrder,
  serviceType = 'viewer service',
  features = [],
  onContentGenerated
}) => {
  const [generatedContent, setGeneratedContent] = useState<GeneratedSeoContent | null>(null);
  const { toast } = useToast();

  const generateContentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/perplexity/generate', {
        productId,
        productName,
        platform,
        category,
        price,
        minOrder,
        maxOrder,
        serviceType,
        features
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setGeneratedContent(data.data);
        if (onContentGenerated) {
          onContentGenerated(data.data);
        }
        toast({
          title: 'Content Generated Successfully',
          description: 'SEO content has been generated for your product',
        });
      } else {
        toast({
          title: 'Content Generation Failed',
          description: data.message || 'Failed to generate SEO content',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate SEO content',
        variant: 'destructive',
      });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Content has been copied to your clipboard',
    });
  };

  if (!generatedContent && generateContentMutation.isPending) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Generating SEO Content</CardTitle>
          <CardDescription>
            Using AI to create optimized content for your product. This may take a moment...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-10 space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-center text-muted-foreground">
            Analyzing product information and generating content tailored to {platform} {category} services...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!generatedContent) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>AI-Powered SEO Content Generator</CardTitle>
          <CardDescription>
            Generate optimized content for your product to improve search visibility and conversion rates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 bg-muted/20">
            <h3 className="font-medium mb-2">Product Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Name:</span> {productName}</div>
              <div><span className="font-medium">Platform:</span> {platform}</div>
              <div><span className="font-medium">Category:</span> {category}</div>
              <div><span className="font-medium">Price:</span> ${price}</div>
              <div><span className="font-medium">Min Order:</span> {minOrder}</div>
              <div><span className="font-medium">Max Order:</span> {maxOrder}</div>
              <div className="col-span-2"><span className="font-medium">Service Type:</span> {serviceType}</div>
              {features.length > 0 && (
                <div className="col-span-2">
                  <span className="font-medium">Features:</span>{' '}
                  {features.map((feature, i) => (
                    <Badge key={i} variant="outline" className="mr-1 mb-1">{feature}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => generateContentMutation.mutate()} 
            disabled={generateContentMutation.isPending}
            className="w-full flex items-center gap-2"
          >
            {generateContentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <FileText className="w-4 h-4" />
            Generate SEO Content
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Generated SEO Content</CardTitle>
            <CardDescription>
              AI-optimized content ready to use for your product
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateContentMutation.mutate()}
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="main-content">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="main-content" className="flex items-center gap-1">
              <FileText className="w-4 h-4" /> Main Content
            </TabsTrigger>
            <TabsTrigger value="meta" className="flex items-center gap-1">
              <TagIcon className="w-4 h-4" /> Meta Data
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" /> FAQ
            </TabsTrigger>
            <TabsTrigger value="keywords" className="flex items-center gap-1">
              <List className="w-4 h-4" /> Keywords
            </TabsTrigger>
          </TabsList>

          <TabsContent value="main-content" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Main Content</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(generatedContent.mainContent)}
                className="flex items-center gap-1"
              >
                <Copy className="w-4 h-4" />
                Copy
              </Button>
            </div>
            <Textarea 
              value={generatedContent.mainContent} 
              readOnly 
              className="min-h-[300px] font-serif" 
            />
          </TabsContent>

          <TabsContent value="meta" className="space-y-4">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">SEO Title</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedContent.title)}
                    className="flex items-center gap-1 h-6"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </Button>
                </div>
                <Textarea value={generatedContent.title} readOnly className="h-14" />
                <div className="flex justify-end mt-1">
                  <Badge variant={generatedContent.title.length <= 60 ? "outline" : "destructive"}>
                    {generatedContent.title.length}/60 characters
                  </Badge>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Meta Description</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedContent.metaDescription)}
                    className="flex items-center gap-1 h-6"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </Button>
                </div>
                <Textarea value={generatedContent.metaDescription} readOnly className="h-24" />
                <div className="flex justify-end mt-1">
                  <Badge variant={generatedContent.metaDescription.length <= 160 ? "outline" : "destructive"}>
                    {generatedContent.metaDescription.length}/160 characters
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="faq" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">FAQ Questions & Answers</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(generatedContent.faq.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n'))}
                className="flex items-center gap-1"
              >
                <Copy className="w-4 h-4" />
                Copy All
              </Button>
            </div>
            <div className="space-y-4">
              {generatedContent.faq.map((faq, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Question {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`Q: ${faq.question}\nA: ${faq.answer}`)}
                      className="flex items-center gap-1 h-6"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </Button>
                  </div>
                  <p className="font-medium mb-2">{faq.question}</p>
                  <Separator className="my-2" />
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="keywords" className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">LSI Keywords</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generatedContent.lsiKeywords.join(', '))}
                  className="flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  Copy All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {generatedContent.lsiKeywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-xs py-1 px-2">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            {generatedContent.citations && generatedContent.citations.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Sources & Citations</h3>
                <ul className="text-sm space-y-1 list-disc pl-5">
                  {generatedContent.citations.map((citation, index) => (
                    <li key={index}>
                      <a 
                        href={citation} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {citation}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setGeneratedContent(null)}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (onContentGenerated && generatedContent) {
              onContentGenerated(generatedContent);
              toast({
                title: 'Content Applied',
                description: 'The generated content has been applied to your product',
              });
            }
          }}
          className="flex items-center gap-1"
        >
          <CheckCircle className="w-4 h-4" />
          Apply to Product
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SeoContentGenerator;