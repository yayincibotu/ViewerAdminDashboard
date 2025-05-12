import React, { useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/dashboard/AdminLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, ArrowLeft, User, Key, Mail, AlertTriangle, Shield, UserCog, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const UserDetails: React.FC = () => {
  const [, navigate] = useLocation();
  const { id } = useParams();
  const userId = parseInt(id || "0");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  // Form state for user editing
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '',
    isEmailVerified: false
  });
  
  // Fetch user details
  const { data: user, isLoading, error } = useQuery<any, Error>({
    queryKey: [`/api/admin/users/${userId}`],
    enabled: userId > 0, // Only run query if we have a valid userId
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/admin/users/${userId}`);
        const data = await response.json();
        
        console.log("Received user data:", data);
        
        // Update form data when we get the user details
        if (data) {
          setFormData({
            username: data.username || '',
            email: data.email || '',
            role: data.role || '',
            isEmailVerified: data.isEmailVerified || false
          });
        }
        
        return data;
      } catch (err) {
        console.error("Error fetching user details:", err);
        throw err;
      }
    }
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: {
      username?: string;
      email?: string;
      role?: string;
      isEmailVerified?: boolean;
    }) => {
      const res = await apiRequest('PUT', `/api/admin/users/${userId}`, userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      setIsEditMode(false);
      toast({
        title: 'User updated',
        description: 'User information has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating user',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { newPassword: string }) => {
      const res = await apiRequest('POST', `/api/admin/users/${userId}/reset-password`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Password reset',
        description: 'User password has been reset successfully.',
      });
      setIsPasswordDialogOpen(false);
      setNewPassword('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error resetting password',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Manual email verification mutation
  const verifyEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/admin/users/${userId}/verify-email`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      toast({
        title: 'Email verified',
        description: 'User email has been manually verified.',
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
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate(formData);
  };
  
  // Handle password reset
  const handlePasswordReset = () => {
    resetPasswordMutation.mutate({ newPassword });
  };
  
  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading user details...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error Loading User</h2>
            <p className="text-gray-600 mb-4">{(error as Error).message}</p>
            <Button onClick={() => navigate('/webadmin/users')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isLoading && !user) {
    return (
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <User className="h-8 w-8 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
            <p className="text-gray-600 mb-4">The requested user (ID: {userId}) does not exist or could not be loaded.</p>
            <p className="text-sm text-gray-500 mb-4">API result: {JSON.stringify(user)}</p>
            <Button onClick={() => navigate('/webadmin/users')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <AdminLayout>
      <div className="p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <Button variant="outline" className="h-8 w-8 p-0" onClick={() => navigate('/webadmin/users')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">User Details</h1>
                <p className="text-gray-500">Manage user information and settings</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant={isEditMode ? "outline" : "default"} 
                onClick={() => setIsEditMode(!isEditMode)}
              >
                {isEditMode ? "Cancel Editing" : "Edit User"}
              </Button>
              
              {/* Only show save button in edit mode */}
              {isEditMode && (
                <Button onClick={handleSubmit} disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : "Save Changes"}
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>Basic user information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center mb-6">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarFallback className="text-2xl">
                      {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold">{user?.username || 'Unknown User'}</h2>
                  <p className="text-gray-500">{user?.email || 'No email'}</p>
                  <div className="flex items-center mt-2">
                    <Badge className={user?.role === 'admin' ? "bg-red-500" : "bg-blue-500"}>
                      {user?.role === 'admin' ? "Admin" : "User"}
                    </Badge>
                    {user?.isEmailVerified ? (
                      <Badge className="ml-2 bg-green-500">Verified</Badge>
                    ) : (
                      <Badge className="ml-2 bg-yellow-500">Unverified</Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">User ID</p>
                    <p>{user?.id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Registration Date</p>
                    <p>{user?.createdAt ? format(new Date(user.createdAt), 'PPP') : 'Not available'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Payment Status</p>
                    <p>{user?.stripeCustomerId ? "Payment Method Added" : "No Payment Method"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Subscription Status</p>
                    <p>{user?.stripeSubscriptionId ? "Active Subscription" : "No Subscription"}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center border-t pt-6">
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsPasswordDialogOpen(true)}>
                    <Key className="mr-2 h-4 w-4" />
                    Reset Password
                  </Button>
                  
                  {user && !user.isEmailVerified && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => verifyEmailMutation.mutate()}
                      disabled={verifyEmailMutation.isPending}
                    >
                      {verifyEmailMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Verify Email
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
            
            {/* Tabs Card for Edit/Details/Activity */}
            <Card className="md:col-span-2">
              <Tabs defaultValue="details">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>User Information</CardTitle>
                    <TabsList>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Details Tab */}
                  <TabsContent value="details">
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input 
                              id="username" 
                              name="username" 
                              value={formData.username} 
                              onChange={handleInputChange}
                              disabled={!isEditMode}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                              id="email" 
                              name="email" 
                              type="email" 
                              value={formData.email} 
                              onChange={handleInputChange}
                              disabled={!isEditMode}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="role">User Role</Label>
                            <Select 
                              value={formData.role} 
                              onValueChange={(value) => handleSelectChange('role', value)}
                              disabled={!isEditMode}
                            >
                              <SelectTrigger id="role">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Regular User</SelectItem>
                                <SelectItem value="admin">Administrator</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="block mb-2">Email Verification</Label>
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="isEmailVerified" 
                                checked={formData.isEmailVerified} 
                                onCheckedChange={(checked) => handleSwitchChange('isEmailVerified', checked)}
                                disabled={!isEditMode}
                              />
                              <Label htmlFor="isEmailVerified">Email Verified</Label>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Admin Actions</h3>
                          <div className="flex flex-wrap gap-2">
                            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reset User Password</DialogTitle>
                                  <DialogDescription>
                                    Set a new password for this user. The user will be able to log in with this password immediately.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <Label htmlFor="newPassword" className="mb-2 block">New Password</Label>
                                  <Input 
                                    id="newPassword" 
                                    type="password" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="mb-1"
                                  />
                                  <p className="text-xs text-gray-500">Password must be at least 8 characters long.</p>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
                                  <Button 
                                    onClick={handlePasswordReset} 
                                    disabled={resetPasswordMutation.isPending || newPassword.length < 8}
                                  >
                                    {resetPasswordMutation.isPending ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting...
                                      </>
                                    ) : "Reset Password"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    </form>
                  </TabsContent>
                  
                  {/* Subscriptions Tab */}
                  <TabsContent value="subscriptions">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">User Subscriptions</h3>
                      
                      {user.subscriptions && user.subscriptions.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Plan</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Start Date</TableHead>
                              <TableHead>Channel</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {user.subscriptions.map((subscription: any) => (
                              <TableRow key={subscription.id}>
                                <TableCell className="font-medium">
                                  {subscription.planName || "Unknown Plan"}
                                </TableCell>
                                <TableCell>
                                  {subscription.isActive ? (
                                    <Badge className="bg-green-500">Active</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(subscription.createdAt), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell>
                                  {subscription.twitchChannel || "Not set"}
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <RefreshCw className="h-4 w-4" />
                                    <span className="sr-only">View Details</span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-md">
                          <p className="text-gray-500">User has no active subscriptions.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Activity Tab */}
                  <TabsContent value="activity">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Activity Log</h3>
                      
                      {/* Show payment history if available */}
                      <h4 className="font-medium text-gray-700">Payment History</h4>
                      {user.payments && user.payments.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Method</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {user.payments.map((payment: any) => (
                              <TableRow key={payment.id}>
                                <TableCell>
                                  {format(new Date(payment.createdAt), 'PPP')}
                                </TableCell>
                                <TableCell>
                                  ${(payment.amount / 100).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  {payment.status === 'succeeded' ? (
                                    <Badge className="bg-green-500">Successful</Badge>
                                  ) : (
                                    <Badge className="bg-yellow-500">{payment.status}</Badge>
                                  )}
                                </TableCell>
                                <TableCell>{payment.paymentMethod || "Unknown"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-4 bg-gray-50 rounded-md">
                          <p className="text-gray-500">No payment history found.</p>
                        </div>
                      )}
                      
                      {/* Login activity - placeholder for now */}
                      <h4 className="font-medium text-gray-700 mt-6">Login Activity</h4>
                      <div className="text-center py-4 bg-gray-50 rounded-md">
                        <p className="text-gray-500">Login activity data not available.</p>
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
    </AdminLayout>
  );
};

export default UserDetails;