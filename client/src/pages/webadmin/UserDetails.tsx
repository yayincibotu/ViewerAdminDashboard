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
  
  // Extended profile data
  const [profileData, setProfileData] = useState({
    fullName: '',
    phoneNumber: '',
    country: '',
    city: '',
    address: '',
    birthDate: '',
    languagePreference: 'en',
    avatarUrl: '',
  });
  
  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    accountLocked: false,
    ipRestricted: false,
    allowedIps: '',
  });
  
  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailEnabled: true,
    subscriptionAlerts: true,
    promotions: false,
  });
  
  // User statistics
  const [userStats, setUserStats] = useState({
    totalViewers: 0,
    totalSpent: 0,
    activeServices: 0,
  });
  
  // Activity tracking
  const [activityFilter, setActivityFilter] = useState('all');
  const [activitySearch, setActivitySearch] = useState('');
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  
  // Subscription assignment dialog state
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | string>('');
  const [twitchChannel, setTwitchChannel] = useState('');
  const [geoTargeting, setGeoTargeting] = useState('');
  const [subscriptionDuration, setSubscriptionDuration] = useState('monthly');
  const [customDurationDays, setCustomDurationDays] = useState(30);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  
  // Başlangıç ve bitiş tarihleri için state değişkenleri
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>('');
  const [isCustomEndDate, setIsCustomEndDate] = useState(false);
  
  // Subscription edit dialog state
  const [isEditSubDialogOpen, setIsEditSubDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  
  // Fetch subscription plans
  const { data: plans = [] } = useQuery<any[], Error>({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subscription-plans');
      return response.json();
    }
  });
  
  // Fetch user details
  const { data: user, isLoading, error, refetch } = useQuery<any, Error>({
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
          
          // Parse JSON strings to objects if they exist
          try {
            if (data.profileData) {
              const parsedProfile = typeof data.profileData === 'string' 
                ? JSON.parse(data.profileData) 
                : data.profileData;
              
              setProfileData({
                fullName: parsedProfile.fullName || '',
                phoneNumber: parsedProfile.phoneNumber || '',
                country: parsedProfile.country || '',
                city: parsedProfile.city || '',
                address: parsedProfile.address || '',
                birthDate: parsedProfile.birthDate || '',
                languagePreference: parsedProfile.languagePreference || 'en',
                avatarUrl: parsedProfile.avatarUrl || '',
              });
            }
            
            if (data.securitySettings) {
              const parsedSecurity = typeof data.securitySettings === 'string'
                ? JSON.parse(data.securitySettings)
                : data.securitySettings;
                
              setSecuritySettings({
                twoFactorEnabled: parsedSecurity.twoFactorEnabled || false,
                accountLocked: parsedSecurity.accountLocked || false,
                ipRestricted: parsedSecurity.ipRestricted || false,
                allowedIps: parsedSecurity.allowedIps || '',
              });
            }
            
            if (data.notificationPreferences) {
              const parsedNotifications = typeof data.notificationPreferences === 'string'
                ? JSON.parse(data.notificationPreferences)
                : data.notificationPreferences;
                
              setNotificationPrefs({
                emailEnabled: parsedNotifications.emailEnabled ?? true,
                subscriptionAlerts: parsedNotifications.subscriptionAlerts ?? true,
                promotions: parsedNotifications.promotions ?? false,
              });
            }
            
            // Calculate user statistics
            const activeSubscriptions = data.subscriptions?.filter((sub: any) => sub.isActive) || [];
            setUserStats({
              totalViewers: activeSubscriptions.reduce((total: number, sub: any) => total + (sub.planExists ? sub.viewerCount : 0), 0),
              totalSpent: data.payments?.reduce((total: number, payment: any) => total + payment.amount, 0) / 100 || 0,
              activeServices: activeSubscriptions.length,
            });
            
          } catch (e) {
            console.error("Error parsing user JSON data:", e);
          }
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
      profileData?: any;
      securitySettings?: any;
      notificationPreferences?: any;
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
  
  // Add subscription mutation
  const addSubscriptionMutation = useMutation({
    mutationFn: async (data: {
      planId: number | string;
      twitchChannel?: string;
      geographicTargeting?: string;
      startDate?: string;
      endDate?: string;
      discountPercentage?: number;
      paymentStatus?: string;
    }) => {
      const res = await apiRequest('POST', `/api/admin/users/${userId}/subscriptions`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      setIsSubscriptionDialogOpen(false);
      setSelectedPlanId('');
      setTwitchChannel('');
      setGeoTargeting('');
      toast({
        title: 'Subscription added',
        description: 'User subscription has been added successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error adding subscription',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest('PUT', `/api/admin/users/${userId}/subscriptions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      setIsEditSubDialogOpen(false);
      setEditingSubscription(null);
      toast({
        title: 'Subscription updated',
        description: 'User subscription has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating subscription',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const res = await apiRequest('DELETE', `/api/admin/users/${userId}/subscriptions/${subscriptionId}`);
      return res.json();
    },
    onSuccess: () => {
      console.log('Subscription cancelled successfully, refreshing data...');
      
      // Önce cache'i temizle, kesinlikle yeni veri gelsin
      queryClient.removeQueries({ queryKey: [`/api/admin/users/${userId}`] });
      
      // Sonra veriyi yeniden yükle
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      
      // Manuel olarak refetch yap
      if (refetch) {
        setTimeout(() => {
          refetch();
        }, 200); // Kısa bir gecikmeyle yeniden sorgulama yap
      }
      
      toast({
        title: 'Subscription cancelled',
        description: 'User subscription has been cancelled successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Subscription cancellation error:', error);
      toast({
        title: 'Error cancelling subscription',
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
  
  // Fetch activity logs for user
  const fetchActivityLogs = async () => {
    setIsActivityLoading(true);
    try {
      const res = await apiRequest('GET', `/api/admin/users/${userId}/activity`);
      const data = await res.json();
      setActivityLogs(data);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
      toast({
        title: "Error loading activity logs",
        description: "Could not load user activity history",
        variant: 'destructive',
      });
    } finally {
      setIsActivityLoading(false);
    }
  };
  
  // Handle profile data changes
  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle security setting changes
  const handleSecuritySettingChange = (field: string, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle notification preference changes
  const handleNotificationChange = (field: string, value: boolean) => {
    setNotificationPrefs(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle assign subscription with extended options
  const handleAssignSubscription = () => {
    if (!selectedPlanId) {
      toast({
        title: 'Plan seçilmedi',
        description: 'Lütfen bir abonelik planı seçin',
        variant: 'destructive',
      });
      return;
    }
    
    let subscriptionStartDate: Date;
    let subscriptionEndDate: Date;
    
    // Parse start date from input
    if (startDate) {
      subscriptionStartDate = new Date(startDate);
    } else {
      subscriptionStartDate = new Date();
    }
    
    // Handle end date based on selection
    if (isCustomEndDate && endDate) {
      subscriptionEndDate = new Date(endDate);
    } else {
      // Calculate end date based on duration from start date
      subscriptionEndDate = new Date(subscriptionStartDate);
      
      switch (subscriptionDuration) {
        case 'daily':
          subscriptionEndDate.setDate(subscriptionStartDate.getDate() + 1);
          break;
        case 'weekly':
          subscriptionEndDate.setDate(subscriptionStartDate.getDate() + 7);
          break;
        case 'monthly':
          subscriptionEndDate.setMonth(subscriptionStartDate.getMonth() + 1);
          break;
        case 'quarterly':
          subscriptionEndDate.setMonth(subscriptionStartDate.getMonth() + 3);
          break;
        case 'biannual':
          subscriptionEndDate.setMonth(subscriptionStartDate.getMonth() + 6);
          break;
        case 'annual':
          subscriptionEndDate.setFullYear(subscriptionStartDate.getFullYear() + 1);
          break;
        case 'custom':
          if (customDurationDays > 0) {
            subscriptionEndDate.setDate(subscriptionStartDate.getDate() + customDurationDays);
          }
          break;
        default:
          subscriptionEndDate.setMonth(subscriptionStartDate.getMonth() + 1);
      }
    }
    
    // Validate that end date is after start date
    if (subscriptionEndDate <= subscriptionStartDate) {
      toast({
        title: 'Geçersiz tarih aralığı',
        description: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır',
        variant: 'destructive',
      });
      return;
    }
    
    addSubscriptionMutation.mutate({
      planId: selectedPlanId,
      twitchChannel: twitchChannel || undefined,
      geographicTargeting: geoTargeting || undefined,
      startDate: subscriptionStartDate.toISOString(),
      endDate: subscriptionEndDate.toISOString(),
      discountPercentage: discountPercentage > 0 ? discountPercentage : undefined,
      paymentStatus: paymentStatus
    });
  };
  
  // Handle refresh activity logs
  const handleRefreshActivityLogs = () => {
    fetchActivityLogs();
  };
  
  // Filter activity logs based on search and filter
  const filteredActivityLogs = activityLogs.filter(log => {
    // Apply type filter
    if (activityFilter !== 'all' && log.type !== activityFilter) {
      return false;
    }
    
    // Apply search filter
    if (activitySearch && !log.description.toLowerCase().includes(activitySearch.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare the complete user data
    const completeUserData = {
      ...formData,
      profileData: profileData,
      securitySettings: securitySettings,
      notificationPreferences: notificationPrefs
    };
    
    updateUserMutation.mutate(completeUserData);
  };
  
  // Handle password reset
  const handlePasswordReset = () => {
    resetPasswordMutation.mutate({ newPassword });
  };
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading user details...</span>
        </div>
      </AdminLayout>
    );
  }
  
  if (error) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error Loading User</h2>
            <p className="text-gray-600 mb-4">{(error as Error).message}</p>
            <Button onClick={() => navigate('/webadmin/users')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  if (!isLoading && !user) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center p-8">
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
      </AdminLayout>
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
                      <TabsTrigger value="details">Detaylar</TabsTrigger>
                      <TabsTrigger value="profile">Profil</TabsTrigger>
                      <TabsTrigger value="security">Güvenlik</TabsTrigger>
                      <TabsTrigger value="subscriptions">Abonelikler</TabsTrigger>
                      <TabsTrigger value="activity">Aktiviteler</TabsTrigger>
                      <TabsTrigger value="statistics">İstatistikler</TabsTrigger>
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
                  
                  {/* Profile Tab */}
                  <TabsContent value="profile">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Kullanıcı Profil Bilgileri</h3>
                        <Card>
                          <CardContent className="pt-6">
                            <form>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="fullName">Tam Ad</Label>
                                  <Input
                                    id="fullName"
                                    value={profileData.fullName}
                                    onChange={(e) => handleProfileChange('fullName', e.target.value)}
                                    disabled={!isEditMode}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="phoneNumber">Telefon Numarası</Label>
                                  <Input
                                    id="phoneNumber"
                                    value={profileData.phoneNumber}
                                    onChange={(e) => handleProfileChange('phoneNumber', e.target.value)}
                                    disabled={!isEditMode}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="country">Ülke</Label>
                                  <Input
                                    id="country"
                                    value={profileData.country}
                                    onChange={(e) => handleProfileChange('country', e.target.value)}
                                    disabled={!isEditMode}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="city">Şehir</Label>
                                  <Input
                                    id="city"
                                    value={profileData.city}
                                    onChange={(e) => handleProfileChange('city', e.target.value)}
                                    disabled={!isEditMode}
                                  />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label htmlFor="address">Adres</Label>
                                  <Input
                                    id="address"
                                    value={profileData.address}
                                    onChange={(e) => handleProfileChange('address', e.target.value)}
                                    disabled={!isEditMode}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="birthDate">Doğum Tarihi</Label>
                                  <Input
                                    id="birthDate"
                                    type="date"
                                    value={profileData.birthDate}
                                    onChange={(e) => handleProfileChange('birthDate', e.target.value)}
                                    disabled={!isEditMode}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="languagePreference">Dil Tercihi</Label>
                                  <Select
                                    value={profileData.languagePreference}
                                    onValueChange={(value) => handleProfileChange('languagePreference', value)}
                                    disabled={!isEditMode}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Dil seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="en">İngilizce</SelectItem>
                                      <SelectItem value="tr">Türkçe</SelectItem>
                                      <SelectItem value="de">Almanca</SelectItem>
                                      <SelectItem value="fr">Fransızca</SelectItem>
                                      <SelectItem value="es">İspanyolca</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label htmlFor="avatarUrl">Profil Resmi URL</Label>
                                  <Input
                                    id="avatarUrl"
                                    value={profileData.avatarUrl}
                                    onChange={(e) => handleProfileChange('avatarUrl', e.target.value)}
                                    disabled={!isEditMode}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end mt-4">
                                <Button type="button" onClick={handleSaveProfileData} disabled={!isEditMode || updateProfileMutation.isPending}>
                                  {updateProfileMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Kaydediliyor...
                                    </>
                                  ) : 'Profili Kaydet'}
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Bildirim Tercihleri</h3>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">E-posta Bildirimleri</h4>
                                  <p className="text-sm text-gray-500">
                                    Önemli güncellemeler ve bilgilendirmeler için e-posta gönderimi
                                  </p>
                                </div>
                                <Switch 
                                  checked={notificationPrefs.emailEnabled} 
                                  onCheckedChange={(checked) => handleNotificationChange('emailEnabled', checked)}
                                  disabled={!isEditMode}
                                />
                              </div>
                              
                              <Separator />
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">Abonelik Hatırlatmaları</h4>
                                  <p className="text-sm text-gray-500">
                                    Abonelik yenileme, sona erme ve değişiklikler hakkında bildirimler
                                  </p>
                                </div>
                                <Switch 
                                  checked={notificationPrefs.subscriptionAlerts} 
                                  onCheckedChange={(checked) => handleNotificationChange('subscriptionAlerts', checked)}
                                  disabled={!isEditMode}
                                />
                              </div>
                              
                              <Separator />
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">Promosyon Bildirimleri</h4>
                                  <p className="text-sm text-gray-500">
                                    Özel teklifler, indirimler ve promosyonlar hakkında bildirimler
                                  </p>
                                </div>
                                <Switch 
                                  checked={notificationPrefs.promotions} 
                                  onCheckedChange={(checked) => handleNotificationChange('promotions', checked)}
                                  disabled={!isEditMode}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Security Tab */}
                  <TabsContent value="security">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Güvenlik Ayarları</h3>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">İki Faktörlü Doğrulama</h4>
                                  <p className="text-sm text-gray-500">
                                    Kullanıcı hesabına ekstra güvenlik ekler
                                  </p>
                                </div>
                                <Switch 
                                  checked={securitySettings.twoFactorEnabled} 
                                  onCheckedChange={(checked) => handleSecuritySettingChange('twoFactorEnabled', checked)}
                                  disabled={!isEditMode}
                                />
                              </div>
                              
                              <Separator />
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">Hesap Kilidi</h4>
                                  <p className="text-sm text-gray-500">
                                    Kullanıcı hesabını kilitler ve girişleri engeller
                                  </p>
                                </div>
                                <Switch 
                                  checked={securitySettings.accountLocked} 
                                  onCheckedChange={(checked) => handleSecuritySettingChange('accountLocked', checked)}
                                  disabled={!isEditMode}
                                />
                              </div>
                              
                              <Separator />
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">IP Kısıtlaması</h4>
                                  <p className="text-sm text-gray-500">
                                    Sadece belirli IP adreslerinden giriş yapılmasına izin verir
                                  </p>
                                </div>
                                <Switch 
                                  checked={securitySettings.ipRestricted} 
                                  onCheckedChange={(checked) => handleSecuritySettingChange('ipRestricted', checked)}
                                  disabled={!isEditMode}
                                />
                              </div>
                              
                              {securitySettings.ipRestricted && (
                                <div className="space-y-2 mt-2 ml-6">
                                  <Label htmlFor="allowedIps">İzin Verilen IP'ler</Label>
                                  <Input 
                                    id="allowedIps" 
                                    value={securitySettings.allowedIps || ''}
                                    onChange={(e) => handleSecuritySettingChange('allowedIps', e.target.value)}
                                    placeholder="Virgülle ayırarak IP adresleri girin"
                                    disabled={!isEditMode}
                                  />
                                  <p className="text-xs text-gray-500">Örnek: 192.168.1.1, 10.0.0.1</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Oturum Geçmişi</h3>
                        <Card>
                          <CardContent className="pt-6">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Tarih</TableHead>
                                  <TableHead>IP Adresi</TableHead>
                                  <TableHead>Tarayıcı</TableHead>
                                  <TableHead>Durum</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {user?.sessionHistory?.map((session: any, index: number) => (
                                  <TableRow key={index}>
                                    <TableCell>{format(new Date(session.timestamp), 'PPP HH:mm')}</TableCell>
                                    <TableCell>{session.ipAddress}</TableCell>
                                    <TableCell>{session.userAgent}</TableCell>
                                    <TableCell>
                                      {session.successful ? (
                                        <Badge className="bg-green-500">Başarılı</Badge>
                                      ) : (
                                        <Badge className="bg-red-500">Başarısız</Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {(!user?.sessionHistory || user.sessionHistory.length === 0) && (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                      Oturum geçmişi bulunamadı
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Subscriptions Tab */}
                  <TabsContent value="subscriptions">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">User Subscriptions</h3>
                        <Button 
                          onClick={() => setIsSubscriptionDialogOpen(true)}
                          size="sm"
                        >
                          Assign Subscription
                        </Button>
                      </div>
                      
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
                                  {subscription.planExists ? (
                                    subscription.planName
                                  ) : (
                                    <span className="flex items-center text-amber-600">
                                      <AlertTriangle className="h-4 w-4 mr-1" />
                                      {subscription.planName} 
                                      <Badge variant="outline" className="ml-2 text-xs bg-amber-100">Plan Removed</Badge>
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {subscription.isActive ? (
                                    <div className="flex items-center">
                                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                      <Badge className="bg-green-500">Active</Badge>
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                                      <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(subscription.startDate || subscription.createdAt), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell>
                                  {subscription.twitchChannel || "Not set"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => {
                                        setEditingSubscription(subscription);
                                        setIsEditSubDialogOpen(true);
                                      }}
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                      <span className="sr-only">Edit</span>
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0 text-red-500"
                                      onClick={() => {
                                        const planStatus = subscription.planExists ? 
                                          '' : 
                                          '\n\nWarning: This subscription has a removed plan. Cancelling is recommended.';
                                        
                                        if (window.confirm(`Are you sure you want to cancel this subscription?${planStatus}`)) {
                                          cancelSubscriptionMutation.mutate(subscription.id);
                                        }
                                      }}
                                    >
                                      <XCircle className="h-4 w-4" />
                                      <span className="sr-only">Cancel</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-md">
                          <p className="text-gray-500">User has no active subscriptions.</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-4"
                            onClick={() => setIsSubscriptionDialogOpen(true)}
                          >
                            Assign Plan
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Add Subscription Dialog */}
                    <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Subscription Plan</DialogTitle>
                          <DialogDescription>
                            Assign a subscription plan to {user?.username}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="plan">Abonelik Planı</Label>
                            <Select 
                              value={selectedPlanId.toString()} 
                              onValueChange={(value) => setSelectedPlanId(parseInt(value))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Plan seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {plans.map((plan: any) => (
                                  <SelectItem key={plan.id} value={plan.id.toString()}>
                                    {plan.name} - ${plan.price}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                              <Input 
                                id="startDate" 
                                type="date"
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="endDate">Bitiş Tarihi</Label>
                                <div className="flex items-center space-x-2">
                                  <Switch 
                                    id="customEndDate"
                                    checked={isCustomEndDate}
                                    onCheckedChange={setIsCustomEndDate}
                                  />
                                  <Label htmlFor="customEndDate" className="text-xs">
                                    Özel Tarih
                                  </Label>
                                </div>
                              </div>
                              {isCustomEndDate ? (
                                <Input 
                                  id="endDate" 
                                  type="date"
                                  value={endDate} 
                                  onChange={(e) => setEndDate(e.target.value)}
                                />
                              ) : (
                                <Select 
                                  value={subscriptionDuration} 
                                  onValueChange={setSubscriptionDuration}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Süre seçin" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="daily">Günlük</SelectItem>
                                    <SelectItem value="weekly">Haftalık</SelectItem>
                                    <SelectItem value="monthly">Aylık</SelectItem>
                                    <SelectItem value="quarterly">3 Aylık</SelectItem>
                                    <SelectItem value="biannual">6 Aylık</SelectItem>
                                    <SelectItem value="annual">Yıllık</SelectItem>
                                    <SelectItem value="custom">Özel</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </div>
                          
                          {subscriptionDuration === 'custom' && !isCustomEndDate && (
                            <div className="space-y-2">
                              <Label htmlFor="customDurationDays">Özel Süre (Gün)</Label>
                              <Input 
                                id="customDurationDays" 
                                type="number"
                                min="1"
                                value={customDurationDays.toString()} 
                                onChange={(e) => setCustomDurationDays(parseInt(e.target.value))}
                              />
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Label htmlFor="discountPercentage">İndirim Oranı (%)</Label>
                            <Input 
                              id="discountPercentage" 
                              type="number"
                              min="0"
                              max="100"
                              value={discountPercentage.toString()} 
                              onChange={(e) => setDiscountPercentage(parseInt(e.target.value))}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="twitchChannel">Twitch Kanalı</Label>
                            <Input 
                              id="twitchChannel" 
                              value={twitchChannel} 
                              onChange={(e) => setTwitchChannel(e.target.value)}
                              placeholder="Twitch kanal adını girin"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="geoTargeting">Coğrafi Hedefleme</Label>
                            <Input 
                              id="geoTargeting" 
                              value={geoTargeting} 
                              onChange={(e) => setGeoTargeting(e.target.value)}
                              placeholder="örn. US,CA,UK"
                            />
                            <p className="text-sm text-gray-500">Virgülle ayrılmış ülke kodları</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="paymentStatus">Ödeme Durumu</Label>
                            <Select 
                              value={paymentStatus} 
                              onValueChange={setPaymentStatus}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Durum seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Beklemede</SelectItem>
                                <SelectItem value="paid">Ödenmiş</SelectItem>
                                <SelectItem value="free">Ücretsiz</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsSubscriptionDialogOpen(false)}
                          >
                            İptal
                          </Button>
                          <Button 
                            onClick={handleAssignSubscription}
                            disabled={addSubscriptionMutation.isPending}
                          >
                            {addSubscriptionMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Atanıyor...
                              </>
                            ) : 'Planı Ata'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Edit Subscription Dialog */}
                    <Dialog open={isEditSubDialogOpen} onOpenChange={setIsEditSubDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Subscription</DialogTitle>
                          <DialogDescription>
                            Update subscription details
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {editingSubscription && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="editTwitchChannel">Twitch Channel</Label>
                                <Input 
                                  id="editTwitchChannel" 
                                  value={editingSubscription.twitchChannel || ''}
                                  onChange={(e) => setEditingSubscription({
                                    ...editingSubscription,
                                    twitchChannel: e.target.value
                                  })}
                                  placeholder="Enter Twitch channel name"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="editGeoTargeting">Geographic Targeting</Label>
                                <Input 
                                  id="editGeoTargeting" 
                                  value={editingSubscription.geographicTargeting || ''}
                                  onChange={(e) => setEditingSubscription({
                                    ...editingSubscription,
                                    geographicTargeting: e.target.value
                                  })}
                                  placeholder="e.g. US,CA,UK"
                                />
                                <p className="text-sm text-gray-500">Comma-separated country codes</p>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Switch 
                                    id="isActive" 
                                    checked={editingSubscription.isActive} 
                                    onCheckedChange={(checked) => setEditingSubscription({
                                      ...editingSubscription,
                                      isActive: checked
                                    })}
                                  />
                                  <Label htmlFor="isActive">Active</Label>
                                </div>
                                <p className="text-sm text-gray-500">
                                  Toggle to activate or deactivate this subscription
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="editStatus">Status</Label>
                                <Select 
                                  value={editingSubscription.status || 'active'} 
                                  onValueChange={(value) => setEditingSubscription({
                                    ...editingSubscription,
                                    status: value
                                  })}
                                >
                                  <SelectTrigger id="editStatus">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsEditSubDialogOpen(false);
                              setEditingSubscription(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => {
                              if (editingSubscription) {
                                updateSubscriptionMutation.mutate({
                                  id: editingSubscription.id,
                                  data: {
                                    twitchChannel: editingSubscription.twitchChannel,
                                    geographicTargeting: editingSubscription.geographicTargeting,
                                    isActive: editingSubscription.isActive,
                                    status: editingSubscription.status
                                  }
                                });
                              }
                            }}
                            disabled={updateSubscriptionMutation.isPending}
                          >
                            {updateSubscriptionMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                              </>
                            ) : 'Update Subscription'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TabsContent>
                  
                  {/* Activity Tab */}
                  <TabsContent value="activity">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Kullanıcı Aktiviteleri</h3>
                        <div className="flex space-x-2">
                          <Select value={activityFilter} onValueChange={setActivityFilter}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filtrele" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tüm Aktiviteler</SelectItem>
                              <SelectItem value="payments">Ödemeler</SelectItem>
                              <SelectItem value="logins">Oturumlar</SelectItem>
                              <SelectItem value="subscriptions">Abonelikler</SelectItem>
                              <SelectItem value="services">Servis Kullanımı</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input 
                            placeholder="Ara..." 
                            value={activitySearch} 
                            onChange={(e) => setActivitySearch(e.target.value)}
                            className="max-w-[200px]"
                          />
                        </div>
                      </div>
                      
                      {/* Payment History Section */}
                      {(activityFilter === 'all' || activityFilter === 'payments') && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium">Ödeme Geçmişi</CardTitle>
                            <CardDescription>Kullanıcının tüm ödeme işlemleri</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {user.payments && user.payments.length > 0 ? (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Tutar</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead>Ödeme Yöntemi</TableHead>
                                    <TableHead>Fatura</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {user.payments.map((payment: any) => (
                                    <TableRow key={payment.id}>
                                      <TableCell>
                                        {format(new Date(payment.createdAt), 'dd MMM yyyy HH:mm')}
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        ${(payment.amount / 100).toFixed(2)}
                                      </TableCell>
                                      <TableCell>
                                        <Badge className={
                                          payment.status === 'succeeded' ? 'bg-green-500' : 
                                          payment.status === 'pending' ? 'bg-amber-500' : 
                                          'bg-red-500'
                                        }>
                                          {payment.status === 'succeeded' ? 'Başarılı' : 
                                           payment.status === 'pending' ? 'Beklemede' : 
                                           payment.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {payment.paymentMethod === 'card' ? 'Kredi Kartı' :
                                         payment.paymentMethod === 'crypto' ? 'Kripto Para' :
                                         payment.paymentMethod || "Bilinmiyor"}
                                      </TableCell>
                                      <TableCell>
                                        <Button variant="outline" size="sm">
                                          <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                          </svg>
                                          Görüntüle
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-md">
                                <p className="text-gray-500">Ödeme geçmişi bulunamadı.</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Login History Section */}
                      {(activityFilter === 'all' || activityFilter === 'logins') && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium">Oturum Geçmişi</CardTitle>
                            <CardDescription>Kullanıcının giriş aktiviteleri</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {user.sessionHistory && user.sessionHistory.length > 0 ? (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Tarih & Saat</TableHead>
                                    <TableHead>IP Adresi</TableHead>
                                    <TableHead>Tarayıcı / Cihaz</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead>Lokasyon</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {user.sessionHistory.map((session: any, index: number) => (
                                    <TableRow key={index}>
                                      <TableCell>{format(new Date(session.timestamp), 'dd MMM yyyy HH:mm')}</TableCell>
                                      <TableCell>{session.ipAddress}</TableCell>
                                      <TableCell>{session.userAgent}</TableCell>
                                      <TableCell>
                                        <Badge className={session.successful ? 'bg-green-500' : 'bg-red-500'}>
                                          {session.successful ? 'Başarılı' : 'Başarısız'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>{session.location || 'Bilinmiyor'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-md">
                                <p className="text-gray-500">Oturum geçmişi bulunamadı.</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Subscription History Section */}
                      {(activityFilter === 'all' || activityFilter === 'subscriptions') && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium">Abonelik Geçmişi</CardTitle>
                            <CardDescription>Kullanıcının abonelik değişiklikleri</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {user.subscriptions && user.subscriptions.length > 0 ? (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Abonelik</TableHead>
                                    <TableHead>İşlem</TableHead>
                                    <TableHead>Durum</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {user.subscriptions.map((sub: any) => (
                                    <TableRow key={sub.id}>
                                      <TableCell>{format(new Date(sub.createdAt), 'dd MMM yyyy')}</TableCell>
                                      <TableCell className="font-medium">{sub.plan?.name || 'Silinmiş Plan'}</TableCell>
                                      <TableCell>Abonelik Başlangıcı</TableCell>
                                      <TableCell>
                                        <Badge className={
                                          sub.status === 'active' ? 'bg-green-500' : 
                                          sub.status === 'cancelled' ? 'bg-amber-500' : 
                                          'bg-slate-500'
                                        }>
                                          {sub.status === 'active' ? 'Aktif' : 
                                           sub.status === 'cancelled' ? 'İptal Edildi' : 
                                           sub.status}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-md">
                                <p className="text-gray-500">Abonelik geçmişi bulunamadı.</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Service Usage Section */}
                      {(activityFilter === 'all' || activityFilter === 'services') && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium">Servis Kullanım Geçmişi</CardTitle>
                            <CardDescription>Kullanıcının servis kullanım aktiviteleri</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {activityLogs && activityLogs.length > 0 ? (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Tarih & Saat</TableHead>
                                    <TableHead>Servis</TableHead>
                                    <TableHead>Aktivite</TableHead>
                                    <TableHead>Değişiklik</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {activityLogs.map((log: any, index: number) => (
                                    <TableRow key={index}>
                                      <TableCell>{format(new Date(log.timestamp), 'dd MMM yyyy HH:mm')}</TableCell>
                                      <TableCell>{log.service}</TableCell>
                                      <TableCell>{log.activity}</TableCell>
                                      <TableCell>{log.details}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-md">
                                <p className="text-gray-500">Servis kullanım geçmişi bulunamadı.</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Pagination Controls */}
                      {activityLogs && activityLogs.length > 0 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* Previous page logic */}}
                            disabled={true}
                          >
                            Önceki
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* Next page logic */}}
                            disabled={true}
                          >
                            Sonraki
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Statistics Tab */}
                  <TabsContent value="statistics">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Kullanıcı İstatistikleri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
                            <CardContent className="pt-6">
                              <div className="flex flex-col items-center">
                                <h4 className="text-lg font-semibold text-slate-500 dark:text-slate-400">Toplam İzleyici</h4>
                                <p className="text-3xl font-bold mt-2">{userStats.totalViewers.toLocaleString()}</p>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
                            <CardContent className="pt-6">
                              <div className="flex flex-col items-center">
                                <h4 className="text-lg font-semibold text-slate-500 dark:text-slate-400">Toplam Harcama</h4>
                                <p className="text-3xl font-bold mt-2">{userStats.totalSpent.toLocaleString()} ₺</p>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900">
                            <CardContent className="pt-6">
                              <div className="flex flex-col items-center">
                                <h4 className="text-lg font-semibold text-slate-500 dark:text-slate-400">Aktif Servisler</h4>
                                <p className="text-3xl font-bold mt-2">{userStats.activeServices}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Aylık Harcama</h3>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="h-72">
                              {/* This is where we'd add a recharts BarChart, but for now keeping as placeholder */}
                              <div className="flex flex-col items-center justify-center h-full">
                                <p className="text-slate-500 dark:text-slate-400">
                                  Aylık harcama verileri grafiği burada gösterilecek
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Abonelik Kullanım Özeti</h3>
                        <Card>
                          <CardContent className="pt-6">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Servis</TableHead>
                                  <TableHead>Kullanılan</TableHead>
                                  <TableHead>Limit</TableHead>
                                  <TableHead>Durum</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell className="font-medium">Twitch İzleyici</TableCell>
                                  <TableCell>105</TableCell>
                                  <TableCell>250</TableCell>
                                  <TableCell>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '42%' }}></div>
                                    </div>
                                    <span className="text-xs text-slate-500 mt-1">42%</span>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Twitch Chat</TableCell>
                                  <TableCell>68</TableCell>
                                  <TableCell>100</TableCell>
                                  <TableCell>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                      <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '68%' }}></div>
                                    </div>
                                    <span className="text-xs text-slate-500 mt-1">68%</span>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Kick İzleyici</TableCell>
                                  <TableCell>0</TableCell>
                                  <TableCell>50</TableCell>
                                  <TableCell>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                      <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: '0%' }}></div>
                                    </div>
                                    <span className="text-xs text-slate-500 mt-1">0%</span>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
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