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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Pencil, Plus, Trash } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

// Form schema for platforms
const platformSchema = z.object({
  name: z.string().min(1, { message: 'Platform adı gereklidir' }),
  slug: z.string().min(1, { message: 'Slug değeri gereklidir' }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type PlatformFormValues = z.infer<typeof platformSchema>;

const Platforms: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
  const { toast } = useToast();

  // Fetch platforms
  const { data: platforms = [], isLoading: isLoadingPlatforms } = useQuery({
    queryKey: ['/api/platforms'],
  });

  // Form setup for adding/editing platform
  const form = useForm<PlatformFormValues>({
    resolver: zodResolver(platformSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      isActive: true,
    },
  });

  // Add platform mutation
  const addPlatformMutation = useMutation({
    mutationFn: async (values: PlatformFormValues) => {
      return apiRequest('POST', '/api/platforms', values);
    },
    onSuccess: () => {
      toast({
        title: 'Platform Eklendi',
        description: 'Platform başarıyla eklendi',
      });
      setIsAddDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/platforms'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata!',
        description: `Platform eklenirken bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update platform mutation
  const updatePlatformMutation = useMutation({
    mutationFn: async (values: PlatformFormValues & { id: number }) => {
      const { id, ...rest } = values;
      return apiRequest('PATCH', `/api/platforms/${id}`, rest);
    },
    onSuccess: () => {
      toast({
        title: 'Platform Güncellendi',
        description: 'Platform başarıyla güncellendi',
      });
      setIsAddDialogOpen(false);
      setSelectedPlatform(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/platforms'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata!',
        description: `Platform güncellenirken bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete platform mutation
  const deletePlatformMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/platforms/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Platform Silindi',
        description: 'Platform başarıyla silindi',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/platforms'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata!',
        description: `Platform silinirken bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: PlatformFormValues) => {
    if (selectedPlatform) {
      updatePlatformMutation.mutate({ ...values, id: selectedPlatform.id });
    } else {
      addPlatformMutation.mutate(values);
    }
  };

  // Open dialog for editing
  const handleEditPlatform = (platform: any) => {
    setSelectedPlatform(platform);
    form.reset({
      name: platform.name,
      slug: platform.slug,
      description: platform.description || '',
      isActive: platform.isActive,
    });
    setIsAddDialogOpen(true);
  };

  // Handle deleting a platform
  const handleDeletePlatform = (id: number) => {
    if (window.confirm('Bu platformu silmek istediğinizden emin misiniz?')) {
      deletePlatformMutation.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Platformlar</h1>
          <Button onClick={() => {
            setSelectedPlatform(null);
            form.reset({
              name: '',
              slug: '',
              description: '',
              isActive: true,
            });
            setIsAddDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" /> Platform Ekle
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedPlatform ? 'Platformu Düzenle' : 'Platform Ekle'}</DialogTitle>
                <DialogDescription>
                  {selectedPlatform 
                    ? 'Mevcut platformu güncelleyin' 
                    : 'Dijital ürünlerin çalışacağı yeni bir platform ekleyin'}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform Adı</FormLabel>
                        <FormControl>
                          <Input placeholder="Twitch, YouTube, Instagram vs." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="twitch, youtube, instagram" {...field} />
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
                          <Textarea placeholder="Platform hakkında kısa bir açıklama" {...field} />
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
                          <p className="text-sm text-gray-500">
                            Bu platformu site üzerinde aktif/pasif yapın
                          </p>
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

                  <DialogFooter>
                    <Button type="submit" disabled={addPlatformMutation.isPending || updatePlatformMutation.isPending}>
                      {addPlatformMutation.isPending || updatePlatformMutation.isPending ? (
                        <div className="flex items-center">
                          <span className="animate-spin mr-2">⟳</span> İşleniyor...
                        </div>
                      ) : selectedPlatform ? (
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
            <CardTitle>Platform Listesi</CardTitle>
            <CardDescription>
              Tüm platformları buradan yönetin
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPlatforms ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin text-3xl">⟳</div>
              </div>
            ) : platforms.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Henüz hiç platform bulunmuyor.</p>
                <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                  İlk Platformu Ekle
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Platform Adı</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platforms.map((platform: any) => (
                    <TableRow key={platform.id}>
                      <TableCell>{platform.id}</TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div>{platform.name}</div>
                          {platform.description && (
                            <div className="text-xs text-gray-500 truncate max-w-[300px]">
                              {platform.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{platform.slug}</TableCell>
                      <TableCell>
                        {platform.isActive ? (
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
                            onClick={() => handleEditPlatform(platform)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePlatform(platform.id)}
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

export default Platforms;