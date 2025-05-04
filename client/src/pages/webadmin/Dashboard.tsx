import React from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminSidebar from '@/components/dashboard/AdminSidebar';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, DollarSign, CreditCard, BarChart4, TrendingUp, Clock, ActivitySquare } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

// Sample data for admin dashboard visualizations
const userGrowthData = [
  { date: 'Jan', count: 50 },
  { date: 'Feb', count: 75 },
  { date: 'Mar', count: 90 },
  { date: 'Apr', count: 120 },
  { date: 'May', count: 150 },
  { date: 'Jun', count: 200 },
  { date: 'Jul', count: 250 },
];

const revenueData = [
  { date: 'Jan', amount: 2500 },
  { date: 'Feb', amount: 3200 },
  { date: 'Mar', amount: 4000 },
  { date: 'Apr', amount: 4800 },
  { date: 'May', amount: 5500 },
  { date: 'Jun', amount: 7000 },
  { date: 'Jul', amount: 7800 },
];

const platformData = [
  { name: 'Twitch', value: 65 },
  { name: 'Kick', value: 15 },
  { name: 'YouTube', value: 12 },
  { name: 'Instagram', value: 8 },
];

const COLORS = ['#8b5cf6', '#3b82f6', '#ef4444', '#f97316'];

const AdminDashboard: React.FC = () => {
  // Fetch admin data
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
  });
  
  const { data: payments = [] } = useQuery({
    queryKey: ['/api/admin/payments'],
  });
  
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['/api/admin/subscriptions'],
  });
  
  // Calculate summary stats
  const totalUsers = users.length;
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0) / 100; // Convert from cents
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
  const conversionRate = totalUsers > 0 ? ((activeSubscriptions / totalUsers) * 100).toFixed(1) : 0;
  
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-500">Overview of platform performance and metrics</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select defaultValue="30">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button>
                <Clock className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Users" 
              value={totalUsers}
              icon={<Users className="h-4 w-4" />}
              trend="up"
              trendValue="12% from last month"
            />
            
            <StatCard 
              title="Total Revenue" 
              value={`$${totalRevenue.toLocaleString()}`}
              icon={<DollarSign className="h-4 w-4" />}
              trend="up"
              trendValue="8% from last month"
            />
            
            <StatCard 
              title="Active Subscriptions" 
              value={activeSubscriptions}
              icon={<CreditCard className="h-4 w-4" />}
              trend="up"
              trendValue="5% from last month"
            />
            
            <StatCard 
              title="Conversion Rate" 
              value={`${conversionRate}%`}
              icon={<BarChart4 className="h-4 w-4" />}
              trend="down"
              trendValue="2% from last month"
            />
          </div>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue Chart */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>
                  Monthly revenue from all services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                      <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Platform Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Distribution</CardTitle>
                <CardDescription>
                  Subscription distribution by platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={platformData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value) => [`${value}%`, "Percent"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* User Growth & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* User Growth */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>
                  New user registrations over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userGrowthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest platform activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">New user registered</p>
                      <p className="text-sm text-gray-500">StreamerPro joined 10 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">New subscription</p>
                      <p className="text-sm text-gray-500">GameMaster purchased 100 Viewers plan</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-yellow-100 p-2 rounded-full mr-3">
                      <ActivitySquare className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">Service activated</p>
                      <p className="text-sm text-gray-500">StreamQueen started Twitch service</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Plan upgrade</p>
                      <p className="text-sm text-gray-500">ContentKing upgraded to 250 Viewers plan</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-red-100 p-2 rounded-full mr-3">
                      <Users className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">New user registered</p>
                      <p className="text-sm text-gray-500">TwitchStar joined 2 hours ago</p>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full mt-6">
                  View All Activity
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
