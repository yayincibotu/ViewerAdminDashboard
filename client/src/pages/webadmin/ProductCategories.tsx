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
import { AlertCircle, Pencil, Plus, Trash } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

// Form schema for product categories
const categorySchema = z.object({
  name: z.string().min(1, { message: 'Kategori adı gereklidir' }),
  slug: z.string().min(1, { message: 'Slug değeri gereklidir' }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const ProductCategories: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const { toast } = useToast();

  // Mock categories for now - these would be fetched from your API
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/product-categories'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/product-categories');
        return response.json();
      } catch (error) {
        // If API doesn't exist yet, return hardcoded categories
        return [
          { id: 1, name: "Takipçiler", slug: "followers", description: "Sosyal medya takipçi servisleri", isActive: true },
          { id: 2, name: "Beğeniler", slug: "likes", description: "Sosyal medya beğeni servisleri", isActive: true },
          { id: 3, name: "İzlenmeler", slug: "views", description: "Video izlenme servisleri", isActive: true },
          { id: 4, name: "Yorumlar", slug: "comments", description: "Yorum servisleri", isActive: true },
          { id: 5, name: "Aboneler", slug: "subscribers", description: "Abone servisleri", isActive: true },
        ];
      }
    }
  });

  // Form setup for adding/editing category
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      isActive: true,
    },
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      try {
        return apiRequest('POST', '/api/product-categories', values);
      } catch (error) {
        throw new Error("API endpoint for product categories doesn't exist yet");
      }
    },
    onSuccess: () => {
      toast({
        title: 'Kategori Eklendi',
        description: 'Kategori başarıyla eklendi',
      });
      setIsAddDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/product-categories'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata!',
        description: `Kategori eklenirken bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (values: CategoryFormValues & { id: number }) => {
      try {
        const { id, ...rest } = values;
        return apiRequest('PATCH', `/api/product-categories/${id}`, rest);
      } catch (error) {
        throw new Error("API endpoint for product categories doesn't exist yet");
      }
    },
    onSuccess: () => {
      toast({
        title: 'Kategori Güncellendi',
        description: 'Kategori başarıyla güncellendi',
      });
      setIsAddDialogOpen(false);
      setSelectedCategory(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/product-categories'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata!',
        description: `Kategori güncellenirken bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        return apiRequest('DELETE', `/api/product-categories/${id}`);
      } catch (error) {
        throw new Error("API endpoint for product categories doesn't exist yet");
      }
    },
    onSuccess: () => {
      toast({
        title: 'Kategori Silindi',
        description: 'Kategori başarıyla silindi',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/product-categories'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata!',
        description: `Kategori silinirken bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: CategoryFormValues) => {
    if (selectedCategory) {
      updateCategoryMutation.mutate({ ...values, id: selectedCategory.id });
    } else {
      addCategoryMutation.mutate(values);
    }
  };

  // Open dialog for editing
  const handleEditCategory = (category: any) => {
    setSelectedCategory(category);
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      isActive: category.isActive,
    });
    setIsAddDialogOpen(true);
  };

  // Handle deleting a category
  const handleDeleteCategory = (id: number) => {
    if (window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Ürün Kategorileri</h1>
          <Button onClick={() => {
            setSelectedCategory(null);
            form.reset({
              name: '',
              slug: '',
              description: '',
              isActive: true,
            });
            setIsAddDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" /> Kategori Ekle
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedCategory ? 'Kategoriyi Düzenle' : 'Kategori Ekle'}</DialogTitle>
                <DialogDescription>
                  {selectedCategory 
                    ? 'Mevcut kategoriyi güncelleyin' 
                    : 'Dijital ürünler için yeni bir kategori ekleyin'}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori Adı</FormLabel>
                        <FormControl>
                          <Input placeholder="Takipçiler, Beğeniler, İzlenmeler vb." {...field} />
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
                          <Input placeholder="followers, likes, views vb." {...field} />
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
                          <Textarea placeholder="Kategori hakkında kısa bir açıklama" {...field} />
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
                            Bu kategoriyi site üzerinde aktif/pasif yapın
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
                    <Button type="submit" disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending}>
                      {addCategoryMutation.isPending || updateCategoryMutation.isPending ? (
                        <div className="flex items-center">
                          <span className="animate-spin mr-2">⟳</span> İşleniyor...
                        </div>
                      ) : selectedCategory ? (
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
            <CardTitle>Kategori Listesi</CardTitle>
            <CardDescription>
              Dijital ürün kategorilerini buradan yönetin
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCategories ? (
              <div className="animate-in fade-in-50 duration-300">
                <TableSkeleton columns={5} rows={3} />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Henüz hiç kategori bulunmuyor.</p>
                <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                  İlk Kategoriyi Ekle
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Kategori Adı</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category: any) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.id}</TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div>{category.name}</div>
                          {category.description && (
                            <div className="text-xs text-gray-500 truncate max-w-[300px]">
                              {category.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{category.slug}</TableCell>
                      <TableCell>
                        {category.isActive ? (
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
                            onClick={() => handleEditCategory(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteCategory(category.id)}
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

export default ProductCategories;