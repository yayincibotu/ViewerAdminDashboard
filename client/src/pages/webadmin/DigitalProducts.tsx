import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/dashboard/AdminLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from '@/components/ui/badge';
import { Pencil, Plus, Search, Trash } from 'lucide-react';
import { FormDescription } from '@/components/ui/form';

// Form schema for digital products
const digitalProductSchema = z.object({
  name: z.string().min(1, { message: 'Ürün adı gereklidir' }),
  description: z.string().min(1, { message: 'Açıklama gereklidir' }),
  price: z.coerce.number().min(1, { message: 'Fiyat en az 1 olmalıdır' }),
  platformId: z.coerce.number().min(1, { message: 'Platform seçimi gereklidir' }),
  category: z.string().min(1, { message: 'Kategori gereklidir' }),
  serviceType: z.string().min(1, { message: 'Servis tipi gereklidir' }),
  externalProductId: z.string().optional(),
  externalServiceId: z.string().optional(),
  providerName: z.string().optional(),
  minQuantity: z.coerce.number().min(1, { message: 'Minimum miktar en az 1 olmalıdır' }),
  maxQuantity: z.coerce.number().min(1, { message: 'Maksimum miktar en az 1 olmalıdır' }),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().default(0),
  
  // SEO ayarları
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  semanticHeadings: z.string().optional(),
  lsiKeywords: z.string().optional(),
  faqQuestions: z.string().optional(),
  faqAnswers: z.string().optional(),
  semanticLinkText: z.string().optional(),
  semanticLinkUrls: z.string().optional(),
});

type DigitalProductFormValues = z.infer<typeof digitalProductSchema>;

const DigitalProducts: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const perPage = 10;

  const { toast } = useToast();

  // Fetch digital products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/admin/digital-products'],
  });

  // Fetch platforms for dropdown
  const { data: platforms = [] } = useQuery({
    queryKey: ['/api/platforms'],
  });

  // Fetch SMM providers
  const { data: smmProviders = [] } = useQuery({
    queryKey: ['/api/admin/smm-providers'],
  });

  // Filtered and paginated products
  const filteredProducts = products.filter((product: any) => 
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
    || product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    || (typeof product.category === 'string' 
        ? product.category.toLowerCase().includes(searchQuery.toLowerCase())
        : product.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * perPage,
    (currentPage - 1) * perPage + perPage
  );

  const totalPages = Math.ceil(filteredProducts.length / perPage);

  // Form setup for adding/editing digital product
  const form = useForm<DigitalProductFormValues>({
    resolver: zodResolver(digitalProductSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      platformId: 0,
      category: '',
      serviceType: 'instant',
      minQuantity: 1,
      maxQuantity: 1000,
      isActive: true,
      sortOrder: 0,
    },
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (values: DigitalProductFormValues) => {
      // Convert price from dollars to cents
      const valueInCents = { ...values, price: Math.round(values.price * 100) };
      return apiRequest('POST', '/api/admin/digital-products', valueInCents);
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Dijital ürün başarıyla eklendi',
      });
      setIsAddDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/digital-products'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: `Ürün eklenirken bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (values: DigitalProductFormValues & { id: number }) => {
      const { id, ...data } = values;
      // Convert price from dollars to cents
      const valueInCents = { ...data, price: Math.round(data.price * 100) };
      return apiRequest('PUT', `/api/admin/digital-products/${id}`, valueInCents);
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Dijital ürün başarıyla güncellendi',
      });
      setIsAddDialogOpen(false);
      setSelectedProduct(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/digital-products'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: `Ürün güncellenirken bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/digital-products/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Dijital ürün başarıyla silindi',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/digital-products'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: `Ürün silinirken bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: DigitalProductFormValues) => {
    if (selectedProduct) {
      updateProductMutation.mutate({ ...values, id: selectedProduct.id });
    } else {
      addProductMutation.mutate(values);
    }
  };

  // Generate SEO content based on platform and category
  const generateSeoContent = (product: any) => {
    const platformName = product.platform?.name || 'Platform';
    const categoryName = product.category?.name || product.category || 'Service';
    
    // Use lowercase for platforms and categories
    const platformLower = platformName.toLowerCase();
    const categoryLower = (typeof categoryName === 'string' ? categoryName : '').toLowerCase();
    
    // Basic templates for title and description
    let seoTitle = `Best ${platformName} ${getEnglishCategoryName(categoryLower)} Service | Safe and Fast Delivery`;
    let seoDescription = `Reliable and organic ${getEnglishCategoryName(categoryLower)} for your ${platformName} channel. Delivery within 24 hours, 100% safe. Increase your ${platformName} ${getEnglishCategoryName(categoryLower)} count with 30-day guarantee.`;
    
    // Platform and category specific keywords
    let seoKeywords = `${platformLower} ${getEnglishCategoryName(categoryLower).toLowerCase()}, ${platformLower} bot, increase ${getEnglishCategoryName(categoryLower).toLowerCase()}, grow ${platformLower} channel`;
    
    // Heading hierarchy
    let semanticHeadings = `H1: ${platformName} ${getEnglishCategoryName(categoryLower)} Service and Features
H2: Why Adding ${getEnglishCategoryName(categoryLower)} to Your ${platformName} Channel is Important
H2: Advantages of Our ${getEnglishCategoryName(categoryLower)} Service
H3: Safe and Continuous Delivery
H3: Organic-Looking ${getEnglishCategoryName(categoryLower)}`;
    
    // LSI keywords
    let lsiKeywords = `increase ${platformLower} ${getEnglishCategoryName(categoryLower).toLowerCase()} count, ${platformLower} live ${getEnglishCategoryName(categoryLower).toLowerCase()}, ${platformLower} stream ${getEnglishCategoryName(categoryLower).toLowerCase()} rate, ${platformLower} channel popularity, ${platformLower} discover, ${platformLower} streamer growth techniques`;
    
    // FAQ Questions
    let faqQuestions = `Is my ${platformName} channel safe with your ${getEnglishCategoryName(categoryLower)} service?
How long will the ${getEnglishCategoryName(categoryLower)} stay?
Why is the number of ${getEnglishCategoryName(categoryLower)} important?
How soon after payment will my order be delivered?
Is there any risk of my account getting banned during the service?
Will I get real users or bots?
Is there a guarantee period for my order?
What should I do if there's an issue with my order?
Are there any discounts for recurring orders?
Will my channel engagement increase after using this service?`;
    
    // FAQ Answers
    let faqAnswers = `Yes, our service is 100% secure and TOS compliant.
The ${getEnglishCategoryName(categoryLower)} are generally permanent with very rare drop-offs.
Higher ${getEnglishCategoryName(categoryLower).toLowerCase()} count increases your channel's visibility in discovery.
Your order is typically started within 0-1 hour after payment.
No, our methods do not compromise your account's security.
Our service consists of high-quality accounts that look organic.
Yes, all our orders come with a 30-day guarantee.
You can contact our 24/7 customer support.
Yes, we offer special discount packages for our regular customers.
Yes, higher ${getEnglishCategoryName(categoryLower).toLowerCase()} count attracts more organic engagement.`;

    // Semantic Link Text
    let semanticLinkText = `${platformName} ${getEnglishCategoryName(categoryLower)} packages
${platformName} ${categoryLower=='followers' ? 'Viewers' : 'Followers'} service
${platformName} streamer growth guide`;

    // Semantic Link URLs
    let semanticLinkUrls = `/shop/${platformLower}
/shop/${platformLower}/${categoryLower=='followers' ? 'viewers' : 'followers'}
/blog/streamer-guide`;
    
    return {
      seoTitle,
      seoDescription,
      seoKeywords,
      semanticHeadings,
      lsiKeywords,
      faqQuestions,
      faqAnswers,
      semanticLinkText,
      semanticLinkUrls
    };
  };
  
  // Convert category names to English display names
  const getEnglishCategoryName = (category: string) => {
    switch(category) {
      case 'followers': return 'Followers';
      case 'likes': return 'Likes';
      case 'views': return 'Viewers';
      case 'comments': return 'Comments';
      case 'subscribers': return 'Subscribers';
      default: return 'Service';
    }
  };

  // Open dialog for editing
  const handleEditProduct = (product: any) => {
    console.log("Editing product:", product);
    
    // Convert price from cents to dollars for display and ensure all fields are preserved
    const productForForm = {
      ...product,
      price: product.price / 100,
      platformId: product.platformId || (product.platform?.id || 0),
      category: product.category?.name || product.category || '',
      serviceType: product.service_type || product.serviceType || 'instant',
      minQuantity: product.min_order || product.minOrder || product.minQuantity || 1,
      maxQuantity: product.max_order || product.maxOrder || product.maxQuantity || 1000,
      isActive: product.is_active !== undefined ? product.is_active : (typeof product.isActive === 'boolean' ? product.isActive : true),
      sortOrder: product.sort_order || product.sortOrder || 0,
      
      // SMM Provider related fields
      providerName: product.provider_name || product.providerName || '',
      externalServiceId: product.external_service_id || product.externalServiceId || '',
      externalProductId: product.external_product_id || product.externalProductId || '',
    };
    
    // Generate SEO content
    const seoContent = generateSeoContent(product);
    
    // Add generated SEO content if fields are empty
    const enhancedProduct = {
      ...productForForm,
      seoTitle: product.seoTitle || seoContent.seoTitle,
      seoDescription: product.seoDescription || seoContent.seoDescription,
      seoKeywords: product.seoKeywords || seoContent.seoKeywords,
      semanticHeadings: product.semanticHeadings || seoContent.semanticHeadings,
      lsiKeywords: product.lsiKeywords || seoContent.lsiKeywords,
      faqQuestions: product.faqQuestions || seoContent.faqQuestions,
      faqAnswers: product.faqAnswers || seoContent.faqAnswers,
      semanticLinkText: product.semanticLinkText || seoContent.semanticLinkText,
      semanticLinkUrls: product.semanticLinkUrls || seoContent.semanticLinkUrls
    };
    
    console.log("Prepared form data:", enhancedProduct);
    
    setSelectedProduct(product);
    form.reset(enhancedProduct);
    setIsAddDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dijital Ürün Yönetimi</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedProduct(null);
                form.reset({
                  name: '',
                  description: '',
                  price: 0,
                  platformId: platforms[0]?.id || 0,
                  category: '',
                  serviceType: 'instant',
                  minQuantity: 1,
                  maxQuantity: 1000,
                  isActive: true,
                  sortOrder: 0,
                });
              }}>
                <Plus className="mr-2 h-4 w-4" /> Dijital Ürün Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedProduct ? 'Dijital Ürün Düzenle' : 'Yeni Dijital Ürün Ekle'}
                </DialogTitle>
                <DialogDescription>
                  Müşterilerinize satmak için dijital ürün bilgilerini girin
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="basic">Basic Information</TabsTrigger>
                      <TabsTrigger value="integration">Integration</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced</TabsTrigger>
                      <TabsTrigger value="seo">SEO Settings</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Instagram Followers Package" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Product description..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price ($)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="platformId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Platform</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value ? field.value.toString() : ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a platform" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {platforms.map((platform: any) => (
                                    <SelectItem key={platform.id} value={platform.id.toString()}>
                                      {platform.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="followers">Followers</SelectItem>
                                  <SelectItem value="likes">Likes</SelectItem>
                                  <SelectItem value="views">Views</SelectItem>
                                  <SelectItem value="comments">Comments</SelectItem>
                                  <SelectItem value="subscribers">Subscribers</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="serviceType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select service type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="instant">Instant</SelectItem>
                                  <SelectItem value="gradual">Gradual</SelectItem>
                                  <SelectItem value="drip">Drip-feed</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="integration" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="providerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMM Provider</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select provider (optional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="manual-no-api">Manual (No API)</SelectItem>
                                {smmProviders.map((provider: any) => (
                                  <SelectItem key={provider.id} value={provider.name}>
                                    {provider.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="externalServiceId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>External Service ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Service ID in SMM panel" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormDescription>
                              The service ID from your SMM provider's panel
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="externalProductId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>External Product ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Product ID in SMM panel" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormDescription>
                              The product ID from your SMM provider's panel
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="advanced" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="minQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum Quantity</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" {...field} value={field.value || "1"} />
                              </FormControl>
                              <FormDescription>
                                The minimum quantity a customer can order
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="maxQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maximum Quantity</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" {...field} value={field.value || "1000"} />
                              </FormControl>
                              <FormDescription>
                                The maximum quantity a customer can order
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="sortOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sort Order</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} value={field.value || "0"} />
                            </FormControl>
                            <FormDescription>
                              Products with lower numbers will appear first
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Active Status</FormLabel>
                              <FormDescription>
                                Show this product to customers
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="seo" className="space-y-4">
                      <div className="rounded-lg border p-4 mb-4">
                        <h3 className="text-lg font-medium mb-2">Semantic Content Optimization</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Google uses semantic relationships to understand user intent. The fields below
                          will help you rank better in search engine results.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="seoTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SEO Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Best Twitch Viewer Bots | Safe and Fast Delivery" {...field} />
                              </FormControl>
                              <FormDescription>
                                Title displayed in search results (50-60 characters ideal)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="seoDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Reliable and organic viewer bots for your Twitch channel. Delivery within 24 hours, 100% safe. Increase your Twitch viewers with 30-day guarantee." 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Description displayed in search results (150-160 characters ideal)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="seoKeywords"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Keywords</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="twitch viewer, twitch bot, viewer increase, grow twitch channel" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Comma-separated keywords
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="semanticHeadings"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Heading Hierarchy</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="H1: Twitch Viewer Service and Features 
H2: Why Adding Viewers to Your Twitch Channel is Important
H2: Advantages of Our Viewer Service
H3: Safe and Uninterrupted Delivery
H3: Organic-Looking Viewers" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Heading structure to be used in product content (H1, H2, H3)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="lsiKeywords"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LSI Keywords</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Twitch viewer count increase, Twitch live stream viewers, broadcast viewing rate, Twitch channel popularity, Twitch discover, Twitch streamer growth techniques" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Latent Semantic Indexing keywords for improved search ranking
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="faqQuestions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>FAQ Questions</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Is my Twitch channel safe with viewer bots?
How long do viewers stay?
Why is viewer count important?
How soon after payment is delivery made?" 
                                    {...field} 
                                    className="min-h-[120px]"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Add one question per line (10+ ideal)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="faqAnswers"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>FAQ Answers</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Yes, our service is 100% safe and compliant with TOS.
Viewers typically stay for 30-60 minutes per session.
Higher viewer count increases your channel visibility in Discover.
Most orders start processing within 0-1 hour after payment." 
                                    {...field} 
                                    className="min-h-[120px]"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Answers corresponding to questions (in the same order)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="semanticLinkText"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Semantic Link Text</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Twitch viewer packages
Twitch follower service
Twitch streamer growth guide" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Add one link text per line
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="semanticLinkUrls"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Semantic Link URLs</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="/shop/twitch
/shop/twitch/followers
/blog/streamer-guide" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  URLs corresponding to link text (in the same order)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={addProductMutation.isPending || updateProductMutation.isPending}>
                      {addProductMutation.isPending || updateProductMutation.isPending ? (
                        <div className="flex items-center">
                          <span className="animate-spin mr-2">⟳</span> İşleniyor...
                        </div>
                      ) : selectedProduct ? (
                        'Güncelle'
                      ) : (
                        'Ekle'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Dijital Ürünler</CardTitle>
                <CardDescription>
                  Tüm dijital ürünlerinizi buradan yönetin
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Ürün ara..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingProducts ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin text-3xl">⟳</div>
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Henüz hiç ürün bulunmuyor veya arama kriterlerine uygun ürün yok.</p>
                <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                  İlk Ürünü Ekle
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Ürün Adı</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Fiyat</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((product: any) => {
                      // Find platform name
                      const platform = platforms.find((p: any) => p.id === product.platformId);
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell>{product.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                {product.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{product.platform?.name || 'Bilinmiyor'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category?.name || product.category}</Badge>
                          </TableCell>
                          <TableCell>₺{(product.price / 100).toFixed(2)}</TableCell>
                          <TableCell>
                            {product.isActive ? (
                              <Badge className="bg-green-500">Aktif</Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">Pasif</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
                                    deleteProductMutation.mutate(product.id);
                                  }
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => setCurrentPage(i + 1)}
                            isActive={currentPage === i + 1}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default DigitalProducts;