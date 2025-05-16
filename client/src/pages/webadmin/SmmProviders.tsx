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
import { AlertCircle, CheckCircle, Pencil, Plus, RefreshCcw, Trash } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Form schema for SMM providers
const smmProviderSchema = z.object({
  name: z.string().min(1, { message: 'Sağlayıcı adı gereklidir' }),
  apiUrl: z.string().url({ message: 'Geçerli bir API URL'si giriniz' }),
  apiKey: z.string().min(1, { message: 'API Anahtarı gereklidir' }),
  isActive: z.boolean().default(true),
});

type SmmProviderFormValues = z.infer<typeof smmProviderSchema>;

const SmmProviders: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

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
      return apiRequest('POST', '/api/admin/smm-providers/test-connection', values);
    },
    onSuccess: (data) => {
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

  // Import services mutation
  const importServicesMutation = useMutation({
    mutationFn: async (providerId: number) => {
      return apiRequest('POST', `/api/admin/smm-providers/${providerId}/import-services`);
    },
    onSuccess: (data) => {
      toast({
        title: 'Servisler İçe Aktarıldı',
        description: `${data.importedCount} servis başarıyla içe aktarıldı`,
      });
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
                          <Input placeholder="JustAnotherPanel" {...field} />
                        </FormControl>
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
                          <Input placeholder="https://api.example.com/v1" {...field} />
                        </FormControl>
                        <FormDescription>
                          API sağlayıcınızın belirttiği tam URL'yi girin
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
                          <Input placeholder="API anahtarınız" type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          API sağlayıcınızdan aldığınız gizli anahtarı girin
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
                          <FormLabel className="text-base">Aktif</FormLabel>
                          <FormDescription>
                            Bu API bağlantısını kullan
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
                          <span className="animate-spin mr-2">⟳</span> İşleniyor...
                        </div>
                      ) : selectedProvider ? (
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
          <CardHeader>
            <CardTitle>SMM Sağlayıcılar</CardTitle>
            <CardDescription>
              Dijital ürün içe aktarma ve otomatik sipariş işleme için API bağlantılarını yönetin
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProviders ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin text-3xl">⟳</div>
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Henüz hiç SMM sağlayıcı bulunmuyor.</p>
                <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                  İlk Sağlayıcıyı Ekle
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Sağlayıcı Adı</TableHead>
                    <TableHead>API URL</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider: any) => (
                    <TableRow key={provider.id}>
                      <TableCell>{provider.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{provider.name}</div>
                        <div className="text-xs text-gray-500">{new Date(provider.createdAt).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{provider.apiUrl}</code>
                      </TableCell>
                      <TableCell>
                        {provider.isActive ? (
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
                            onClick={() => handleEditProvider(provider)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => importServicesMutation.mutate(provider.id)}
                            disabled={importServicesMutation.isPending}
                          >
                            <RefreshCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm('Bu sağlayıcıyı silmek istediğinizden emin misiniz?')) {
                                deleteProviderMutation.mutate(provider.id);
                              }
                            }}
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
      </div>
    </AdminLayout>
  );
};

export default SmmProviders;