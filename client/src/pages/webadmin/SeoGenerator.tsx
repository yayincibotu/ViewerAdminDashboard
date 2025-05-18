import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/dashboard/AdminLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  FileText, 
  TagIcon, 
  MessageSquare, 
  List, 
  Copy, 
  Check,
  ArrowLeft
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SeoProductData {
  productId: number;
  productName: string;
  platform: string;
  category: string;
  price: number;
  minOrder: number;
  maxOrder: number;
  serviceType: string;
}

interface GeneratedSeoContent {
  title: string;
  metaDescription: string;
  mainContent: string;
  faq: { question: string; answer: string }[];
  lsiKeywords: string[];
  citations: string[];
}

const SeoGenerator: React.FC = () => {
  const [productData, setProductData] = useState<SeoProductData | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedSeoContent | null>(null);
  const { toast } = useToast();
  const [copiedFields, setCopiedFields] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Get product data from sessionStorage
    const savedData = sessionStorage.getItem('seoProductData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setProductData(parsedData);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load product data',
          variant: 'destructive',
        });
      }
    }
  }, [toast]);

  const generateContentMutation = useMutation({
    mutationFn: async () => {
      if (!productData) {
        throw new Error('No product data available');
      }
      
      const res = await apiRequest('POST', '/api/perplexity/generate', productData);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setGeneratedContent(data.data);
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

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFields(prev => ({ ...prev, [field]: true }));
    
    toast({
      title: 'Copied to Clipboard',
      description: 'Content has been copied to your clipboard',
    });
    
    // Reset the copied status after 3 seconds
    setTimeout(() => {
      setCopiedFields(prev => ({ ...prev, [field]: false }));
    }, 3000);
  };

  const handleSaveContent = async () => {
    if (!productData || !generatedContent) return;
    
    try {
      const res = await apiRequest('PATCH', `/api/admin/digital-products/${productData.productId}/seo`, {
        seoTitle: generatedContent.title,
        seoDescription: generatedContent.metaDescription,
        lsiKeywords: generatedContent.lsiKeywords.join(', '),
        faqQuestions: generatedContent.faq.map(f => f.question).join('\n'),
        faqAnswers: generatedContent.faq.map(f => f.answer).join('\n'),
        productDescription: generatedContent.mainContent
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: 'SEO Content Saved',
          description: 'The generated content has been saved to the product',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to save SEO content',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save SEO content',
        variant: 'destructive',
      });
    }
  };

  if (!productData) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Content Generator</CardTitle>
              <CardDescription>No product data available</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTitle>No Product Data Found</AlertTitle>
                <AlertDescription>
                  Please go back to the Digital Products page and select a product to generate SEO content for.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => window.close()}
                className="w-full flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Close Window
              </Button>
            </CardFooter>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (!generatedContent && generateContentMutation.isPending) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Generating SEO Content</CardTitle>
              <CardDescription>
                Using AI to create optimized content for {productData.productName}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-10 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">
                Analyzing product information and generating content tailored to {productData.platform} {productData.category} services...
              </p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>SEO Content Generator</CardTitle>
                <CardDescription>
                  AI-optimized content for {productData.productName}
                </CardDescription>
              </div>
              {generatedContent ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateContentMutation.mutate()}
                  className="flex items-center gap-1"
                >
                  <Loader2 className={`w-4 h-4 ${generateContentMutation.isPending ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
              ) : (
                <Button
                  onClick={() => generateContentMutation.mutate()}
                  className="flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  Generate SEO Content
                </Button>
              )}
            </div>
          </CardHeader>
          
          {generatedContent ? (
            <>
              <CardContent className="space-y-4">
                <Tabs defaultValue="meta">
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="meta" className="flex items-center gap-1">
                      <TagIcon className="w-4 h-4" /> Meta Data
                    </TabsTrigger>
                    <TabsTrigger value="main-content" className="flex items-center gap-1">
                      <FileText className="w-4 h-4" /> Main Content
                    </TabsTrigger>
                    <TabsTrigger value="faq" className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" /> FAQ
                    </TabsTrigger>
                    <TabsTrigger value="keywords" className="flex items-center gap-1">
                      <List className="w-4 h-4" /> Keywords
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="meta">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>SEO Title</Label>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(generatedContent.title, 'title')}
                            className="h-8 px-2"
                          >
                            {copiedFields['title'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <Input 
                          value={generatedContent.title} 
                          readOnly 
                          className="font-medium"
                        />
                        <p className="text-xs text-muted-foreground">
                          Character count: {generatedContent.title.length}/60
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Meta Description</Label>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(generatedContent.metaDescription, 'metaDescription')}
                            className="h-8 px-2"
                          >
                            {copiedFields['metaDescription'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <Textarea 
                          value={generatedContent.metaDescription} 
                          readOnly 
                          className="min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          Character count: {generatedContent.metaDescription.length}/160
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="main-content">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Main Content</Label>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyToClipboard(generatedContent.mainContent, 'mainContent')}
                          className="h-8 px-2"
                        >
                          {copiedFields['mainContent'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <Textarea 
                        value={generatedContent.mainContent} 
                        readOnly 
                        className="min-h-[400px] font-sans"
                      />
                      <p className="text-xs text-muted-foreground">
                        Word count: {generatedContent.mainContent.split(/\s+/).length} words
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="faq">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>FAQ Questions & Answers</Label>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            const faqText = generatedContent.faq.map(item => 
                              `Q: ${item.question}\nA: ${item.answer}`
                            ).join('\n\n');
                            copyToClipboard(faqText, 'faq');
                          }}
                          className="h-8 px-2"
                        >
                          {copiedFields['faq'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {generatedContent.faq.map((item, index) => (
                          <div key={index} className="border rounded-md p-4">
                            <p className="font-medium mb-2">Q: {item.question}</p>
                            <p className="text-muted-foreground">A: {item.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="keywords">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>LSI Keywords</Label>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(generatedContent.lsiKeywords.join(', '), 'lsiKeywords')}
                            className="h-8 px-2"
                          >
                            {copiedFields['lsiKeywords'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {generatedContent.lsiKeywords.map((keyword, index) => (
                            <div key={index} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                              {keyword}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {generatedContent.citations && generatedContent.citations.length > 0 && (
                        <div className="space-y-2 mt-6">
                          <Label>Research Citations</Label>
                          <div className="border rounded-md p-4 space-y-2">
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                              {generatedContent.citations.map((citation, index) => (
                                <li key={index}>{citation}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              
              <CardFooter className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => window.close()}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Close Window
                </Button>
                <Button 
                  onClick={handleSaveContent}
                  className="flex-1 flex items-center gap-1"
                >
                  Save Content to Product
                </Button>
              </CardFooter>
            </>
          ) : (
            <CardContent>
              <div className="bg-muted rounded-md p-6 text-center">
                <p className="mb-4">Click the "Generate SEO Content" button to create optimized content for this product</p>
                <div className="space-y-2 text-left max-w-md mx-auto bg-card p-4 rounded-md border">
                  <p><strong>Product:</strong> {productData.productName}</p>
                  <p><strong>Platform:</strong> {productData.platform}</p>
                  <p><strong>Category:</strong> {productData.category}</p>
                  <p><strong>Price:</strong> ${productData.price}</p>
                  <p><strong>Order Range:</strong> {productData.minOrder} - {productData.maxOrder}</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SeoGenerator;