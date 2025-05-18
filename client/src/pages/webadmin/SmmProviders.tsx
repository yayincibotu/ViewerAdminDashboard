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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Pencil, Plus, RefreshCcw, Trash, Download, Filter, Check, List } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Form schema for SMM providers
const smmProviderSchema = z.object({
  name: z.string().min(1, { message: 'Sağlayıcı adı gereklidir' }),
  apiUrl: z.string().min(1, { message: 'API URL gereklidir' }),
  apiKey: z.string().min(1, { message: 'API anahtarı gereklidir' }),
  isActive: z.boolean().default(true),
});

type SmmProviderFormValues = z.infer<typeof smmProviderSchema>;

const SmmProviders: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isServicesDialogOpen, setIsServicesDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [servicesList, setServicesList] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [platformMapping, setPlatformMapping] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);

  const { toast } = useToast();

  // Fetch SMM providers
  const { data: providers = [], isLoading: isLoadingProviders } = useQuery({
    queryKey: ['/api/admin/smm-providers'],
  });

  // Form setup for adding/editing SMM provider
  const form = useForm<SmmProviderFormValues>({
    resolver: zodResolver(smmProviderSchema),
    defaultValues: {
      name: '',
      apiUrl: '',
      apiKey: '',
      isActive: true,
    },
  });

  // Add provider mutation
  const addProviderMutation = useMutation({
    mutationFn: async (values: SmmProviderFormValues) => {
      return apiRequest('POST', '/api/admin/smm-providers', values);
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'SMM sağlayıcı başarıyla eklendi',
      });
      setIsAddDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/smm-providers'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: `Sağlayıcı eklenirken bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update provider mutation
  const updateProviderMutation = useMutation({
    mutationFn: async (values: SmmProviderFormValues & { id: number }) => {
      const { id, ...data } = values;
      return apiRequest('PUT', `/api/admin/smm-providers/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'SMM sağlayıcı başarıyla güncellendi',
      });
      setIsAddDialogOpen(false);
      setSelectedProvider(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/smm-providers'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: `Sağlayıcı güncellenirken bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete provider mutation
  const deleteProviderMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/smm-providers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'SMM sağlayıcı başarıyla silindi',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/smm-providers'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: `Sağlayıcı silinirken bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (values: SmmProviderFormValues) => {
      // Check if we should use test mode
      const useMockData = values.apiUrl.includes('testing') || values.apiKey.includes('test');
      return apiRequest('POST', `/api/admin/smm-providers/test-connection?mock=${useMockData}`, values);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setTestResults({ success: true, data });
      setIsTestingConnection(false);
      toast({
        title: 'Bağlantı Başarılı',
        description: 'API bağlantısı başarıyla test edildi',
      });
    },
    onError: (error: any) => {
      setTestResults({ success: false, error: error.message });
      setIsTestingConnection(false);
      toast({
        title: 'Bağlantı Hatası',
        description: `API bağlantısı test edilirken hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Get services list mutation
  const getServicesMutation = useMutation({
    mutationFn: async ({ providerId, useMockData }: { providerId: number, useMockData?: boolean }) => {
      return apiRequest('GET', `/api/admin/smm-providers/${providerId}/services?mock=${useMockData ? 'true' : 'false'}`);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setServicesList(data);
      
      // Extract unique categories for filtering
      if (data && data.services) {
        const categories = Object.keys(data.services).sort();
        setUniqueCategories(categories);
        
        // Set default category if available
        if (categories.length > 0) {
          setSelectedCategory(categories[0]);
        }
      }
      
      setIsServicesDialogOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: 'Servis Listesi Alınamadı',
        description: `Servisler alınırken bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Import selected services mutation
  const importServicesMutation = useMutation({
    mutationFn: async ({ 
      providerId, 
      serviceIds, 
      platformFilter,
      useMockData 
    }: { 
      providerId: number, 
      serviceIds: string[], 
      platformFilter?: Record<string, number>,
      useMockData?: boolean 
    }) => {
      return apiRequest('POST', `/api/admin/smm-providers/${providerId}/import-services`, {
        serviceIds,
        platformFilter,
        useMockData
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: 'Servisler İçe Aktarıldı',
        description: `${data.importedCount} servis başarıyla içe aktarıldı`,
      });
      setIsServicesDialogOpen(false);
      setServicesList(null);
      setSelectedServices([]);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/digital-products'] });
    },
    onError: (error: any) => {
      toast({
        title: 'İçe Aktarma Hatası',
        description: `Servisler içe aktarılırken bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: SmmProviderFormValues) => {
    if (selectedProvider) {
      updateProviderMutation.mutate({ ...values, id: selectedProvider.id });
    } else {
      addProviderMutation.mutate(values);
    }
  };

  // Open dialog for editing
  const handleEditProvider = (provider: any) => {
    setSelectedProvider(provider);
    form.reset(provider);
    setIsAddDialogOpen(true);
  };

  // Handle deleting a provider
  const handleDeleteProvider = (id: number) => {
    if (window.confirm('Bu sağlayıcıyı silmek istediğinizden emin misiniz?')) {
      deleteProviderMutation.mutate(id);
    }
  };

  // Handle view services
  const handleViewServices = (provider: any) => {
    setSelectedProvider(provider);
    getServicesMutation.mutate({ 
      providerId: provider.id, 
      useMockData: provider.apiUrl.includes('testing') || provider.apiKey.includes('test')
    });
  };
  
  // Handle import selected services
  const handleImportSelectedServices = () => {
    if (!selectedProvider || selectedServices.length === 0) {
      toast({
        title: 'Seçim Yapılmadı',
        description: 'İçe aktarmak için en az bir servis seçmelisiniz',
        variant: 'destructive',
      });
      return;
    }
    
    importServicesMutation.mutate({
      providerId: selectedProvider.id,
      serviceIds: selectedServices,
      platformFilter: platformMapping,
      useMockData: selectedProvider.apiUrl.includes('testing') || selectedProvider.apiKey.includes('test')
    });
  };
  
  // Handle service selection
  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };
  
  // Handle platform mapping
  const handlePlatformChange = (serviceId: string, platformId: string) => {
    setPlatformMapping(prev => ({
      ...prev,
      [serviceId]: parseInt(platformId)
    }));
  };

  // Test API connection
  const handleTestConnection = () => {
    const formValues = form.getValues();
    if (!formValues.apiUrl || !formValues.apiKey) {
      toast({
        title: 'Eksik Bilgi',
        description: 'Test etmek için API URL ve API anahtarı girilmelidir',
        variant: 'destructive',
      });
      return;
    }
    
    setIsTestingConnection(true);
    setTestResults(null);
    testConnectionMutation.mutate(formValues);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">SMM Sağlayıcı Yönetimi</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedProvider(null);
                form.reset({
                  name: '',
                  apiUrl: '',
                  apiKey: '',
                  isActive: true,
                });
                setTestResults(null);
              }}>
                <Plus className="mr-2 h-4 w-4" /> SMM Sağlayıcı Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedProvider ? 'SMM Sağlayıcı Düzenle' : 'Yeni SMM Sağlayıcı Ekle'}
                </DialogTitle>
                <DialogDescription>
                  Dijital içerik sağlamak için SMM API bağlantı bilgilerini girin
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sağlayıcı Adı</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Örn: HepsiSosyal" />
                        </FormControl>
                        <FormDescription>
                          Sağlayıcının tanımlayıcı adı
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="apiUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/api" />
                        </FormControl>
                        <FormDescription>
                          SMM panel API endpoint URL'si (İpucu: Test için 'testing' içeren bir URL kullanabilirsiniz)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Anahtarı</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="API Key" />
                        </FormControl>
                        <FormDescription>
                          SMM panel API erişim anahtarı (İpucu: Test için 'test' içeren bir anahtar kullanabilirsiniz)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Aktif</FormLabel>
                          <FormDescription>
                            Sağlayıcı aktif olarak kullanılsın mı?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className="w-full"
                  >
                    {isTestingConnection ? (
                      <div className="flex items-center">
                        <span className="animate-spin mr-2">⟳</span> Bağlantı Test Ediliyor...
                      </div>
                    ) : (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Bağlantıyı Test Et
                      </>
                    )}
                  </Button>
                  
                  {testResults && (
                    <div className="mt-4">
                      {testResults.success ? (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertTitle className="text-green-800">Bağlantı Başarılı</AlertTitle>
                          <AlertDescription className="text-green-700">
                            API bağlantısı başarıyla test edildi. Servisler alındı.
                          </AlertDescription>
                          <ScrollArea className="h-32 mt-2 border rounded p-2 bg-white">
                            <pre className="text-xs">{JSON.stringify(testResults.data, null, 2)}</pre>
                          </ScrollArea>
                        </Alert>
                      ) : (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Bağlantı Hatası</AlertTitle>
                          <AlertDescription>
                            {testResults.error}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                  
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="submit" disabled={addProviderMutation.isPending || updateProviderMutation.isPending}>
                      {addProviderMutation.isPending || updateProviderMutation.isPending ? (
                        <div className="flex items-center">
                          <span className="animate-spin mr-2">⟳</span> Kaydediliyor...
                        </div>
                      ) : (
                        'Kaydet'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>SMM Sağlayıcılar</CardTitle>
            <CardDescription>
              Tüm SMM sağlayıcılarınızı yönetin
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProviders ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Henüz bir SMM sağlayıcı eklenmemiş</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Sağlayıcı Adı</TableHead>
                    <TableHead>API URL</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider: any) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.id}</TableCell>
                      <TableCell>{provider.name}</TableCell>
                      <TableCell className="truncate max-w-[200px]">{provider.apiUrl}</TableCell>
                      <TableCell>
                        {provider.isActive ? (
                          <Badge>Aktif</Badge>
                        ) : (
                          <Badge variant="secondary">Pasif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProvider(provider)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => handleViewServices(provider)}
                          >
                            <List className="h-4 w-4 mr-1" /> Servisleri Görüntüle
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteProvider(provider.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Servis Seçme ve İçe Aktarma Dialog'u */}
        <Dialog open={isServicesDialogOpen} onOpenChange={setIsServicesDialogOpen}>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>SMM Servisleri - {selectedProvider?.name}</DialogTitle>
              <DialogDescription>
                İçe aktarmak istediğiniz servisleri seçin ve servisleri platform ile eşleştirin.
              </DialogDescription>
            </DialogHeader>
            
            {servicesList && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Toplam {Object.values(servicesList.services).flat().length} servis bulundu</span>
                    {selectedServices.length > 0 && (
                      <Badge variant="outline">{selectedServices.length} servis seçildi</Badge>
                    )}
                  </div>
                  
                  <Button 
                    disabled={selectedServices.length === 0} 
                    onClick={handleImportSelectedServices}
                  >
                    <Download className="h-4 w-4 mr-2" /> Seçilen Servisleri İçe Aktar
                  </Button>
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Servis Arama ve Filtreleme Alanı */}
                  <div className="p-4 bg-muted/30 rounded-md mb-4">
                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="flex-1">
                        <div className="mb-1 text-sm font-medium">Servis Ara</div>
                        <div className="relative">
                          <Input
                            placeholder="Servis adı veya ID'ye göre ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                          />
                          <div className="absolute left-2 top-2.5 text-muted-foreground">
                            <Filter className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="mb-1 text-sm font-medium">Kategori</div>
                        <Select 
                          value={selectedCategory} 
                          onValueChange={setSelectedCategory}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Kategori seçin" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <div className="px-2 py-1.5">
                              <Input
                                placeholder="Kategori ara..."
                                className="mb-2"
                                onChange={(e) => {
                                  // Filter categories on input
                                  const searchValue = e.target.value.toLowerCase();
                                  const filteredCategories = uniqueCategories
                                    .filter(cat => cat.toLowerCase().includes(searchValue));
                                }}
                              />
                            </div>
                            {uniqueCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category} ({servicesList.services[category].length})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button 
                          variant="outline" 
                          className="flex items-center gap-2"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory(uniqueCategories[0] || '');
                          }}
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Sıfırla
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-1">
                      {uniqueCategories.slice(0, 8).map((category) => (
                        <Badge 
                          key={category}
                          variant={selectedCategory === category ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category} ({servicesList.services[category].length})
                        </Badge>
                      ))}
                      {uniqueCategories.length > 8 && (
                        <Badge variant="outline">
                          +{uniqueCategories.length - 8} kategori daha
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Servis Tablosu */}
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-[calc(80vh-320px)]">
                      <Table className="border">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">Seç</TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>Servis Adı</TableHead>
                            <TableHead>Fiyat</TableHead>
                            <TableHead>Min-Max</TableHead>
                            <TableHead className="w-[200px]">Platform</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedCategory && servicesList.services[selectedCategory]
                            .filter((service: any) => {
                              if (!searchTerm) return true;
                              const term = searchTerm.toLowerCase();
                              return (
                                service.name.toLowerCase().includes(term) ||
                                service.id.toString().includes(term)
                              );
                            })
                            .map((service: any) => (
                              <TableRow key={service.id}>
                                <TableCell>
                                  <Checkbox 
                                    checked={selectedServices.includes(service.id.toString())}
                                    onCheckedChange={() => toggleServiceSelection(service.id.toString())}
                                  />
                                </TableCell>
                                <TableCell>{service.id}</TableCell>
                                <TableCell>{service.name}</TableCell>
                                <TableCell>{service.rate} ₺</TableCell>
                                <TableCell>{service.min} - {service.max}</TableCell>
                                <TableCell>
                                  <Select 
                                    value={platformMapping[service.id]?.toString() || "platform-placeholder"}
                                    onValueChange={(value) => handlePlatformChange(service.id.toString(), value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Platform seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="platform-placeholder">Platform seçin</SelectItem>
                                      {servicesList.platforms.map((platform: any) => (
                                        <SelectItem key={platform.id} value={platform.id.toString()}>
                                          {platform.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            )}
            
            {!servicesList && (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsServicesDialogOpen(false);
                setServicesList(null);
                setSelectedServices([]);
                setPlatformMapping({});
              }}>
                Kapat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default SmmProviders;