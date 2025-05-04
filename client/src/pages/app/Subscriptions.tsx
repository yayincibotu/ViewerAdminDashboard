import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import UserSidebar from '@/components/dashboard/UserSidebar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { ShoppingCart, CreditCard, ArrowRight, Clock, Check, CheckCircle2, X } from 'lucide-react';

const Subscriptions: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch user subscriptions
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['/api/user-subscriptions'],
  });
  
  // Fetch available subscription plans
  const { data: plans = [] } = useQuery({
    queryKey: ['/api/subscription-plans'],
  });
  
  // Check if the user has any active subscriptions
  const hasActiveSubscriptions = subscriptions.length > 0;
  
  return (
    <div className="flex h-screen bg-gray-100">
      <UserSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Subscriptions</h1>
              <p className="text-gray-500">Manage your subscription plans</p>
            </div>
            
            <Link href="/#pricing">
              <Button className="flex items-center">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Browse Plans
              </Button>
            </Link>
          </div>
          
          {/* Active Subscriptions */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-4">Active Subscriptions</h2>
            
            {hasActiveSubscriptions ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptions.map((subscription, index) => (
                  <Card key={index} className="relative">
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                    </div>
                    <CardHeader>
                      <CardTitle>{subscription.name || "Twitch Viewers Plan"}</CardTitle>
                      <CardDescription>Subscription ID: {subscription.id}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="text-sm text-gray-500">Price</span>
                          <span className="text-lg font-bold">${subscription.price || "75"}/month</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Live Viewers</span>
                            <span className="font-medium">{subscription.viewerCount || "100"}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Chat List</span>
                            <span className="font-medium">{subscription.chatCount || "100"}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Twitch Followers</span>
                            <span className="font-medium">{subscription.followerCount || "250"}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Geographic Targeting</span>
                            <span className="font-medium">
                              {subscription.geographicTargeting ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-red-500" />
                              )}
                            </span>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-gray-500">Renews on:</span>
                            <span className="font-medium ml-auto">
                              {new Date(subscription.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">Cancel</Button>
                      <Button size="sm">Manage</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 flex flex-col items-center text-center py-10">
                  <div className="rounded-full bg-gray-100 p-3 mb-4">
                    <CreditCard className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Active Subscriptions</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    You don't have any active subscriptions. Choose a plan to start boosting your social media presence.
                  </p>
                  <Link href="/#pricing">
                    <Button>View Subscription Plans</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Recommended Upgrades */}
          {hasActiveSubscriptions && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold mb-4">Recommended Upgrades</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="relative overflow-hidden border-primary-200">
                  <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs font-bold px-3 py-1 transform translate-x-2 -translate-y-2 rotate-45">
                    RECOMMENDED
                  </div>
                  <CardHeader className="bg-primary-50">
                    <CardTitle className="text-primary-700">250 Live Viewers</CardTitle>
                    <CardDescription>Premium plan for growing streamers</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="mb-6 text-center">
                      <span className="text-3xl font-bold">$140</span>
                      <span className="text-gray-500 ml-1">/month</span>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>Up to <strong>250</strong> Live Viewers</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>Up to <strong>250</strong> Chat List</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span><strong>500</strong> Twitch Followers</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span><strong>Geographic Targeting</strong></span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/subscribe/4" className="w-full">
                      <Button className="w-full">
                        Upgrade Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>500 Live Viewers</CardTitle>
                    <CardDescription>Deluxe plan for established streamers</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="mb-6 text-center">
                      <span className="text-3xl font-bold">$260</span>
                      <span className="text-gray-500 ml-1">/month</span>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>Up to <strong>500</strong> Live Viewers</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>Up to <strong>500</strong> Chat List</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span><strong>1000</strong> Twitch Followers</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span><strong>Geographic Targeting</strong></span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/subscribe/5" className="w-full">
                      <Button variant="outline" className="w-full">Learn More</Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
          
          {/* Payment History */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Payment History</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your payment history for subscriptions and services</CardDescription>
              </CardHeader>
              <CardContent>
                {hasActiveSubscriptions ? (
                  <div className="divide-y">
                    <div className="py-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">Twitch Viewers Plan</p>
                        <p className="text-sm text-gray-500">May 28, 2023</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$75.00</p>
                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                          Completed
                        </Badge>
                      </div>
                    </div>
                    <div className="py-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">Instagram Followers Pack</p>
                        <p className="text-sm text-gray-500">April 15, 2023</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$49.99</p>
                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                          Completed
                        </Badge>
                      </div>
                    </div>
                    <div className="py-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">Twitch Viewers Plan</p>
                        <p className="text-sm text-gray-500">April 28, 2023</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$75.00</p>
                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                          Completed
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-500">
                    <p>No payment history available</p>
                  </div>
                )}
              </CardContent>
              {hasActiveSubscriptions && (
                <CardFooter>
                  <Button variant="outline" className="w-full">View All Transactions</Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
