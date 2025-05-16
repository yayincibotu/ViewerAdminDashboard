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
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
    || product.description.toLowerCase().includes(searchQuery.toLowerCase())
    || product.category.toLowerCase().includes(searchQuery.toLowerCase())
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

  // Open dialog for editing
  const handleEditProduct = (product: any) => {
    // Convert price from cents to dollars for display
    const productForForm = {
      ...product,
      price: product.price / 100,
    };
    
    setSelectedProduct(product);
    form.reset(productForForm);
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
            <DialogContent className="sm:max-w-[550px]">
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
                      <TabsTrigger value="basic">Temel Bilgiler</TabsTrigger>
                      <TabsTrigger value="integration">Entegrasyon</TabsTrigger>
                      <TabsTrigger value="advanced">Gelişmiş</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ürün Adı</FormLabel>
                            <FormControl>
                              <Input placeholder="Instagram Takipçi Paketi" {...field} />
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
                            <FormLabel>Açıklama</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Ürün açıklaması..." {...field} />
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
                              <FormLabel>Fiyat (₺)</FormLabel>
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
                                defaultValue={field.value.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Platform seçin" />
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
                              <FormLabel>Kategori</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Kategori seçin" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="followers">Takipçiler</SelectItem>
                                  <SelectItem value="likes">Beğeniler</SelectItem>
                                  <SelectItem value="views">İzlenmeler</SelectItem>
                                  <SelectItem value="comments">Yorumlar</SelectItem>
                                  <SelectItem value="subscribers">Aboneler</SelectItem>
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
                              <FormLabel>Servis Tipi</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Servis tipi seçin" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="instant">Anlık</SelectItem>
                                  <SelectItem value="gradual">Kademeli</SelectItem>
                                  <SelectItem value="drip">Damla</SelectItem>
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
                            <FormLabel>SMM Sağlayıcı</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sağlayıcı seçin (isteğe bağlı)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Manuel (API yok)</SelectItem>
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
                            <FormLabel>Harici Servis ID</FormLabel>
                            <FormControl>
                              <Input placeholder="SMM paneldeki servis ID" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="externalProductId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Harici Ürün ID</FormLabel>
                            <FormControl>
                              <Input placeholder="SMM paneldeki ürün ID" {...field} value={field.value || ""} />
                            </FormControl>
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
                              <FormLabel>Minimum Miktar</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="maxQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maksimum Miktar</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" {...field} />
                              </FormControl>
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
                            <FormLabel>Sıralama</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
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
                              <FormLabel className="text-base">Aktif</FormLabel>
                              <FormDescription>
                                Bu ürünü müşterilere göster
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
                          <TableCell>{platform?.name || 'Bilinmiyor'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
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