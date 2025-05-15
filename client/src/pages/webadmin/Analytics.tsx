import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, RefreshCw, Calendar, ArrowRight, ArrowUpRight, ArrowDownRight, Users, CreditCard, Activity, Shield, AlertTriangle, Check, X } from 'lucide-react';
import AdminLayout from '@/components/dashboard/AdminLayout';
import AdminHeader from '@/components/dashboard/AdminHeader';
import { apiRequest } from '@/lib/queryClient';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { UserAnalytics, SubscriptionAnalytics, FinancialAnalytics, PerformanceMetrics, LoginAttempt, Session, LockedAccount } from '@shared/schema';

// Helper function to format date for display
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString();
};

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

// User Analytics Dashboard
const UserAnalyticsDashboard: React.FC<{startDate: Date, endDate: Date}> = ({ startDate, endDate }) => {
  const {
    data: analytics = [],
    isLoading,
    refetch
  } = useQuery<UserAnalytics[]>({
    queryKey: ['/api/admin/analytics/users', { startDate, endDate }],
    queryFn: async () => {
      const res = await apiRequest(
        'GET',
        `/api/admin/analytics/users?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      return res.json();
    }
  });
  
  // Calculate summary statistics
  const totalActiveUsers = analytics.length > 0 ? analytics[analytics.length - 1].activeUsers : 0;
  const totalNewUsers = analytics.reduce((sum, item) => sum + item.newUsers, 0);
  const averageEngagementRate = analytics.reduce((sum, item) => sum + item.engagementRate, 0) / (analytics.length || 1);
  
  // Calculate growth
  const growth = analytics.length > 1 
    ? ((analytics[analytics.length - 1].totalUsers - analytics[0].totalUsers) / analytics[0].totalUsers) * 100
    : 0;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">{totalActiveUsers.toLocaleString()}</div>
              <div className={`flex items-center text-sm ${growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {growth >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                {Math.abs(growth).toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalNewUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              During selected period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageEngagementRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>User Growth Trend</CardTitle>
          <CardDescription>
            Total and active users over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-80">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={analytics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString(), '']}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalUsers" 
                  stroke="#8884d8" 
                  name="Total Users" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="activeUsers" 
                  stroke="#82ca9d" 
                  name="Active Users"
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New User Registrations</CardTitle>
            <CardDescription>
              Daily new user sign-ups
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-80">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [value.toLocaleString(), 'New Users']}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Bar dataKey="newUsers" fill="#8884d8" name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>
              Engagement rate percentage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-80">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Engagement Rate']}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="engagementRate" 
                    stroke="#82ca9d" 
                    name="Engagement Rate"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Subscription Analytics Dashboard
const SubscriptionAnalyticsDashboard: React.FC<{startDate: Date, endDate: Date}> = ({ startDate, endDate }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  
  const {
    data: analytics = [],
    isLoading,
    refetch
  } = useQuery<SubscriptionAnalytics[]>({
    queryKey: ['/api/admin/analytics/subscriptions', { startDate, endDate, planId: selectedPlan }],
    queryFn: async () => {
      let url = `/api/admin/analytics/subscriptions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      
      if (selectedPlan !== 'all') {
        url += `&planId=${selectedPlan}`;
      }
      
      const res = await apiRequest('GET', url);
      return res.json();
    }
  });
  
  const {
    data: plans = [],
    isLoading: plansLoading
  } = useQuery<{id: number, name: string}[]>({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/subscription-plans');
      return res.json();
    }
  });
  
  // Calculate summary statistics
  const totalActiveSubscriptions = analytics.length > 0 
    ? analytics[analytics.length - 1].activeSubscriptions 
    : 0;
  
  const totalNewSubscriptions = analytics.reduce((sum, item) => sum + item.newSubscriptions, 0);
  const totalCanceledSubscriptions = analytics.reduce((sum, item) => sum + item.canceledSubscriptions, 0);
  
  // Calculate churn rate
  const churnRate = analytics.reduce((sum, item) => sum + item.churnRate, 0) / (analytics.length || 1);
  
  // Calculate renewal rate
  const renewalRate = analytics.reduce((sum, item) => sum + item.renewalRate, 0) / (analytics.length || 1);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Subscription Analytics</h2>
        <div className="flex space-x-2">
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {plans.map(plan => (
                <SelectItem key={plan.id} value={plan.id.toString()}>{plan.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalActiveSubscriptions.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalNewSubscriptions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              During selected period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Canceled Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCanceledSubscriptions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              During selected period
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Churn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{churnRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average over selected period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Renewal Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{renewalRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average over selected period
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Subscription Trends</CardTitle>
          <CardDescription>
            Active, new and canceled subscriptions over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-80">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={analytics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString(), '']}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="activeSubscriptions" 
                  stroke="#8884d8" 
                  name="Active" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="newSubscriptions" 
                  stroke="#82ca9d" 
                  name="New"
                  strokeWidth={2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="canceledSubscriptions" 
                  stroke="#ff7300" 
                  name="Canceled"
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Churn & Renewal Rates</CardTitle>
          <CardDescription>
            Subscription health indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-80">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={analytics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="churnRate" 
                  stroke="#ff7300" 
                  name="Churn Rate" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="renewalRate" 
                  stroke="#82ca9d" 
                  name="Renewal Rate"
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Security Analytics Dashboard
const SecurityAnalyticsDashboard: React.FC<{startDate: Date, endDate: Date}> = ({ startDate, endDate }) => {
  const [activeTab, setActiveTab] = useState<string>("login-attempts");
  const [usernameFilter, setUsernameFilter] = useState<string>("");
  const { toast } = useToast();
  
  // Login Attempts
  const {
    data: loginAttempts = [],
    isLoading: isLoadingLoginAttempts,
    refetch: refetchLoginAttempts
  } = useQuery<LoginAttempt[]>({
    queryKey: ['/api/admin/security/login-attempts', { limit: 100, username: usernameFilter }],
    queryFn: async () => {
      let url = `/api/admin/security/login-attempts?limit=100`;
      
      if (usernameFilter) {
        url += `&username=${encodeURIComponent(usernameFilter)}`;
      }
      
      const res = await apiRequest('GET', url);
      return res.json();
    }
  });
  
  // Active Sessions
  const {
    data: activeSessions = [],
    isLoading: isLoadingSessions,
    refetch: refetchSessions
  } = useQuery<Session[]>({
    queryKey: ['/api/admin/security/active-sessions'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/security/active-sessions');
      return res.json();
    },
    enabled: activeTab === "sessions"
  });
  
  // Locked Accounts
  const {
    data: lockedAccounts = [],
    isLoading: isLoadingLockedAccounts,
    refetch: refetchLockedAccounts
  } = useQuery<LockedAccount[]>({
    queryKey: ['/api/admin/security/locked-accounts'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/security/locked-accounts');
      return res.json();
    },
    enabled: activeTab === "locked-accounts"
  });
  
  // Terminate session mutation
  const terminateSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      await apiRequest('POST', `/api/admin/security/terminate-session/${sessionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Session terminated",
        description: "The session has been successfully terminated",
      });
      refetchSessions();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to terminate session: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Unlock account mutation
  const unlockAccountMutation = useMutation({
    mutationFn: async (username: string) => {
      await apiRequest('POST', `/api/admin/security/unlock-account`, { username });
    },
    onSuccess: () => {
      toast({
        title: "Account unlocked",
        description: "The account has been successfully unlocked",
      });
      refetchLockedAccounts();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to unlock account: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Calculate login statistics
  const totalAttempts = loginAttempts.length;
  const successfulAttempts = loginAttempts.filter(attempt => attempt.success).length;
  const failedAttempts = totalAttempts - successfulAttempts;
  
  // Group by IP address
  const ipAddresses = loginAttempts.reduce((acc, attempt) => {
    if (attempt.ipAddress) {
      acc[attempt.ipAddress] = (acc[attempt.ipAddress] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  // Sort IP addresses by number of attempts (descending)
  const topIpAddresses = Object.entries(ipAddresses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Format date for session expiry display
  const formatExpiry = (expiryDate: string | Date) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    
    if (expiry < now) {
      return "Expired";
    }
    
    const diffMs = expiry.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} left`;
    }
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} left`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
  };

  // Handle session termination confirmation
  const handleTerminateSession = (sessionId: number) => {
    if (confirm("Are you sure you want to terminate this session?")) {
      terminateSessionMutation.mutate(sessionId);
    }
  };
  
  // Handle account unlock confirmation
  const handleUnlockAccount = (username: string) => {
    if (confirm(`Are you sure you want to unlock the account for ${username}?`)) {
      unlockAccountMutation.mutate(username);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Security Analytics</h2>
        
        <div className="flex space-x-2">
          {activeTab === "login-attempts" && (
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by username"
                className="h-10 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={usernameFilter}
                onChange={(e) => setUsernameFilter(e.target.value)}
              />
              {usernameFilter && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setUsernameFilter("")}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => {
              if (activeTab === "login-attempts") refetchLoginAttempts();
              if (activeTab === "sessions") refetchSessions();
              if (activeTab === "locked-accounts") refetchLockedAccounts();
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="login-attempts" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="login-attempts" className="flex items-center gap-2">
            <KeyRound size={16} />
            Login Attempts
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Users size={16} />
            Active Sessions
          </TabsTrigger>
          <TabsTrigger value="locked-accounts" className="flex items-center gap-2">
            <Lock size={16} />
            Locked Accounts
          </TabsTrigger>
        </TabsList>
        
        {/* Login Attempts Tab */}
        <TabsContent value="login-attempts" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Login Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalAttempts}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Successful Logins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-green-600">{successfulAttempts}</div>
                  <div className="ml-2 text-sm text-muted-foreground">
                    ({totalAttempts > 0 ? ((successfulAttempts / totalAttempts) * 100).toFixed(1) : 0}%)
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Failed Logins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-red-600">{failedAttempts}</div>
                  <div className="ml-2 text-sm text-muted-foreground">
                    ({totalAttempts > 0 ? ((failedAttempts / totalAttempts) * 100).toFixed(1) : 0}%)
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top IP Addresses</CardTitle>
                <CardDescription>
                  IP addresses with the most login attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingLoginAttempts ? (
                  <div className="flex justify-center items-center h-64">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : topIpAddresses.length > 0 ? (
                  <div className="space-y-2">
                    {topIpAddresses.map(([ip, count]) => (
                      <div key={ip} className="flex justify-between items-center p-2 rounded bg-muted">
                        <span className="font-mono">{ip}</span>
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-xs font-semibold">
                          {count} attempts
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-64 text-muted-foreground">
                    No IP address data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Success/Failure Rate</CardTitle>
                <CardDescription>
                  Ratio of successful to failed login attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingLoginAttempts ? (
                  <div className="flex justify-center items-center h-64">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : totalAttempts > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Successful', value: successfulAttempts },
                          { name: 'Failed', value: failedAttempts }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, 'Attempts']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-64 text-muted-foreground">
                    No login attempts data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Login Attempts</CardTitle>
              <CardDescription>
                Recent login activity with status and details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLoginAttempts ? (
                <div className="flex justify-center items-center h-64">
                  <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : loginAttempts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Timestamp</th>
                        <th className="text-left py-3 px-4">Username</th>
                        <th className="text-left py-3 px-4">IP Address</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginAttempts.map((attempt, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                          <td className="py-2 px-4">{formatTimestamp(attempt.timestamp)}</td>
                          <td className="py-2 px-4 font-medium">{attempt.username}</td>
                          <td className="py-2 px-4 font-mono text-xs">{attempt.ipAddress || 'N/A'}</td>
                          <td className="py-2 px-4">
                            {attempt.success ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                <Check size={12} className="mr-1" />
                                Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                <X size={12} className="mr-1" />
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-muted-foreground">
                            {attempt.failureReason || (attempt.success ? 'Authentication successful' : 'N/A')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex justify-center items-center h-64 text-muted-foreground">
                  No login attempts data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Active Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeSessions.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Unique Users with Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {new Set(activeSessions.map(session => session.userId)).size}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Sessions Per User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {activeSessions.length > 0 
                    ? (activeSessions.length / new Set(activeSessions.map(session => session.userId)).size).toFixed(1) 
                    : '0'}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Active User Sessions</CardTitle>
              <CardDescription>
                Manage active sessions across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="flex justify-center items-center h-64">
                  <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : activeSessions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">User</th>
                        <th className="text-left py-3 px-4">Device / Browser</th>
                        <th className="text-left py-3 px-4">IP Address</th>
                        <th className="text-left py-3 px-4">Last Activity</th>
                        <th className="text-left py-3 px-4">Expires</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSessions.map((session) => (
                        <tr key={session.id} className="border-b border-muted">
                          <td className="py-3 px-4">
                            <div className="font-medium">{session.username || `User ID: ${session.userId}`}</div>
                          </td>
                          <td className="py-3 px-4 max-w-[200px] truncate" title={session.userAgent || ''}>
                            {session.userAgent || 'Unknown'}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">
                            {session.ipAddress || 'Unknown'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {session.lastActive 
                              ? formatTimestamp(session.lastActive)
                              : 'No activity recorded'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <Badge 
                                variant={
                                  new Date(session.expiresAt) < new Date() ? "destructive" : 
                                  new Date(session.expiresAt) < new Date(Date.now() + 60 * 60 * 1000) ? "outline" : "default"
                                }
                                className="text-xs"
                              >
                                {formatExpiry(session.expiresAt)}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleTerminateSession(session.id)}
                              disabled={terminateSessionMutation.isPending}
                            >
                              {terminateSessionMutation.isPending ? (
                                <LoaderCircle className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <LogOut className="h-3 w-3 mr-1" />
                              )}
                              Terminate
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex justify-center items-center h-64 text-muted-foreground">
                  No active sessions found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Locked Accounts Tab */}
        <TabsContent value="locked-accounts" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Locked Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{lockedAccounts.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total accounts currently locked
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Failed Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {lockedAccounts.length > 0 
                    ? (lockedAccounts.reduce((sum, account) => sum + account.failedAttempts, 0) / lockedAccounts.length).toFixed(1) 
                    : '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Before account lockout
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Lockout Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {lockedAccounts.filter(a => a.unlockAt === null).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Manual unlock required
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Visualization for Locked Account Status */}
          {lockedAccounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lockout Severity</CardTitle>
                <CardDescription>
                  Distribution of account lockouts by failed attempt count
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: '3-5 attempts', value: lockedAccounts.filter(a => a.failedAttempts >= 3 && a.failedAttempts <= 5).length },
                          { name: '6-10 attempts', value: lockedAccounts.filter(a => a.failedAttempts > 5 && a.failedAttempts <= 10).length },
                          { name: '10+ attempts', value: lockedAccounts.filter(a => a.failedAttempts > 10).length }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {lockedAccounts.length > 0 && [
                          <Cell key="cell-0" fill="#FFC107" />,
                          <Cell key="cell-1" fill="#FF5722" />,
                          <Cell key="cell-2" fill="#F44336" />
                        ]}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} account(s)`, '']} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Account Lockouts</CardTitle>
                  <CardDescription>
                    Accounts that have been locked due to suspicious activity
                  </CardDescription>
                </div>
                {lockedAccounts.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Select 
                      value={usernameFilter} 
                      onValueChange={setUsernameFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Accounts</SelectItem>
                        <SelectItem value="auto">Auto Unlock</SelectItem>
                        <SelectItem value="manual">Manual Unlock Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingLockedAccounts ? (
                <div className="flex justify-center items-center h-64">
                  <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : lockedAccounts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Username</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Last Failed IP</th>
                        <th className="text-left py-3 px-4">Failed Attempts</th>
                        <th className="text-left py-3 px-4">Locked At</th>
                        <th className="text-left py-3 px-4">Auto Unlock At</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lockedAccounts
                        .filter(account => {
                          if (!usernameFilter) return true;
                          if (usernameFilter === 'auto') return account.unlockAt !== null;
                          if (usernameFilter === 'manual') return account.unlockAt === null;
                          return true;
                        })
                        .map((account) => (
                        <tr key={account.id} className="border-b border-muted">
                          <td className="py-3 px-4 font-medium">{account.username}</td>
                          <td className="py-3 px-4">{account.email || 'N/A'}</td>
                          <td className="py-3 px-4 font-mono text-xs">{account.lastFailedIp || 'Unknown'}</td>
                          <td className="py-3 px-4">
                            <Badge variant={
                              account.failedAttempts > 10 ? "destructive" : 
                              account.failedAttempts > 5 ? "outline" : "secondary"
                            }>
                              {account.failedAttempts} failed
                            </Badge>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {formatTimestamp(account.lockedAt)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {account.unlockAt ? (
                              <div className="flex items-center">
                                <span>{formatTimestamp(account.unlockAt)}</span>
                                <HoverCard>
                                  <HoverCardTrigger>
                                    <Info size={14} className="ml-1 text-muted-foreground" />
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-80">
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-semibold">Auto Unlock Information</h4>
                                      <p className="text-sm">
                                        This account will be automatically unlocked at the specified time based on your security settings.
                                      </p>
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="text-red-500">Manual unlock only</span>
                                <HoverCard>
                                  <HoverCardTrigger>
                                    <AlertCircle size={14} className="ml-1 text-red-500" />
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-80">
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-semibold">Manual Intervention Required</h4>
                                      <p className="text-sm">
                                        This account has been permanently locked due to suspicious activity and requires administrator approval to unlock.
                                      </p>
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => handleUnlockAccount(account.username)}
                              disabled={unlockAccountMutation.isPending}
                            >
                              {unlockAccountMutation.isPending ? (
                                <LoaderCircle className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Unlock className="h-3 w-3 mr-1" />
                              )}
                              Unlock
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center h-64 text-muted-foreground">
                  <Lock className="h-12 w-12 mb-4 text-muted" />
                  <p>No locked accounts found</p>
                  <p className="text-xs mt-2">All user accounts are currently accessible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const FinancialAnalyticsDashboard: React.FC<{startDate: Date, endDate: Date}> = ({ startDate, endDate }) => {
  const {
    data: analytics = [],
    isLoading,
    refetch
  } = useQuery<FinancialAnalytics[]>({
    queryKey: ['/api/admin/analytics/financial', { startDate, endDate }],
    queryFn: async () => {
      const res = await apiRequest(
        'GET',
        `/api/admin/analytics/financial?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      return res.json();
    }
  });
  
  // Calculate summary statistics
  const totalRevenue = analytics.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = analytics.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = analytics.reduce((sum, item) => sum + item.profit, 0);
  
  // Calculate MRR and growth
  const latestMRR = analytics.length > 0 ? analytics[analytics.length - 1].mrr : 0;
  const firstMRR = analytics.length > 0 ? analytics[0].mrr : 0;
  const mrrGrowth = firstMRR > 0 ? ((latestMRR - firstMRR) / firstMRR) * 100 : 0;
  
  // Calculate ARPU
  const averageArpu = analytics.reduce((sum, item) => sum + item.averageRevenuePerUser, 0) / (analytics.length || 1);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              During selected period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              During selected period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <div className="text-3xl font-bold">{formatCurrency(totalProfit)}</div>
              <div className="ml-2 text-sm text-muted-foreground">
                ({((totalProfit / totalRevenue) * 100).toFixed(1)}% margin)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Recurring Revenue (MRR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">{formatCurrency(latestMRR)}</div>
              <div className={`flex items-center text-sm ${mrrGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {mrrGrowth >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                {Math.abs(mrrGrowth).toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Revenue Per User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(averageArpu)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average over selected period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Latest Sales
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-4 py-2 border-b text-xs font-medium text-muted-foreground">
              Today
            </div>
            {isLoading ? (
              <div className="p-4 flex justify-center">
                <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="max-h-[120px] overflow-y-auto">
                <div className="px-4 py-2 border-b last:border-0 text-sm">
                  <div className="font-medium">Twitch Viewers Plan</div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>user123</span>
                    <span className="font-semibold">{formatCurrency(29.99)}</span>
                  </div>
                </div>
                <div className="px-4 py-2 border-b last:border-0 text-sm">
                  <div className="font-medium">Premium Chatbot</div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>streamer456</span>
                    <span className="font-semibold">{formatCurrency(49.99)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Expenses</CardTitle>
          <CardDescription>
            Monthly financial metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-80">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={analytics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                <Bar dataKey="expenses" fill="#8884d8" name="Expenses" />
                <Bar dataKey="profit" fill="#ffc658" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>MRR & Average Revenue Per User</CardTitle>
          <CardDescription>
            Growth and customer value
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-80">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={analytics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis yAxisId="left" tickFormatter={(value) => `$${value}`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="mrr" 
                  stroke="#8884d8" 
                  name="MRR" 
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="averageRevenuePerUser" 
                  stroke="#82ca9d" 
                  name="Avg Revenue Per User"
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Performance Metrics Dashboard
const PerformanceMetricsDashboard: React.FC<{startDate: Date, endDate: Date}> = ({ startDate, endDate }) => {
  const [selectedService, setSelectedService] = useState<string>('all');
  
  const {
    data: metrics = [],
    isLoading,
    refetch
  } = useQuery<PerformanceMetrics[]>({
    queryKey: ['/api/admin/analytics/performance', { startDate, endDate, serviceType: selectedService }],
    queryFn: async () => {
      let url = `/api/admin/analytics/performance?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      
      if (selectedService !== 'all') {
        url += `&serviceType=${selectedService}`;
      }
      
      const res = await apiRequest('GET', url);
      return res.json();
    }
  });
  
  // Calculate summary statistics
  const totalRequests = metrics.reduce((sum, item) => sum + item.totalRequests, 0);
  const successfulRequests = metrics.reduce((sum, item) => sum + item.successfulRequests, 0);
  const failedRequests = metrics.reduce((sum, item) => sum + item.failedRequests, 0);
  
  // Calculate success rate
  const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
  
  // Calculate average response time
  const avgResponseTime = metrics.reduce((sum, item) => sum + item.averageResponseTime, 0) / (metrics.length || 1);
  
  // Get unique service types for the filter
  const serviceTypes = [...new Set(metrics.map(item => item.serviceType))];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Metrics</h2>
        <div className="flex space-x-2">
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {serviceTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              During selected period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{successRate.toFixed(2)}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${successRate}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgResponseTime.toFixed(0)} ms</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Request Volume</CardTitle>
          <CardDescription>
            Successful vs failed requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-80">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={metrics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString(), '']}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Bar dataKey="successfulRequests" stackId="a" fill="#82ca9d" name="Successful" />
                <Bar dataKey="failedRequests" stackId="a" fill="#ff8042" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Response Time</CardTitle>
            <CardDescription>
              Average response time (ms)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-80">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(0)} ms`, 'Response Time']}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="averageResponseTime" 
                    stroke="#8884d8" 
                    name="Avg Response Time"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Error Rate</CardTitle>
            <CardDescription>
              Percentage of failed requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-80">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.map(item => ({
                  ...item,
                  errorRate: item.totalRequests > 0 
                    ? (item.failedRequests / item.totalRequests) * 100 
                    : 0
                }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Error Rate']}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="errorRate" 
                    stroke="#ff8042" 
                    name="Error Rate"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      
      {selectedService === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>Service Type Breakdown</CardTitle>
            <CardDescription>
              Distribution of requests by service
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-80">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={serviceTypes.map(type => ({
                          name: type,
                          value: metrics
                            .filter(m => m.serviceType === type)
                            .reduce((sum, item) => sum + item.totalRequests, 0)
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {serviceTypes.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Requests']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {serviceTypes.map((type, index) => {
                    const typeMetrics = metrics.filter(m => m.serviceType === type);
                    const totalTypeRequests = typeMetrics.reduce((sum, item) => sum + item.totalRequests, 0);
                    const typeSuccessRate = totalTypeRequests > 0
                      ? (typeMetrics.reduce((sum, item) => sum + item.successfulRequests, 0) / totalTypeRequests) * 100
                      : 0;
                    
                    return (
                      <div key={type} className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: `hsl(${index * 45}, 70%, 60%)` }}
                        ></div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{type}</span>
                            <span>{typeSuccessRate.toFixed(1)}% success</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="h-1.5 rounded-full" 
                              style={{ 
                                width: `${typeSuccessRate}%`,
                                backgroundColor: `hsl(${index * 45}, 70%, 60%)`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Main Analytics page component
const AnalyticsPage: React.FC = () => {
  // Create a date range for the last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startDate,
    to: endDate
  });
  
  return (
    <AdminLayout>
      <AdminHeader 
        title="Analytics & Reports"
        description="View detailed metrics and performance reports"
        actions={
          <div className="flex items-center space-x-2">
            <DateRangePicker
              value={dateRange}
              onValueChange={setDateRange}
              align="end"
            />
            <Button 
              variant="outline" 
              className="ml-2 flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
        }
      />
      <div className="container mx-auto p-6">
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-5">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users size={16} />
              User Analytics
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard size={16} />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <Calendar size={16} />
              Financial
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity size={16} />
              Performance
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield size={16} />
              Security
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <UserAnalyticsDashboard startDate={dateRange.from} endDate={dateRange.to} />
          </TabsContent>
          
          <TabsContent value="subscriptions">
            <SubscriptionAnalyticsDashboard startDate={dateRange.from} endDate={dateRange.to} />
          </TabsContent>
          
          <TabsContent value="financial">
            <FinancialAnalyticsDashboard startDate={dateRange.from} endDate={dateRange.to} />
          </TabsContent>
          
          <TabsContent value="performance">
            <PerformanceMetricsDashboard startDate={dateRange.from} endDate={dateRange.to} />
          </TabsContent>
          
          <TabsContent value="security">
            <SecurityAnalyticsDashboard startDate={dateRange.from} endDate={dateRange.to} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsPage;