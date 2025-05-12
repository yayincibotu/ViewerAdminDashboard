import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import AdminLayout from '@/components/dashboard/AdminLayout';
import AdminHeader from '@/components/dashboard/AdminHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, UserPlus, Edit, ShieldAlert, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const UsersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Kullanıcı verilerini çekme
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: () => apiRequest('GET', '/api/admin/users').then(res => res.json()),
    onError: (error) => {
      toast({
        title: 'Kullanıcıları yükleme hatası',
        description: 'Kullanıcı verileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
        variant: 'destructive',
      });
    },
  });
  
  // Kullanıcı verilerini konsolda görüntüleme
  useEffect(() => {
    console.log("Users data:", users);
  }, [users]);

  // Filtreleme fonksiyonu
  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = 
      searchQuery === '' || 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }) : [];
  
  // Filtrelenmiş kullanıcıları konsolda görüntüleme
  useEffect(() => {
    console.log("Filtered users:", filteredUsers);
  }, [filteredUsers]);

  // Admin rolü değiştirme işlevi
  const handleToggleAdmin = (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    apiRequest('PUT', `/api/admin/users/${userId}`, { role: newRole })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        toast({
          title: 'Kullanıcı rolü güncellendi',
          description: `Kullanıcı rolü ${newRole} olarak güncellendi.`,
        });
      })
      .catch(error => {
        toast({
          title: 'Rol güncelleme hatası',
          description: error.message,
          variant: 'destructive',
        });
      });
  };

  // CSV dışa aktarma
  const handleExportCSV = () => {
    const headers = ['ID', 'Username', 'Email', 'Role', 'Created At'];
    const csvData = [
      headers.join(','),
      ...filteredUsers.map(user => [
        user.id,
        user.username,
        user.email,
        user.role,
        new Date(user.createdAt).toISOString().split('T')[0]
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <AdminHeader title="Kullanıcı Yönetimi" description="Tüm kullanıcıları görüntüleyin ve yönetin." />
      
      <Card>
        <CardContent className="p-6">
          {/* Filtreler ve arama */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Kullanıcı adı veya e-posta ile ara..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Roller</SelectItem>
                  <SelectItem value="user">Kullanıcılar</SelectItem>
                  <SelectItem value="admin">Yöneticiler</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Dışa Aktar
              </Button>
              
              <Button onClick={() => navigate('/webadmin/users/new')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Kullanıcı Ekle
              </Button>
            </div>
          </div>
          
          {/* Kullanıcı tablosu */}
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı Adı</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Kullanıcı bulunamadı.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/webadmin/users/${user.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Düzenle
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleToggleAdmin(user.id, user.role)}
                            >
                              <ShieldAlert className="h-4 w-4 mr-1" />
                              {user.role === 'admin' ? 'Yönetici Kaldır' : 'Yönetici Yap'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default UsersPage;