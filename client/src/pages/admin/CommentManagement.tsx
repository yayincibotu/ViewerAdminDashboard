import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Trash2, Edit, CheckCircle, XCircle, Eye, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

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
  product?: {
    name: string;
  };
}

export default function CommentManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editedReview, setEditedReview] = useState<Partial<Review>>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [productFilter, setProductFilter] = useState<string>("all");

  const reviewsQuery = useQuery({
    queryKey: ['/api/admin/reviews', page, statusFilter, searchQuery, productFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (productFilter !== 'all') {
        params.append('productId', productFilter);
      }
      
      const response = await fetch(`/api/admin/reviews?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Yorumlar yüklenirken bir hata oluştu');
      }
      return response.json();
    },
    refetchOnWindowFocus: false
  });

  const productsQuery = useQuery({
    queryKey: ['/api/digital-products'],
    queryFn: async () => {
      const response = await fetch('/api/digital-products');
      if (!response.ok) {
        throw new Error('Ürünler yüklenirken bir hata oluştu');
      }
      return response.json();
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    reviewsQuery.refetch();
  };

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1); // Reset to first page on filter change
  };

  const handleProductFilterChange = (value: string) => {
    setProductFilter(value);
    setPage(1); // Reset to first page on filter change
  };

  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setIsViewDialogOpen(true);
  };

  const handleEditReview = (review: Review) => {
    setSelectedReview(review);
    setEditedReview({
      title: review.title,
      content: review.content,
      pros: review.pros,
      cons: review.cons,
      rating: review.rating,
      status: review.status
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteReview = (review: Review) => {
    setSelectedReview(review);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteReview = async () => {
    if (!selectedReview) return;
    
    try {
      await apiRequest('DELETE', `/api/admin/reviews/${selectedReview.id}`);
      toast({
        title: "Yorum silindi",
        description: "Yorum başarıyla silindi.",
      });
      setIsDeleteDialogOpen(false);
      reviewsQuery.refetch();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yorum silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const updateReviewStatus = async (id: number, status: ReviewStatus) => {
    try {
      await apiRequest('PATCH', `/api/admin/reviews/${id}/status`, { status });
      toast({
        title: "Durum güncellendi",
        description: `Yorum durumu "${status}" olarak güncellendi.`,
      });
      reviewsQuery.refetch();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Durum güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const saveReviewChanges = async () => {
    if (!selectedReview) return;
    
    try {
      await apiRequest('PATCH', `/api/admin/reviews/${selectedReview.id}`, editedReview);
      toast({
        title: "Yorum güncellendi",
        description: "Yorum başarıyla güncellendi.",
      });
      setIsEditDialogOpen(false);
      reviewsQuery.refetch();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yorum güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
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
        return <Badge>{status}</Badge>;
    }
  };

  const getRatingStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Yorum Yönetimi</CardTitle>
            <CardDescription>
              Kullanıcı yorumlarını yönetin, düzenleyin ve onaylayın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <form onSubmit={handleSearch} className="flex w-full md:w-96 items-center space-x-2">
                <Input
                  placeholder="Ara: Başlık, içerik veya kullanıcı..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
                <Button type="submit" variant="secondary" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex flex-col">
                  <Label htmlFor="statusFilter" className="mb-1 text-sm">Durum</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={handleFilterChange}
                  >
                    <SelectTrigger id="statusFilter" className="w-[180px]">
                      <SelectValue placeholder="Durum filtresi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="published">Yayında</SelectItem>
                      <SelectItem value="pending">Beklemede</SelectItem>
                      <SelectItem value="rejected">Reddedildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col">
                  <Label htmlFor="productFilter" className="mb-1 text-sm">Ürün</Label>
                  <Select
                    value={productFilter}
                    onValueChange={handleProductFilterChange}
                  >
                    <SelectTrigger id="productFilter" className="w-[180px]">
                      <SelectValue placeholder="Ürün filtresi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Ürünler</SelectItem>
                      {productsQuery.data && productsQuery.data.map((product: any) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name.substring(0, 25)}{product.name.length > 25 ? '...' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" onClick={() => reviewsQuery.refetch()} className="ml-auto self-end">
                  <RefreshCw className="h-4 w-4 mr-2" /> Yenile
                </Button>
              </div>
            </div>

            {reviewsQuery.isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : reviewsQuery.error ? (
              <div className="py-12 text-center">
                <p className="text-red-500">Yorumlar yüklenirken bir hata oluştu</p>
                <Button variant="outline" onClick={() => reviewsQuery.refetch()} className="mt-4">
                  Tekrar Dene
                </Button>
              </div>
            ) : reviewsQuery.data?.reviews?.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">Hiç yorum bulunamadı</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Ürün</TableHead>
                        <TableHead>Başlık</TableHead>
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>Puan</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Kaynak</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviewsQuery.data?.reviews?.map((review: Review) => (
                        <TableRow key={review.id}>
                          <TableCell className="font-medium">{review.id}</TableCell>
                          <TableCell className="max-w-[120px] truncate" title={review.product?.name || `Ürün #${review.product_id}`}>
                            {review.product?.name || `Ürün #${review.product_id}`}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate" title={review.title}>
                            {review.title}
                          </TableCell>
                          <TableCell>{review.username || `Kullanıcı #${review.user_id}`}</TableCell>
                          <TableCell className="font-mono">{getRatingStars(review.rating)}</TableCell>
                          <TableCell>{getStatusBadge(review.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {review.source}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(review.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
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
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    ⋯
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {review.status !== "published" && (
                                    <DropdownMenuItem onClick={() => updateReviewStatus(review.id, "published")}>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Onayla
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {review.status !== "rejected" && (
                                    <DropdownMenuItem onClick={() => updateReviewStatus(review.id, "rejected")}>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reddet
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {review.status !== "pending" && (
                                    <DropdownMenuItem onClick={() => updateReviewStatus(review.id, "pending")}>
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Beklemede
                                    </DropdownMenuItem>
                                  )}
                                  
                                  <DropdownMenuItem 
                                    className="text-red-600" 
                                    onClick={() => handleDeleteReview(review)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Sil
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Toplam {reviewsQuery.data?.total || 0} yorum
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      variant="outline"
                      size="sm"
                    >
                      Önceki
                    </Button>
                    <Button 
                      onClick={() => setPage(prev => prev + 1)}
                      disabled={!reviewsQuery.data?.hasMore}
                      variant="outline"
                      size="sm"
                    >
                      Sonraki
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Review Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yorum Detayları</DialogTitle>
            <DialogDescription>
              ID: {selectedReview?.id} - {selectedReview?.username || `Kullanıcı #${selectedReview?.user_id}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Ürün</Label>
                  <p className="mt-1 text-sm">{selectedReview.product?.name || `Ürün #${selectedReview.product_id}`}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Puan</Label>
                  <p className="mt-1 text-sm font-medium text-amber-500">{getRatingStars(selectedReview.rating)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Durum</Label>
                  <div className="mt-1">{getStatusBadge(selectedReview.status)}</div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Başlık</Label>
                <p className="mt-1 text-sm font-semibold">{selectedReview.title}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">İçerik</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap">{selectedReview.content}</p>
              </div>
              
              {selectedReview.pros && selectedReview.pros.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Artılar</Label>
                  <ul className="mt-1 space-y-1 text-sm list-disc list-inside">
                    {selectedReview.pros.map((pro, index) => (
                      <li key={index}>{pro}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedReview.cons && selectedReview.cons.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Eksiler</Label>
                  <ul className="mt-1 space-y-1 text-sm list-disc list-inside">
                    {selectedReview.cons.map((con, index) => (
                      <li key={index}>{con}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Kaynak</Label>
                  <p className="mt-1 text-sm capitalize">{selectedReview.source || "Belirtilmemiş"}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Doğrulanmış Satın Alma</Label>
                  <p className="mt-1 text-sm">{selectedReview.verified_purchase ? "Evet" : "Hayır"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Platform</Label>
                  <p className="mt-1 text-sm">{selectedReview.platform || "Belirtilmemiş"}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Cihaz Tipi</Label>
                  <p className="mt-1 text-sm capitalize">{selectedReview.device_type || "Belirtilmemiş"}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Ülke</Label>
                  <p className="mt-1 text-sm">{selectedReview.country_code || "Belirtilmemiş"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Oluşturulma Tarihi</Label>
                  <p className="mt-1 text-sm">
                    {new Date(selectedReview.created_at).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Güncelleme Tarihi</Label>
                  <p className="mt-1 text-sm">
                    {new Date(selectedReview.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Review Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yorumu Düzenle</DialogTitle>
            <DialogDescription>
              ID: {selectedReview?.id} - {selectedReview?.username || `Kullanıcı #${selectedReview?.user_id}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Başlık</Label>
                <Input
                  id="title"
                  value={editedReview.title || ""}
                  onChange={(e) => setEditedReview({...editedReview, title: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="content">İçerik</Label>
                <Textarea
                  id="content"
                  rows={5}
                  value={editedReview.content || ""}
                  onChange={(e) => setEditedReview({...editedReview, content: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="rating">Puan</Label>
                <Select
                  value={editedReview.rating?.toString() || "5"}
                  onValueChange={(value) => setEditedReview({...editedReview, rating: parseInt(value)})}
                >
                  <SelectTrigger id="rating">
                    <SelectValue placeholder="Puan seçin" />
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
              
              <div>
                <Label htmlFor="pros">Artılar (Her satır bir madde)</Label>
                <Textarea
                  id="pros"
                  rows={3}
                  value={editedReview.pros ? editedReview.pros.join('\n') : ''}
                  onChange={(e) => setEditedReview({
                    ...editedReview, 
                    pros: e.target.value.split('\n').filter(line => line.trim() !== '')
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="cons">Eksiler (Her satır bir madde)</Label>
                <Textarea
                  id="cons"
                  rows={3}
                  value={editedReview.cons ? editedReview.cons.join('\n') : ''}
                  onChange={(e) => setEditedReview({
                    ...editedReview, 
                    cons: e.target.value.split('\n').filter(line => line.trim() !== '')
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="status">Durum</Label>
                <Select
                  value={editedReview.status || "pending"}
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
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={saveReviewChanges}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Review Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yorumu Sil</DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. Bu yorumu silmek istediğinize emin misiniz?
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="py-4">
              <p className="font-medium">{selectedReview.title}</p>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{selectedReview.content}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmDeleteReview}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}