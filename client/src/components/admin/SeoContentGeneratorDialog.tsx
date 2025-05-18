import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Save, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';

export interface SeoProductData {
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

interface SeoContentGeneratorDialogProps {
  productData: SeoProductData;
  onClose: () => void;
  onSave: (data: {
    seoTitle: string;
    seoDescription: string;
    productDescription: string;
    faqQuestions: string[];
    faqAnswers: string[];
    lsiKeywords: string[];
  }) => void;
}

const SeoContentGeneratorDialog: React.FC<SeoContentGeneratorDialogProps> = ({ 
  productData, 
  onClose,
  onSave
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedSeoContent | null>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const generateSeoContent = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await apiRequest('POST', '/api/perplexity-seo/generate', productData);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to generate SEO content');
      }

      setGeneratedContent(result.data);
      setActiveTab('preview');
    } catch (err) {
      console.error('Error generating SEO content:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: "Error",
        description: `Failed to generate SEO content: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveContent = () => {
    if (!generatedContent) return;

    const faqQuestions = generatedContent.faq.map(item => item.question);
    const faqAnswers = generatedContent.faq.map(item => item.answer);

    onSave({
      seoTitle: generatedContent.title,
      seoDescription: generatedContent.metaDescription,
      productDescription: generatedContent.mainContent,
      faqQuestions,
      faqAnswers,
      lsiKeywords: generatedContent.lsiKeywords
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>SEO Content Generator</CardTitle>
        <CardDescription>Generate optimized content for your product</CardDescription>
      </CardHeader>
      
      {!generatedContent ? (
        <>
          <CardContent>
            <div className="bg-muted rounded-md p-6 text-center">
              <p className="mb-4">Click the "Generate SEO Content" button to create optimized content for this product</p>
              <div className="space-y-2 text-left max-w-md mx-auto bg-card p-4 rounded-md border">
                <p><strong>Product:</strong> {productData.productName}</p>
                <p><strong>Platform:</strong> {productData.platform}</p>
                <p><strong>Category:</strong> {productData.category}</p>
                <p><strong>Price:</strong> ${productData.price.toFixed(2)}</p>
                <p><strong>Order Range:</strong> {productData.minOrder} - {productData.maxOrder}</p>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              disabled={isGenerating}
              onClick={generateSeoContent}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate SEO Content
                </>
              )}
            </Button>
          </CardFooter>
        </>
      ) : (
        <>
          <CardContent>
            <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="title">Title & Meta</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="mt-4 space-y-4">
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-semibold text-blue-600">{generatedContent.title}</h3>
                    <p className="text-sm text-gray-600">{generatedContent.metaDescription}</p>
                    <div className="border-t my-2"></div>
                    <div className="prose max-w-none mt-2">
                      <ReactMarkdown>{generatedContent.mainContent}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="title" className="mt-4 space-y-4">
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold mb-1">SEO Title</h3>
                    <p className="p-2 bg-gray-100 rounded">{generatedContent.title}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {generatedContent.title.length} characters (Recommended: 50-60)
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold mb-1">Meta Description</h3>
                    <p className="p-2 bg-gray-100 rounded">{generatedContent.metaDescription}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {generatedContent.metaDescription.length} characters (Recommended: 150-160)
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="mt-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-semibold mb-2">Content</h3>
                  <div className="prose max-w-none p-2 bg-gray-100 rounded overflow-auto max-h-[400px]">
                    <ReactMarkdown>{generatedContent.mainContent}</ReactMarkdown>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="faq" className="mt-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-semibold mb-2">FAQ Questions & Answers</h3>
                  <div className="space-y-4 max-h-[400px] overflow-auto">
                    {generatedContent.faq.map((item, index) => (
                      <div key={index} className="border p-3 rounded">
                        <h4 className="font-medium">{item.question}</h4>
                        <p className="mt-1 text-gray-700">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="keywords" className="mt-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-semibold mb-2">LSI Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.lsiKeywords.map((keyword, index) => (
                      <div key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                        {keyword}
                      </div>
                    ))}
                  </div>
                </div>
                
                {generatedContent.citations && generatedContent.citations.length > 0 && (
                  <div className="border rounded-md p-4 mt-4">
                    <h3 className="font-semibold mb-2">References</h3>
                    <ul className="list-disc pl-5 text-sm">
                      {generatedContent.citations.map((citation, index) => (
                        <li key={index} className="text-blue-600">
                          <a href={citation} target="_blank" rel="noopener noreferrer">{citation}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between gap-2">
            <Button 
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveContent}
              className="flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              Save Content to Product
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default SeoContentGeneratorDialog;