import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link, useRoute, useLocation } from 'wouter';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/skeletons/CardSkeleton';
import { useToast } from '@/hooks/use-toast';

// İkonlar
import { Filter, Search, ShoppingCart, ArrowLeft, ArrowRight } from 'lucide-react';

// Ürün kartı bileşenini Shop.tsx'den import edebilirdik, ancak bu örnek için yeniden tanımlıyoruz
const ProductCard = ({ product }: any) => {
  const platformColor = {
    'twitch': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'youtube': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'instagram': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'tiktok': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
    'default': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  };

  const categoryLabel = {
    'followers': 'Takipçiler',
    'viewers': 'İzleyiciler',
    'likes': 'Beğeniler',
    'views': 'Görüntülenmeler',
    'comments': 'Yorumlar',
    'subscribers': 'Aboneler',
    'default': 'Diğer'
  };

  const getColor = (platform: string) => {
    return platformColor[platform.toLowerCase() as keyof typeof platformColor] || platformColor.default;
  };

  const getCategoryLabel = (category: string) => {
    return categoryLabel[category.toLowerCase() as keyof typeof categoryLabel] || categoryLabel.default;
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg relative h-full flex flex-col">
      {product.discountPercentage > 0 && (
        <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-600">
          %{product.discountPercentage} İndirim
        </Badge>
      )}
      <CardHeader className={`${getColor(product.platform.slug)}`}>
        <CardTitle className="flex justify-between items-center">
          {product.name}
        </CardTitle>
        <CardDescription className="text-black dark:text-white font-medium">
          {product.platform.name} / {getCategoryLabel(product.category.slug)}
        </CardDescription>
      </CardHeader>
      <CardContent className="py-4 flex-grow">
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">{product.description}</p>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Teslim Süresi:</span>
            <span className="text-sm">{product.deliveryTime || "1-2 saat"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Minimum Sipariş:</span>
            <span className="text-sm">{product.minOrder || 100}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Maksimum Sipariş:</span>
            <span className="text-sm">{product.maxOrder || 10000}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-4 border-t flex flex-col space-y-3">
        <div className="flex justify-between items-center w-full">
          {product.discountPercentage > 0 ? (
            <div className="flex flex-col">
              <span className="text-sm line-through text-gray-500">₺{product.originalPrice}</span>
              <span className="text-xl font-bold text-green-600">₺{product.price}</span>
            </div>
          ) : (
            <span className="text-xl font-bold">₺{product.price}</span>
          )}
          
          <Button size="sm" variant="outline">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Sepete Ekle
          </Button>
        </div>
        <Link href={`/shop/product/${product.id}`}>
          <Button variant="link" className="w-full p-0 h-auto text-sm mt-1">
            Ürün Detayları <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

const PlatformShop = () => {
  const [, params] = useRoute('/shop/:platformSlug');
  const platformSlug = params?.platformSlug;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');

  // Platform bilgisini çek
  const { data: platform, isLoading: isLoadingPlatform } = useQuery({
    queryKey: ['/api/platforms', platformSlug],
    queryFn: () => apiRequest('GET', `/api/platforms/slug/${platformSlug}`).then(res => res.json()),
    enabled: !!platformSlug,
  });

  // Kategorileri çek
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/product-categories'],
    queryFn: () => apiRequest('GET', '/api/product-categories').then(res => res.json()),
  });

  // Platform bazlı ürünleri çek
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/digital-products/platform', platformSlug],
    queryFn: () => apiRequest('GET', `/api/digital-products/platform/${platformSlug}`).then(res => res.json()),
    enabled: !!platformSlug,
  });

  // Ürünleri filtrele ve sırala
  const filteredProducts = React.useMemo(() => {
    if (!Array.isArray(products)) return [];
    
    return products
      .filter(product => {
        const matchesSearch = searchQuery === '' || 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = categoryFilter === 'all' || 
          (product.category && product.category.slug === categoryFilter);
        
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-low':
            return a.price - b.price;
          case 'price-high':
            return b.price - a.price;
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'popularity':
          default:
            return (b.popularityScore || 0) - (a.popularityScore || 0);
        }
      });
  }, [products, searchQuery, categoryFilter, sortBy]);

  if (isLoadingPlatform || !platform) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/shop">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tüm Ürünlere Dön
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/shop">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tüm Ürünlere Dön
          </Button>
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{platform.name} Ürünleri</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {platform.description || `${platform.name} için tüm dijital hizmetlerimizi keşfedin`}
        </p>
      </header>

      {/* Filtreler ve Arama */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Ürün ara..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {Array.isArray(categories) && categories.map(category => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sıralama" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Popülerlik</SelectItem>
              <SelectItem value="price-low">Fiyat (Düşükten Yükseğe)</SelectItem>
              <SelectItem value="price-high">Fiyat (Yüksekten Düşüğe)</SelectItem>
              <SelectItem value="newest">En Yeni</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ürün Listesi */}
      <div className="mt-6">
        {isLoadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Ürün Bulunamadı</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Bu platform için arama kriterlerinize uygun ürün bulunamadı. Lütfen farklı filtreler deneyin.
            </p>
            <Button onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
            }}>
              Filtreleri Sıfırla
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformShop;