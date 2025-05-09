import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import AdminSidebar from '@/components/dashboard/AdminSidebar';
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
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const UserRow: React.FC<{ user: any, onManageUser: (userId: number) => void }> = ({ user, onManageUser }) => {
  const [showActions, setShowActions] = useState(false);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Email verification mutation
  const verifyEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/admin/users/${user.id}/verify-email`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Email verified',
        description: `User email for ${user.username} has been manually verified.`,
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
  
  // Toggle admin role mutation
  const toggleAdminMutation = useMutation({
    mutationFn: async () => {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      const res = await apiRequest('PUT', `/api/admin/users/${user.id}`, { role: newRole });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      const actionType = user.role === 'admin' ? 'removed from' : 'added to';
      toast({
        title: 'Admin role updated',
        description: `Admin privileges ${actionType} ${user.username}.`,
      });
      setShowActions(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating role',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Delete user mutation (not yet implemented in the API)
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', `/api/admin/users/${user.id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'User deleted',
        description: `User ${user.username} has been deleted.`,
      });
      setShowActions(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting user',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const getUserRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500 hover:bg-red-600">Admin</Badge>;
      default:
        return <Badge className="bg-blue-500 hover:bg-blue-600">User</Badge>;
    }
  };
  
  const getUserVerificationBadge = (isVerified: boolean) => {
    if (isVerified) {
      return <Badge className="ml-2 bg-green-500 hover:bg-green-600">Verified</Badge>;
    }
    return <Badge className="ml-2 bg-yellow-500 hover:bg-yellow-600">Unverified</Badge>;
  };
  
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-3">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{user.username}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="mt-1 flex">
              {getUserRoleBadge(user.role)}
              {getUserVerificationBadge(user.isEmailVerified)}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm">{format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
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
        <div className="relative">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowActions(!showActions)}>
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
          
          {showActions && (
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white z-50 ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setShowActions(false);
                    navigate(`/webadmin/users/${user.id}`);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" /> View Full Details
                </button>
                <button
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setShowActions(false);
                    onManageUser(user.id);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" /> Manage User
                </button>
                {!user.isEmailVerified && (
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setShowActions(false);
                      verifyEmailMutation.mutate();
                    }}
                    disabled={verifyEmailMutation.isPending}
                  >
                    {verifyEmailMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    Verify Email
                  </button>
                )}
                {user.role !== 'admin' ? (
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      // Add to admin action
                      setShowActions(false);
                    }}
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" /> Make Admin
                  </button>
                ) : (
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      // Remove admin action
                      setShowActions(false);
                    }}
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" /> Remove Admin
                  </button>
                )}
                <button
                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  onClick={() => {
                    // Delete action
                    setShowActions(false);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete User
                </button>
              </div>
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
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
  
  // Fetch users data
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/users'],
  });
  
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
    const matchesSearch = searchQuery
      ? user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
      
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }) : [];
  
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">User Management</h1>
              <p className="text-gray-500">Manage and monitor user accounts</p>
            </div>
            
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
                          className="col-span-3" 
                          value={newUserData.username}
                          onChange={handleInputChange}
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
                          className="col-span-3" 
                          value={newUserData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          Password
                        </Label>
                        <div className="col-span-3 space-y-1">
                          <Input 
                            id="password" 
                            type="password" 
                            className="w-full" 
                            value={newUserData.password}
                            onChange={handleInputChange}
                            required
                          />
                          <p className="text-xs text-gray-500">Password must be at least 8 characters long.</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                          Role
                        </Label>
                        <Select 
                          value={newUserData.role} 
                          onValueChange={handleRoleChange}
                        >
                          <SelectTrigger id="role" className="col-span-3">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="admin" className="text-right">
                          Is Admin
                        </Label>
                        <div className="col-span-3 flex items-center space-x-2">
                          <Switch 
                            id="admin" 
                            checked={newUserData.isAdmin}
                            onCheckedChange={handleAdminSwitchChange}
                          />
                          <Label htmlFor="admin">Grant admin privileges</Label>
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddUserDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={
                          createUserMutation.isPending || 
                          !newUserData.username || 
                          !newUserData.email || 
                          newUserData.password.length < 8
                        }
                      >
                        {createUserMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : "Create User"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                View and manage all registered users
              </CardDescription>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Filter:</span>
                  </div>
                  
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading users...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                  <p className="text-red-600 font-medium">Error loading users</p>
                  <p className="text-gray-500 text-sm">Please try refreshing the page.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Payment Setup</TableHead>
                      <TableHead>Active Subscription</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <UserRow 
                        key={user.id} 
                        user={user} 
                        onManageUser={handleManageUser} 
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found matching your filters.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
