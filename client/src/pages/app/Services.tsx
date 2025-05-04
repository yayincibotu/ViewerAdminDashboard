import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import UserSidebar from '@/components/dashboard/UserSidebar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'wouter';
import { BarChart, ChevronRight, Settings, Users, MessageSquare, TrendingUp, Grid3X3, Activity } from 'lucide-react';

const Services: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch user subscriptions
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['/api/user-subscriptions'],
  });
  
  // Fetch platforms
  const { data: platforms = [] } = useQuery({
    queryKey: ['/api/platforms'],
  });
  
  // Service configuration state
  const [viewerCount, setViewerCount] = useState<number>(50);
  const [chatBotEnabled, setChatBotEnabled] = useState<boolean>(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("twitch");
  const [selectedCategory, setSelectedCategory] = useState<string>("Just Chatting");
  
  // Determine if user has active subscriptions
  const hasActiveSubscription = subscriptions.length > 0;
  
  // Get active subscription details (if any)
  const activeSubscription = subscriptions[0] || {};
  const maxViewers = activeSubscription.viewerCount || 100;
  
  return (
    <div className="flex h-screen bg-gray-100">
      <UserSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Services</h1>
              <p className="text-gray-500">Configure and manage your active services</p>
            </div>
            
            {hasActiveSubscription ? (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-green-700">Services Active</span>
              </div>
            ) : (
              <Link href="/#pricing">
                <Button>Subscribe to a Plan</Button>
              </Link>
            )}
          </div>
          
          {hasActiveSubscription ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Service Control Panel */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Control Panel</CardTitle>
                    <CardDescription>Configure your streaming services</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="twitch">
                      <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
                        <TabsTrigger value="twitch">
                          <i className="fab fa-twitch mr-2"></i> Twitch
                        </TabsTrigger>
                        <TabsTrigger value="kick">
                          <i className="fas fa-play mr-2"></i> Kick
                        </TabsTrigger>
                        <TabsTrigger value="youtube">
                          <i className="fab fa-youtube mr-2"></i> YouTube
                        </TabsTrigger>
                        <TabsTrigger value="other">
                          <Grid3X3 className="mr-2 h-4 w-4" /> Other
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="twitch" className="space-y-6">
                        <div className="space-y-3">
                          <h3 className="text-lg font-medium">Channel Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="channel">Twitch Channel</Label>
                              <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                  twitch.tv/
                                </span>
                                <input
                                  type="text"
                                  id="channel"
                                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                  placeholder="yourusername"
                                  defaultValue={user?.username}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="category">Stream Category</Label>
                              <Select defaultValue={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger id="category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Just Chatting">Just Chatting</SelectItem>
                                  <SelectItem value="Gaming">Gaming</SelectItem>
                                  <SelectItem value="IRL">IRL</SelectItem>
                                  <SelectItem value="Music">Music</SelectItem>
                                  <SelectItem value="Esports">Esports</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium">Viewer Configuration</h3>
                            <span className="text-sm text-gray-500">Max allowed: {maxViewers}</span>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <Label>Number of Viewers: {viewerCount}</Label>
                                <span className="text-sm text-primary-600">{Math.round((viewerCount / maxViewers) * 100)}%</span>
                              </div>
                              <Slider 
                                defaultValue={[viewerCount]} 
                                max={maxViewers} 
                                step={1} 
                                onValueChange={(vals) => setViewerCount(vals[0])}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between space-x-2">
                              <Label htmlFor="chat-bot" className="flex flex-col space-y-1">
                                <span>Chat Bot</span>
                                <span className="text-sm font-normal text-gray-500">Enable realistic chat messages</span>
                              </Label>
                              <Switch
                                id="chat-bot"
                                checked={chatBotEnabled}
                                onCheckedChange={setChatBotEnabled}
                              />
                            </div>
                            
                            {chatBotEnabled && (
                              <div className="pt-3 space-y-3 border-t">
                                <h4 className="text-sm font-medium">Chat Configuration</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="chat-frequency">Message Frequency</Label>
                                    <Select defaultValue="medium">
                                      <SelectTrigger id="chat-frequency">
                                        <SelectValue placeholder="Select frequency" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low">Low (1-2 messages/min)</SelectItem>
                                        <SelectItem value="medium">Medium (3-5 messages/min)</SelectItem>
                                        <SelectItem value="high">High (6-10 messages/min)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="chat-style">Chat Style</Label>
                                    <Select defaultValue="friendly">
                                      <SelectTrigger id="chat-style">
                                        <SelectValue placeholder="Select style" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="friendly">Friendly</SelectItem>
                                        <SelectItem value="meme">Meme/Funny</SelectItem>
                                        <SelectItem value="supportive">Supportive</SelectItem>
                                        <SelectItem value="questions">Question-focused</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="kick" className="h-[400px] flex items-center justify-center text-center">
                        <div className="max-w-md">
                          <MessageSquare className="h-10 w-10 text-primary-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">Kick Services Coming Soon</h3>
                          <p className="text-gray-500 mb-4">Our Kick integration is currently in development. Check back soon for updates!</p>
                          <Button variant="outline">Get Notified</Button>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="youtube" className="h-[400px] flex items-center justify-center text-center">
                        <div className="max-w-md">
                          <Settings className="h-10 w-10 text-primary-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">YouTube Services Coming Soon</h3>
                          <p className="text-gray-500 mb-4">Our YouTube integration is currently in development. Check back soon for updates!</p>
                          <Button variant="outline">Get Notified</Button>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="other" className="h-[400px] flex items-center justify-center text-center">
                        <div className="max-w-md">
                          <Activity className="h-10 w-10 text-primary-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">More Platforms Coming Soon</h3>
                          <p className="text-gray-500 mb-4">We're constantly adding support for new platforms. Stay tuned for updates!</p>
                          <Button variant="outline">Request a Platform</Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-6">
                    <Button variant="outline">Save Configuration</Button>
                    <Button className="bg-primary-600 hover:bg-primary-700">
                      Start Service <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              {/* Service Status Panel */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Service Status</CardTitle>
                    <CardDescription>Real-time status of your services</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-start">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-4 flex-shrink-0">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-green-800 mb-1">Service Active</h3>
                          <p className="text-sm text-green-600">Your streaming services are currently active and running smoothly.</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-700">Active Services</h3>
                        <ul className="space-y-3">
                          <li className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-md bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                                <i className="fab fa-twitch"></i>
                              </div>
                              <div>
                                <p className="font-medium text-sm">Twitch Viewers</p>
                                <p className="text-xs text-gray-500">Active for 2 hours</p>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-green-600">{viewerCount} viewers</span>
                          </li>
                          
                          {chatBotEnabled && (
                            <li className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                                  <MessageSquare className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">Chat Bot</p>
                                  <p className="text-xs text-gray-500">Active for 2 hours</p>
                                </div>
                              </div>
                              <span className="text-sm font-medium text-green-600">Active</span>
                            </li>
                          )}
                        </ul>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Session Stats</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Peak Viewers</p>
                            <p className="text-lg font-medium">{viewerCount}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Session Time</p>
                            <p className="text-lg font-medium">2h 14m</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Chat Messages</p>
                            <p className="text-lg font-medium">246</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">New Followers</p>
                            <p className="text-lg font-medium">15</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-6">
                    <Button variant="outline" className="w-full">View Detailed Analytics</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
              <div className="max-w-md w-full space-y-8 text-center">
                <div>
                  <BarChart className="mx-auto h-16 w-16 text-gray-400" />
                  <h2 className="mt-6 text-2xl font-bold text-gray-900">No Active Services</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    You don't have any active subscriptions. Subscribe to a plan to start using our services.
                  </p>
                </div>
                <div>
                  <Link href="/#pricing">
                    <Button className="w-full">View Subscription Plans</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Services;
