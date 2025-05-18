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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star, Search, Edit, Trash2, CheckCircle, XCircle, AlertTriangle, Filter } from 'lucide-react';

type Review = {
  id: number;
  product_id: number;
  user_id: number | null;
  username: string | null;
  rating: number;
  title: string;
  content: string;
  pros: string[] | null;
  cons: string[] | null;
  verified_purchase: boolean;
  helpful_count: number;
  not_helpful_count: number;
  platform: string | null;
  device_type: string | null;
  country_code: string | null;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
  product?: {
    id: number;
    name: string;
  };
};

export default function CommentManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);

  // Fetch all reviews with their product information
  const { data: reviews, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/reviews'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/reviews');
      if (!response.ok) {
        throw new Error('Yorumlar yüklenirken bir hata oluştu');
      }
      return response.json();
    }
  });

  // Update a review
  const updateReviewMutation = useMutation({
    mutationFn: async (reviewData: Partial<Review> & { id: number }) => {
      const response = await apiRequest('PATCH', `/api/admin/reviews/${reviewData.id}`, reviewData);
      if (!response.ok) {
        throw new Error('Yorum güncellenirken bir hata oluştu');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Yorum güncellendi",
        description: "Yorum başarıyla güncellendi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Yorum güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete a review
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/reviews/${reviewId}`);
      if (!response.ok) {
        throw new Error('Yorum silinirken bir hata oluştu');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      setIsDeleteDialogOpen(false);
      setDeletingReviewId(null);
      toast({
        title: "Yorum silindi",
        description: "Yorum başarıyla silindi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Yorum silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Change review status (approve/reject)
  const changeReviewStatusMutation = useMutation({
    mutationFn: async ({ reviewId, status }: { reviewId: number, status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/reviews/${reviewId}`, { status });
      if (!response.ok) {
        throw new Error(`${status === 'published' ? 'Onaylama' : 'Reddetme'} işlemi sırasında bir hata oluştu`);
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      toast({
        title: variables.status === 'published' ? "Yorum onaylandı" : "Yorum reddedildi",
        description: variables.status === 'published' 
          ? "Yorum başarıyla onaylandı ve yayında." 
          : "Yorum reddedildi.",
      });
    },
    onError: (error, variables) => {
      toast({
        title: "Hata",
        description: `Yorum ${variables.status === 'published' ? 'onaylanırken' : 'reddedilirken'} bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Filter reviews based on search term and filters
  const filteredReviews = reviews
    ? reviews.filter((review: Review) => {
        // Filter by search term (in title, content, or username)
        const matchesSearch = 
          searchTerm === "" || 
          review.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          review.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (review.username && review.username.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Filter by tab (all, pending, published, rejected)
        const matchesTab = 
          activeTab === "all" || 
          (activeTab === "pending" && review.status === "pending") ||
          (activeTab === "published" && review.status === "published") ||
          (activeTab === "rejected" && review.status === "rejected");
        
        // Filter by rating
        const matchesRating = filterRating === "all" || (review.rating && review.rating.toString() === filterRating);
        
        // Filter by source
        const matchesSource = filterSource === "all" || review.source === filterSource;
        
        // Filter by status
        const matchesStatus = filterStatus === "all" || review.status === filterStatus;
        
        return matchesSearch && matchesTab && matchesRating && matchesSource && matchesStatus;
      })
    : [];

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setIsEditDialogOpen(true);
  };

  const handleDeleteReview = (reviewId: number) => {
    setDeletingReviewId(reviewId);
    setIsDeleteDialogOpen(true);
  };

  const handleStatusChange = (reviewId: number, status: string) => {
    changeReviewStatusMutation.mutate({ reviewId, status });
  };

  const handleSaveEdit = () => {
    if (editingReview) {
      updateReviewMutation.mutate(editingReview);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingReviewId) {
      deleteReviewMutation.mutate(deletingReviewId);
    }
  };

  // Render stars for rating
  const renderRatingStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} 
      />
    ));
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500 hover:bg-green-600">Yayında</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Onay Bekliyor</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 hover:bg-red-600">Reddedildi</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get source badge
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'user':
        return <Badge variant="outline" className="bg-blue-50">Kullanıcı</Badge>;
      case 'auto':
        return <Badge variant="outline" className="bg-emerald-50">Otomatik</Badge>;
      case 'admin':
        return <Badge variant="outline" className="bg-purple-50">Admin</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6 p-6">
        <div className="flex flex-col space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Yorum Yönetimi</h2>
          <p className="text-muted-foreground">
            Ürün yorumlarını görüntüleyin, düzenleyin ve yönetin
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Ürün Yorumları</CardTitle>
            <CardDescription>
              Sisteme eklenen tüm ürün yorumlarını buradan yönetebilirsiniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Yorumlarda ara..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Filter Dropdowns */}
                <div className="flex flex-wrap gap-2">
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger className="w-[110px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <span className="truncate">Puan</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Puanlar</SelectItem>
                      <SelectItem value="5">5 Yıldız</SelectItem>
                      <SelectItem value="4">4 Yıldız</SelectItem>
                      <SelectItem value="3">3 Yıldız</SelectItem>
                      <SelectItem value="2">2 Yıldız</SelectItem>
                      <SelectItem value="1">1 Yıldız</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterSource} onValueChange={setFilterSource}>
                    <SelectTrigger className="w-[120px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <span className="truncate">Kaynak</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Kaynaklar</SelectItem>
                      <SelectItem value="user">Kullanıcı</SelectItem>
                      <SelectItem value="auto">Otomatik</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[120px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <span className="truncate">Durum</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Durumlar</SelectItem>
                      <SelectItem value="published">Yayında</SelectItem>
                      <SelectItem value="pending">Onay Bekliyor</SelectItem>
                      <SelectItem value="rejected">Reddedildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Tabs */}
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4 w-full md:w-[400px]">
                  <TabsTrigger value="all">Tümü</TabsTrigger>
                  <TabsTrigger value="pending">Onay Bekleyenler</TabsTrigger>
                  <TabsTrigger value="published">Yayındakiler</TabsTrigger>
                  <TabsTrigger value="rejected">Reddedilenler</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab} className="mt-4">
                  <Card>
                    <CardContent className="p-0 sm:p-2">
                      <div className="rounded-md border overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ürün</TableHead>
                              <TableHead>Puan</TableHead>
                              <TableHead>Başlık</TableHead>
                              <TableHead>Kaynak</TableHead>
                              <TableHead>Kullanıcı</TableHead>
                              <TableHead>Durum</TableHead>
                              <TableHead>Tarih</TableHead>
                              <TableHead>İşlemler</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoading ? (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-4">
                                  Yorumlar yükleniyor...
                                </TableCell>
                              </TableRow>
                            ) : filteredReviews.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-4">
                                  Belirtilen kriterlere uygun yorum bulunamadı.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredReviews.map((review: Review) => (
                                <TableRow key={review.id}>
                                  <TableCell className="max-w-[180px] truncate">
                                    {review.product ? review.product.name : `Ürün #${review.product_id}`}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      {renderRatingStars(review.rating)}
                                    </div>
                                  </TableCell>
                                  <TableCell className="max-w-[160px] truncate">
                                    {review.title}
                                  </TableCell>
                                  <TableCell>
                                    {getSourceBadge(review.source)}
                                  </TableCell>
                                  <TableCell>
                                    {review.username || 'Anonim'}
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(review.status)}
                                  </TableCell>
                                  <TableCell>
                                    {new Date(review.created_at).toLocaleDateString('tr-TR')}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="p-0 h-8 w-8 flex items-center justify-center"
                                        onClick={() => handleEditReview(review)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      
                                      {review.status !== 'published' && (
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="p-0 h-8 w-8 flex items-center justify-center text-green-500 hover:text-green-600"
                                          onClick={() => handleStatusChange(review.id, 'published')}
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                        </Button>
                                      )}
                                      
                                      {review.status !== 'rejected' && (
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="p-0 h-8 w-8 flex items-center justify-center text-amber-500 hover:text-amber-600"
                                          onClick={() => handleStatusChange(review.id, 'rejected')}
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      )}
                                      
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="p-0 h-8 w-8 flex items-center justify-center text-red-500 hover:text-red-600"
                                        onClick={() => handleDeleteReview(review.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Review Dialog */}
      {editingReview && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Yorumu Düzenle</DialogTitle>
              <DialogDescription>
                Yorum içeriğini güncelleyin. Değişiklikleri kaydetmek için "Kaydet" butonuna tıklayın.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="product" className="text-sm font-medium">Ürün:</label>
                <Input 
                  id="product" 
                  value={editingReview.product ? editingReview.product.name : `Ürün #${editingReview.product_id}`} 
                  disabled 
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="user" className="text-sm font-medium">Kullanıcı:</label>
                <Input 
                  id="user" 
                  value={editingReview.username || 'Anonim'} 
                  onChange={(e) => setEditingReview({...editingReview, username: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="rating" className="text-sm font-medium">Puan:</label>
                <Select 
                  value={editingReview.rating.toString()} 
                  onValueChange={(value) => setEditingReview({...editingReview, rating: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Puan seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Yıldız</SelectItem>
                    <SelectItem value="4">4 Yıldız</SelectItem>
                    <SelectItem value="3">3 Yıldız</SelectItem>
                    <SelectItem value="2">2 Yıldız</SelectItem>
                    <SelectItem value="1">1 Yıldız</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">Başlık:</label>
                <Input 
                  id="title" 
                  value={editingReview.title} 
                  onChange={(e) => setEditingReview({...editingReview, title: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="content" className="text-sm font-medium">İçerik:</label>
                <Textarea 
                  id="content" 
                  rows={4} 
                  value={editingReview.content} 
                  onChange={(e) => setEditingReview({...editingReview, content: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="status" className="text-sm font-medium">Durum:</label>
                <Select 
                  value={editingReview.status} 
                  onValueChange={(value) => setEditingReview({...editingReview, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Yayında</SelectItem>
                    <SelectItem value="pending">Onay Bekliyor</SelectItem>
                    <SelectItem value="rejected">Reddedildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                İptal
              </Button>
              <Button 
                type="button" 
                onClick={handleSaveEdit}
                disabled={updateReviewMutation.isPending}
              >
                {updateReviewMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Yorumu Sil</DialogTitle>
            <DialogDescription>
              Bu yorumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center py-4">
            <AlertTriangle className="h-16 w-16 text-amber-500" />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteReviewMutation.isPending}
            >
              {deleteReviewMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}