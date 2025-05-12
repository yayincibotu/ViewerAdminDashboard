import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import AdminLayout from '@/components/dashboard/AdminLayout';
import AdminHeader from '@/components/dashboard/AdminHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  MoreVertical, Search, Download, UserPlus, Filter, X, Edit, Trash2, 
  CheckCircle, ShieldAlert, ExternalLink, Eye, Loader2, Mail, Key, AlertTriangle 
} from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// İleri düzey kullanıcı işlemleri için utility fonksiyonlar

// Kullanıcı e-posta doğrulama
const useVerifyEmailMutation = (userId: number, username: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/admin/users/${userId}/verify-email`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Email verified',
        description: `User email for ${username} has been manually verified.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error verifying email',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
};

// Kullanıcı silme
const useDeleteUserMutation = (userId: number, username: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', `/api/admin/users/${userId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'User deleted',
        description: `User ${username} has been deleted.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting user',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
};

const AdminUsers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState<boolean>(false);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Form state for adding a new user
  const [newUserData, setNewUserData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    isAdmin: false
  });
  
  // Fetch users data with improved error handling
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/users'],
    retry: 3,
    staleTime: 10000,
    onError: (error: any) => {
      toast({
        title: "Failed to load users",
        description: error.message || "Please make sure you are logged in with an admin account",
        variant: "destructive",
      });
    },
  });
  
  // Debug log
  console.log("Users data:", users);
  
  useEffect(() => {
    // Log filtered users as well
    console.log("Filtered users:", Array.isArray(users) ? users.filter((user: any) => true) : []);
  }, [users]);
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest('POST', '/api/admin/users', userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsAddUserDialogOpen(false);
      setNewUserData({
        username: '',
        email: '',
        password: '',
        role: 'user',
        isAdmin: false
      });
      toast({
        title: 'User created',
        description: 'New user account has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating user',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number, role: string }) => {
      const res = await apiRequest('PUT', `/api/admin/users/${userId}`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'User role updated',
        description: 'User role has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating user role',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'User deleted',
        description: 'User has been successfully deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting user',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewUserData(prev => ({ ...prev, [id]: value }));
  };
  
  // Handle role select change
  const handleRoleChange = (value: string) => {
    setNewUserData(prev => ({ 
      ...prev, 
      role: value,
      isAdmin: value === 'admin'
    }));
  };
  
  // Handle admin switch change
  const handleAdminSwitchChange = (checked: boolean) => {
    setNewUserData(prev => ({ 
      ...prev, 
      isAdmin: checked,
      role: checked ? 'admin' : 'user'
    }));
  };
  
  // Handle form submission
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const userData = {
      username: newUserData.username,
      email: newUserData.email,
      password: newUserData.password,
      role: newUserData.role
    };
    createUserMutation.mutate(userData);
  };
  
  // Handle user management actions
  const handleManageUser = (userId: number) => {
    navigate(`/webadmin/users/${userId}`);
  };
  
  // Handle making user an admin
  const handleToggleAdmin = (userId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };
  
  // Filter users based on search query and role filter
  const filteredUsers = Array.isArray(users) ? users.filter((user: any) => {
    // Eksik veya hatalı kullanıcı verilerini filtreleme
    if (!user || !user.username || !user.email || !user.id) {
      console.error("Found invalid user in users array:", user);
      return false;
    }
    
    // Arama sorgusuna göre filtreleme
    const matchesSearch = searchQuery
      ? (user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.id.toString().includes(searchQuery.toLowerCase()))
      : true;
      
    // Rol filtresine göre filtreleme
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }) : [];
  
  // Debug log users before and after filtering
  console.log("Users data:", users);
  console.log("Filtered users:", filteredUsers);
  
  return (
    <AdminLayout>
      <AdminHeader
        title="User Management"
        description="Manage and monitor user accounts"
        actions={
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            
            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account manually.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreateUser}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={newUserData.username}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUserData.email}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUserData.password}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        User Role
                      </Label>
                      <Select
                        value={newUserData.role}
                        onValueChange={handleRoleChange}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="is-admin" className="text-right">
                        Admin Access
                      </Label>
                      <div className="flex items-center space-x-2 col-span-3">
                        <Switch
                          id="is-admin"
                          checked={newUserData.isAdmin}
                          onCheckedChange={handleAdminSwitchChange}
                        />
                        <Label htmlFor="is-admin">
                          {newUserData.isAdmin ? 'Enabled' : 'Disabled'}
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create User'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      >
        <div className="p-6">
          <div className="mb-6 flex flex-col md:flex-row gap-4 md:justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by username, email or ID..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="absolute right-2 top-2.5"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">Users Only</SelectItem>
                    <SelectItem value="admin">Admins Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-gray-100 text-gray-700 text-xs rounded-full px-2.5 py-1 hidden md:block">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
              </div>
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage users and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="w-full flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div>
                    <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p>Failed to load users. Please try again.</p>
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found</p>
                </div>
              ) : (
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Date Created</TableHead>
                        <TableHead>Stripe Customer</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers && filteredUsers.length > 0 ? (
                        filteredUsers.map((user: any) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-3">
                                  {user.username?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">{user.username}</p>
                                  <p className="text-sm text-gray-500">{user.email}</p>
                                  <div className="mt-1 flex">
                                    <Badge className={user.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'}>
                                      {user.role === 'admin' ? 'Admin' : 'User'}
                                    </Badge>
                                    <Badge className={`ml-2 ${user.isEmailVerified ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                      {user.isEmailVerified ? 'Verified' : 'Unverified'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'Unknown date'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span className={`h-2.5 w-2.5 rounded-full ${user.stripeCustomerId ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></span>
                                <span className="text-sm">{user.stripeCustomerId ? 'Yes' : 'No'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span className={`h-2.5 w-2.5 rounded-full ${user.stripeSubscriptionId ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></span>
                                <span className="text-sm">{user.stripeSubscriptionId ? 'Active' : 'None'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleManageUser(user.id)}
                                  className="flex items-center gap-1 px-2"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  <span>Manage</span>
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleToggleAdmin(user.id, user.role)}
                                  className="flex items-center gap-1 px-2"
                                >
                                  <ShieldAlert className="h-3.5 w-3.5" />
                                  <span>{user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                            No users found matching your criteria
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminHeader>
    </AdminLayout>
  );
};

export default AdminUsers;