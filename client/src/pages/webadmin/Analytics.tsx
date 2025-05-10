import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, RefreshCw, Calendar, ArrowRight, ArrowUpRight, ArrowDownRight, Users, CreditCard, Activity } from 'lucide-react';
import AdminLayout from '@/components/dashboard/AdminLayout';
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
import type { UserAnalytics, SubscriptionAnalytics, FinancialAnalytics, PerformanceMetrics } from '@shared/schema';

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

// Financial Analytics Dashboard
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
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
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
        </div>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-4">
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
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsPage;