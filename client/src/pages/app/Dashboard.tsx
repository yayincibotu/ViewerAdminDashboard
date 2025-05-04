import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import UserSidebar from '@/components/dashboard/UserSidebar';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Users, Eye, MessageSquare, Activity, TrendingUp, Share2 } from 'lucide-react';
import { Link } from 'wouter';

// Sample visualization data for user dashboard
const viewerData = [
  { date: 'Mon', count: 120 },
  { date: 'Tue', count: 180 },
  { date: 'Wed', count: 150 },
  { date: 'Thu', count: 220 },
  { date: 'Fri', count: 250 },
  { date: 'Sat', count: 300 },
  { date: 'Sun', count: 270 },
];

const followerData = [
  { date: 'Mon', count: 5 },
  { date: 'Tue', count: 8 },
  { date: 'Wed', count: 12 },
  { date: 'Thu', count: 7 },
  { date: 'Fri', count: 15 },
  { date: 'Sat', count: 19 },
  { date: 'Sun', count: 11 },
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch user subscriptions
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['/api/user-subscriptions'],
  });
  
  // Construct status summary based on active subscriptions
  const hasActiveSubscription = subscriptions.length > 0;
  
  // Get first active subscription for display
  const activeSubscription = subscriptions[0];
  
  return (
    <div className="flex h-screen bg-gray-100">
      <UserSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-gray-500">Welcome back, {user?.username}!</p>
            </div>
            <div>
              {!hasActiveSubscription ? (
                <Link href="/#pricing">
                  <Button className="flex items-center bg-primary-600 hover:bg-primary-700">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Get a Subscription
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-green-700">Services Active</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Current Viewers" 
              value={hasActiveSubscription ? activeSubscription.viewerCount || "0" : "0"}
              icon={<Eye className="h-4 w-4" />}
              trend="up"
              trendValue="12% from last month"
            />
            
            <StatCard 
              title="Chat Messages" 
              value="1,254"
              icon={<MessageSquare className="h-4 w-4" />}
            />
            
            <StatCard 
              title="Followers Gained" 
              value="548"
              icon={<Users className="h-4 w-4" />}
              trend="up"
              trendValue="8% from last month"
            />
            
            <StatCard 
              title="Engagement Rate" 
              value="24.3%"
              icon={<Activity className="h-4 w-4" />}
              trend="up"
              trendValue="3% from last month"
            />
          </div>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Analytics */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
                <CardDescription>
                  Track your viewer and follower growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="viewers">
                  <TabsList>
                    <TabsTrigger value="viewers">Viewers</TabsTrigger>
                    <TabsTrigger value="followers">Followers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="viewers" className="h-80 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={viewerData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  <TabsContent value="followers" className="h-80 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={followerData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            {/* Subscription Status */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Status</CardTitle>
                <CardDescription>
                  Current plan and features
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasActiveSubscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-primary-50 p-4 rounded-lg">
                      <div className="rounded-full bg-primary-100 p-2 text-primary-600">
                        <Share2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Active Plan</h3>
                        <p className="text-sm text-gray-500">{activeSubscription.name || "Standard Plan"}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-3">Plan Features</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center text-sm">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                          <span>Up to {activeSubscription.viewerCount || "100"} Live Viewers</span>
                        </li>
                        <li className="flex items-center text-sm">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                          <span>Realistic Chatters</span>
                        </li>
                        <li className="flex items-center text-sm">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                          <span>{activeSubscription.followerCount || "250"} Twitch Followers</span>
                        </li>
                        <li className="flex items-center text-sm">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                          <span>24/7 Support</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="flex justify-between pt-4 border-t">
                      <div className="text-sm">
                        <span className="text-gray-500">Next billing:</span>
                        <p className="font-medium">June 28, 2023</p>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-56 text-center">
                    <div className="rounded-full bg-gray-100 p-4 mb-4">
                      <Share2 className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">No Active Subscription</h3>
                    <p className="text-sm text-gray-500 mb-4">Get started with a subscription plan to boost your channel growth</p>
                    <Link href="/#pricing">
                      <Button>View Plans</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
