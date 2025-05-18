import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Star, Check, X, Search, Filter, Eye, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

// Types
type ReviewStatus = "pending" | "published" | "rejected";

interface Review {
  id: number;
  product_id: number;
  user_id: number | null;
  username: string | null;
  rating: number;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  status: ReviewStatus;
  helpful_count: number;
  verified_purchase: boolean;
  platform: string | null;
  device_type: string | null;
  source: string;
  country_code: string | null;
  created_at: string;
  updated_at: string;
  product_name?: string;
}

export default function CommentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [productId, setProductId] = useState<string>("all");
  const [status, setStatus] = useState<ReviewStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // State for dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [editedReview, setEditedReview] = useState<Partial<Review> | null>(null);

  // Fetch reviews
  const reviewsQuery = useQuery({
    queryKey: ['/api/admin/reviews', page, limit, productId, status, search, sortBy, sortOrder],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.append('page', page.toString());
      searchParams.append('limit', limit.toString());
      if (productId && productId !== 'all') searchParams.append('productId', productId);
      if (status && status !== 'all') searchParams.append('status', status);
      if (search) searchParams.append('search', search);
      searchParams.append('sortBy', sortBy);
      searchParams.append('sortOrder', sortOrder);
      
      const response = await fetch(`/api/admin/reviews?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      return response.json();
    }
  });
  
  // Fetch products for filter
  const productsQuery = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    }
  });

  // Update review mutation
  const updateReviewMutation = useMutation({
    mutationFn: async (reviewData: Partial<Review>) => {
      const response = await apiRequest(
        'PATCH', 
        `/api/admin/reviews/${reviewData.id}`, 
        reviewData
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update review');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      toast({
        title: "Yorum güncellendi",
        description: "Yorum başarıyla güncellendi.",
      });
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Yorum güncellenirken hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update review status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: ReviewStatus }) => {
      const response = await apiRequest(
        'PATCH', 
        `/api/admin/reviews/${id}/status`, 
        { status }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update review status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      toast({
        title: "Durum güncellendi",
        description: "Yorum durumu başarıyla güncellendi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Durum güncellenirken hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        'DELETE', 
        `/api/admin/reviews/${id}`, 
        {}
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete review');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      toast({
        title: "Yorum silindi",
        description: "Yorum başarıyla silindi.",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Yorum silinirken hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Action handlers
  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setViewDialogOpen(true);
  };

  const handleEditReview = (review: Review) => {
    setSelectedReview(review);
    setEditedReview({...review});
    setEditDialogOpen(true);
  };

  const handleDeleteReview = (review: Review) => {
    setSelectedReview(review);
    setDeleteDialogOpen(true);
  };

  const updateReviewStatus = async (id: number, status: ReviewStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500">Yayında</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Beklemede</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">Reddedildi</Badge>;
      default:
        return null;
    }
  };

  // Handle form submission
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedReview && selectedReview) {
      updateReviewMutation.mutate({
        id: selectedReview.id,
        ...editedReview
      });
    }
  };

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (selectedReview) {
      deleteReviewMutation.mutate(selectedReview.id);
    }
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
  };

  // Reset filters
  const resetFilters = () => {
    setProductId("all");
    setStatus("all");
    setSearch("");
    setSortBy("created_at");
    setSortOrder("desc");
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="container py-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Yorum Yönetimi</h1>
            <p className="text-muted-foreground">
              Tüm ürün yorumlarını bu panelden yönetin. Yorumları düzenleyin, onaylayın veya reddedin.
            </p>
          </div>
          
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtreler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="product">Ürün</Label>
                  <Select 
                    value={productId} 
                    onValueChange={setProductId}
                  >
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Tüm Ürünler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Ürünler</SelectItem>
                      {productsQuery.data?.map((product: any) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="status">Durum</Label>
                  <Select 
                    value={status} 
                    onValueChange={(value) => setStatus(value as ReviewStatus | "all")}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Tüm Durumlar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Durumlar</SelectItem>
                      <SelectItem value="published">Yayında</SelectItem>
                      <SelectItem value="pending">Beklemede</SelectItem>
                      <SelectItem value="rejected">Reddedildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="search">Arama</Label>
                  <div className="flex">
                    <Input
                      id="search"
                      placeholder="Yorumlarda ara..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      className="ml-2"
                      onClick={() => {
                        if (search.trim()) {
                          setPage(1);
                          // Search is applied automatically because it's in the queryKey
                        }
                      }}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sort">Sıralama</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={sortBy} 
                      onValueChange={setSortBy}
                    >
                      <SelectTrigger id="sort" className="flex-grow">
                        <SelectValue placeholder="Sıralama" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">Tarih</SelectItem>
                        <SelectItem value="rating">Puan</SelectItem>
                        <SelectItem value="helpful_count">Faydalı Sayısı</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={sortOrder} 
                      onValueChange={setSortOrder}
                    >
                      <SelectTrigger id="order" className="w-24">
                        <SelectValue placeholder="Yön" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Azalan</SelectItem>
                        <SelectItem value="asc">Artan</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      onClick={resetFilters}
                    >
                      Sıfırla
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Reviews Table */}
          <Card>
            <CardContent className="p-0">
              {reviewsQuery.isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : reviewsQuery.isError ? (
                <div className="flex justify-center items-center p-8">
                  <p className="text-red-500">
                    Yorumlar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">ID</TableHead>
                          <TableHead className="w-[200px]">Ürün Adı</TableHead>
                          <TableHead className="w-[150px]">Kullanıcı</TableHead>
                          <TableHead className="w-[100px]">Puan</TableHead>
                          <TableHead className="w-[200px]">Başlık</TableHead>
                          <TableHead className="w-[100px]">Durum</TableHead>
                          <TableHead className="w-[150px]">Tarih</TableHead>
                          <TableHead className="w-[120px]">Kaynak</TableHead>
                          <TableHead className="w-[150px]">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reviewsQuery.data?.reviews?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-4">
                              Filtrelere uygun yorum bulunamadı.
                            </TableCell>
                          </TableRow>
                        ) : (
                          reviewsQuery.data?.reviews?.map((review: Review) => (
                            <TableRow key={review.id}>
                              <TableCell>{review.id}</TableCell>
                              <TableCell className="font-medium">{review.product_name}</TableCell>
                              <TableCell>{review.username || 'Anonim'}</TableCell>
                              <TableCell>
                                <div className="flex">{renderStars(review.rating)}</div>
                              </TableCell>
                              <TableCell>{review.title}</TableCell>
                              <TableCell>{getStatusBadge(review.status)}</TableCell>
                              <TableCell>{formatDate(review.created_at)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{review.source}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleViewReview(review)}
                                    title="Görüntüle"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditReview(review)}
                                    title="Düzenle"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteReview(review)}
                                    title="Sil"
                                    className="text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  {review.status !== "published" && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => updateReviewStatus(review.id, "published")}
                                      title="Onayla"
                                      className="text-green-500"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {review.status !== "rejected" && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => updateReviewStatus(review.id, "rejected")}
                                      title="Reddet"
                                      className="text-red-500"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
              
                  {/* Pagination */}
                  {reviewsQuery.data?.pagination?.totalPages > 1 && (
                    <div className="py-4 border-t">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setPage(p => Math.max(1, p - 1))}
                              className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: reviewsQuery.data.pagination.totalPages }).map((_, i) => (
                            <PaginationItem key={i}>
                              <PaginationLink
                                onClick={() => setPage(i + 1)}
                                isActive={page === i + 1}
                              >
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setPage(p => Math.min(reviewsQuery.data.pagination.totalPages, p + 1))}
                              className={page >= reviewsQuery.data.pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yorum Detayları</DialogTitle>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">Ürün</h3>
                  <p>{selectedReview.product_name}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Durum</h3>
                  {getStatusBadge(selectedReview.status)}
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Kullanıcı</h3>
                  <p>{selectedReview.username || 'Anonim'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Ülke</h3>
                  <p>{selectedReview.country_code || '-'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Platform</h3>
                  <p>{selectedReview.platform || '-'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Cihaz</h3>
                  <p>{selectedReview.device_type || '-'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Kaynak</h3>
                  <p>{selectedReview.source}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Oluşturulma Tarihi</h3>
                  <p>{formatDate(selectedReview.created_at)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <h3 className="font-semibold">Değerlendirme:</h3>
                  <div className="flex">
                    {renderStars(selectedReview.rating)}
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground">({selectedReview.rating}/5)</span>
                </div>
                <div>
                  <h3 className="font-semibold">Başlık</h3>
                  <p>{selectedReview.title}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Yorum</h3>
                  <p className="whitespace-pre-wrap">{selectedReview.content}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-green-500">Artılar</h3>
                  {selectedReview.pros && selectedReview.pros.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedReview.pros.map((pro, index) => (
                        <li key={index}>{pro}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Belirtilmemiş</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-red-500">Eksiler</h3>
                  {selectedReview.cons && selectedReview.cons.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedReview.cons.map((con, index) => (
                        <li key={index}>{con}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Belirtilmemiş</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Diğer</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedReview.verified_purchase && (
                      <Badge variant="outline" className="bg-blue-50">Doğrulanmış Satın Alma</Badge>
                    )}
                    <Badge variant="outline" className="bg-blue-50">Faydalı Oy: {selectedReview.helpful_count}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEditReview(selectedReview)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Düzenle
                  </Button>
                  <Button variant="destructive" onClick={() => {
                    setViewDialogOpen(false);
                    handleDeleteReview(selectedReview);
                  }}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Sil
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yorumu Düzenle</DialogTitle>
          </DialogHeader>
          
          {editedReview && (
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="product">Ürün</Label>
                  <Input 
                    id="product" 
                    value={selectedReview?.product_name || ''} 
                    disabled 
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="status">Durum</Label>
                  <Select 
                    value={editedReview.status} 
                    onValueChange={(value: ReviewStatus) => setEditedReview({...editedReview, status: value})}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Yayında</SelectItem>
                      <SelectItem value="pending">Beklemede</SelectItem>
                      <SelectItem value="rejected">Reddedildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="username">Kullanıcı Adı</Label>
                  <Input 
                    id="username" 
                    value={editedReview.username || ''} 
                    onChange={(e) => setEditedReview({...editedReview, username: e.target.value})}
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="rating">Değerlendirme</Label>
                  <Select 
                    value={editedReview.rating?.toString() || "5"} 
                    onValueChange={(value) => setEditedReview({...editedReview, rating: parseInt(value)})}
                  >
                    <SelectTrigger id="rating">
                      <SelectValue placeholder="Değerlendirme seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Yıldız</SelectItem>
                      <SelectItem value="2">2 Yıldız</SelectItem>
                      <SelectItem value="3">3 Yıldız</SelectItem>
                      <SelectItem value="4">4 Yıldız</SelectItem>
                      <SelectItem value="5">5 Yıldız</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Başlık</Label>
                <Input 
                  id="title" 
                  value={editedReview.title} 
                  onChange={(e) => setEditedReview({...editedReview, title: e.target.value})}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="content">Yorum</Label>
                <Textarea 
                  id="content" 
                  value={editedReview.content} 
                  onChange={(e) => setEditedReview({...editedReview, content: e.target.value})}
                  rows={5}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="pros">Artılar (Her satır bir madde)</Label>
                  <Textarea 
                    id="pros" 
                    value={editedReview.pros?.join('\n') || ''} 
                    onChange={(e) => setEditedReview({
                      ...editedReview, 
                      pros: e.target.value.split('\n').filter(line => line.trim() !== '')
                    })}
                    rows={3}
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cons">Eksiler (Her satır bir madde)</Label>
                  <Textarea 
                    id="cons" 
                    value={editedReview.cons?.join('\n') || ''} 
                    onChange={(e) => setEditedReview({
                      ...editedReview, 
                      cons: e.target.value.split('\n').filter(line => line.trim() !== '')
                    })}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="country">Ülke Kodu</Label>
                  <Input 
                    id="country" 
                    value={editedReview.country_code || ''} 
                    onChange={(e) => setEditedReview({...editedReview, country_code: e.target.value})}
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Input 
                    id="platform" 
                    value={editedReview.platform || ''} 
                    onChange={(e) => setEditedReview({...editedReview, platform: e.target.value})}
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="device">Cihaz Tipi</Label>
                  <Input 
                    id="device" 
                    value={editedReview.device_type || ''} 
                    onChange={(e) => setEditedReview({...editedReview, device_type: e.target.value})}
                  />
                </div>
                
                <div className="flex items-center space-x-2 h-full pt-8">
                  <Checkbox 
                    id="verified" 
                    checked={editedReview.verified_purchase} 
                    onCheckedChange={(checked) => setEditedReview({
                      ...editedReview, 
                      verified_purchase: checked as boolean
                    })}
                  />
                  <Label htmlFor="verified">Doğrulanmış Satın Alma</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button 
                  type="submit"
                  disabled={updateReviewMutation.isPending}
                >
                  {updateReviewMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Kaydet
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yorumu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu yorumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteReviewMutation.isPending}
            >
              {deleteReviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : 'Evet, Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}