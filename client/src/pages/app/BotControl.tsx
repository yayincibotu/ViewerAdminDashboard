import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  MessageSquare, 
  Users, 
  RefreshCw, 
  Loader2, 
  Save,
  Globe,
  Sparkles,
  Twitch,
  X,
  CircleDot
} from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Status indicator component
const StatusIndicator = ({ active }: { active: boolean }) => (
  <div className="flex items-center gap-1.5">
    <div className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
    <span className={`text-xs font-medium ${active ? 'text-green-600' : 'text-red-600'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  </div>
);

// Define default settings
const DEFAULT_VIEWER_SETTINGS = {
  viewerCount: 15,
  chatMode: 'moderate',
  autoMessages: true,
  customMessages: []
};

const DEFAULT_CHAT_SETTINGS = {
  chatCount: 10,
  messageFrequency: 'medium',
  autoRespond: true,
  chatBotNames: [],
  customResponses: {}
};

const DEFAULT_FOLLOWER_SETTINGS = {
  followerCount: 5,
  followRate: 'medium',
  unfollowOld: false,
  targetChannels: [],
};

export default function BotControl() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // State for Twitch channel input
  const [twitchChannelInput, setTwitchChannelInput] = useState('');
  const [showChannelChangeForm, setShowChannelChangeForm] = useState(false);
  
  // State for bot controls
  const [viewerBotActive, setViewerBotActive] = useState(false);
  const [chatListActive, setChatListActive] = useState(false);
  const [followerBotActive, setFollowerBotActive] = useState(false);
  
  // State for settings
  const [viewerSettings, setViewerSettings] = useState(DEFAULT_VIEWER_SETTINGS);
  const [chatSettings, setChatSettings] = useState(DEFAULT_CHAT_SETTINGS);
  const [followerSettings, setFollowerSettings] = useState(DEFAULT_FOLLOWER_SETTINGS);
  
  // Selected subscription
  const [selectedSubscription, setSelectedSubscription] = useState<number | null>(null);
  
  // Fetch user subscriptions
  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useQuery({
    queryKey: ['/api/user-subscriptions'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user-subscriptions');
      return res.json();
    },
  });
  
  // Fetch subscription details based on selection
  const { data: subscriptionDetail = {}, isLoading: isLoadingSubscriptionDetail } = useQuery({
    queryKey: ['/api/user-subscription', selectedSubscription],
    queryFn: async () => {
      if (!selectedSubscription) return {};
      const res = await apiRequest('GET', `/api/user-subscription/${selectedSubscription}`);
      return res.json();
    },
    enabled: !!selectedSubscription,
  });
  
  // Update Twitch channel mutation
  const updateTwitchChannelMutation = useMutation({
    mutationFn: async (twitchChannel: string) => {
      if (!selectedSubscription) throw new Error('No subscription selected');
      const res = await apiRequest('PATCH', `/api/user-subscription/${selectedSubscription}/twitch-channel`, { twitchChannel });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-subscription', selectedSubscription] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-subscriptions'] });
      toast({
        title: 'Twitch Channel Updated',
        description: `Your Twitch channel has been set to ${twitchChannelInput}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Twitch Channel',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Update viewer settings mutation
  const updateViewerSettingsMutation = useMutation({
    mutationFn: async (settings: typeof viewerSettings) => {
      if (!selectedSubscription) throw new Error('No subscription selected');
      const res = await apiRequest('PATCH', `/api/user-subscription/${selectedSubscription}/viewer-settings`, 
        { settings: JSON.stringify(settings) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-subscription', selectedSubscription] });
      toast({
        title: 'Viewer Settings Updated',
        description: 'Your viewer bot settings have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Viewer Settings',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Update chat settings mutation
  const updateChatSettingsMutation = useMutation({
    mutationFn: async (settings: typeof chatSettings) => {
      if (!selectedSubscription) throw new Error('No subscription selected');
      const res = await apiRequest('PATCH', `/api/user-subscription/${selectedSubscription}/chat-settings`, 
        { settings: JSON.stringify(settings) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-subscription', selectedSubscription] });
      toast({
        title: 'Chat Settings Updated',
        description: 'Your chat list settings have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Chat Settings',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Update follower settings mutation
  const updateFollowerSettingsMutation = useMutation({
    mutationFn: async (settings: typeof followerSettings) => {
      if (!selectedSubscription) throw new Error('No subscription selected');
      const res = await apiRequest('PATCH', `/api/user-subscription/${selectedSubscription}/follower-settings`, 
        { settings: JSON.stringify(settings) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-subscription', selectedSubscription] });
      toast({
        title: 'Follower Settings Updated',
        description: 'Your follower bot settings have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Follower Settings',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Set initial selected subscription
  useEffect(() => {
    if (subscriptions && subscriptions.length > 0 && !selectedSubscription) {
      // Find an active subscription first
      const activeSubscription = subscriptions.find((sub: any) => sub.subscription.isActive);
      if (activeSubscription) {
        setSelectedSubscription(activeSubscription.subscription.id);
      } else {
        // Otherwise use the first one
        setSelectedSubscription(subscriptions[0].subscription.id);
      }
    }
  }, [subscriptions, selectedSubscription]);
  
  // Update settings when subscription detail changes
  useEffect(() => {
    if (subscriptionDetail && subscriptionDetail.subscription) {
      if (subscriptionDetail.subscription.viewerSettings) {
        try {
          const settings = JSON.parse(subscriptionDetail.subscription.viewerSettings);
          setViewerSettings({
            ...DEFAULT_VIEWER_SETTINGS,
            ...settings,
            // Ensure we don't exceed the plan's limit
            viewerCount: subscriptionDetail.plan && settings.viewerCount > subscriptionDetail.plan.viewerCount 
              ? subscriptionDetail.plan.viewerCount 
              : settings.viewerCount
          });
        } catch (e) {
          console.error('Error parsing viewer settings', e);
        }
      }
      
      if (subscriptionDetail.subscription.chatSettings) {
        try {
          const settings = JSON.parse(subscriptionDetail.subscription.chatSettings);
          setChatSettings({
            ...DEFAULT_CHAT_SETTINGS,
            ...settings,
            // Ensure we don't exceed the plan's limit
            chatCount: subscriptionDetail.plan && settings.chatCount > subscriptionDetail.plan.chatCount 
              ? subscriptionDetail.plan.chatCount 
              : settings.chatCount
          });
        } catch (e) {
          console.error('Error parsing chat settings', e);
        }
      }
      
      if (subscriptionDetail.subscription.followerSettings) {
        try {
          const settings = JSON.parse(subscriptionDetail.subscription.followerSettings);
          setFollowerSettings({
            ...DEFAULT_FOLLOWER_SETTINGS,
            ...settings,
            // Ensure we don't exceed the plan's limit
            followerCount: subscriptionDetail.plan && settings.followerCount > subscriptionDetail.plan.followerCount 
              ? subscriptionDetail.plan.followerCount 
              : settings.followerCount
          });
        } catch (e) {
          console.error('Error parsing follower settings', e);
        }
      }
      
      // Set the twitchChannelInput for the channel change form
      if (subscriptionDetail.subscription.twitchChannel) {
        setTwitchChannelInput(subscriptionDetail.subscription.twitchChannel);
      }
    }
  }, [subscriptionDetail]);
  
  // Handle form submission for viewer settings
  const handleSaveViewerSettings = () => {
    updateViewerSettingsMutation.mutate(viewerSettings);
  };
  
  // Handle form submission for chat settings
  const handleSaveChatSettings = () => {
    updateChatSettingsMutation.mutate(chatSettings);
  };
  
  // Handle form submission for follower settings
  const handleSaveFollowerSettings = () => {
    updateFollowerSettingsMutation.mutate(followerSettings);
  };
  
  // Loading state
  if (isLoadingSubscriptions) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-gray-500">Loading your subscriptions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // No subscriptions state
  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center bg-white rounded-lg p-8 text-center shadow">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <Twitch className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Active Subscriptions</h2>
            <p className="text-gray-500 mb-6">You need an active subscription to access the bot control panel.</p>
            <Button asChild>
              <a href="/#pricing">View Plans</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Check if selected subscription has a Twitch channel
  const currentSubscription = subscriptionDetail?.subscription;
  
  // If the subscription doesn't have a Twitch channel, show the setup form
  if (currentSubscription && !currentSubscription.twitchChannel) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center bg-white rounded-lg p-8 text-center shadow">
            <div className="rounded-full bg-yellow-100 p-4 mb-4">
              <Twitch className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Twitch Channel Required</h2>
            <p className="text-gray-500 mb-6">
              You need to set a Twitch channel for this subscription before you can use the bot control panel.
            </p>
            
            <div className="w-full max-w-md mb-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitch-channel">Twitch Channel Name</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="twitch-channel"
                      placeholder="yourchannelname" 
                      value={twitchChannelInput}
                      onChange={(e) => setTwitchChannelInput(e.target.value)}
                    />
                    <Button 
                      onClick={() => updateTwitchChannelMutation.mutate(twitchChannelInput)}
                      disabled={!twitchChannelInput.trim() || updateTwitchChannelMutation.isPending}
                    >
                      {updateTwitchChannelMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter your Twitch channel name without the @ symbol
                  </p>
                </div>
                
                <div className="text-sm text-gray-700 bg-blue-50 p-4 rounded-md">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-700">Each subscription can have a different Twitch channel</p>
                      <p className="mt-1">This allows you to use different bot plans for different channels you manage.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Button asChild variant="outline">
              <a href="/app/subscriptions">Back to Subscriptions</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Main bot control panel
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Bot Control Panel</h1>
            <p className="text-gray-500">Configure your Twitch bot settings</p>
          </div>
          
          {/* Subscription selector */}
          <div className="w-full md:w-auto bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm text-gray-700">Subscription Plan</div>
                {currentSubscription && subscriptionDetail && subscriptionDetail.plan && (
                  <div className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                    {subscriptionDetail.plan.viewerCount} Viewers Max
                  </div>
                )}
              </div>
              
              <div className="w-full">
                <Select
                  value={selectedSubscription?.toString()}
                  onValueChange={(value) => setSelectedSubscription(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a subscription" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptions.map((sub: any) => (
                      <SelectItem 
                        key={sub.subscription.id} 
                        value={sub.subscription.id.toString()}
                      >
                        <div className="flex items-center gap-2">
                          <div>{sub.plan.name}</div>
                          {sub.subscription.twitchChannel && (
                            <div className="text-xs text-gray-500">
                              - {sub.subscription.twitchChannel}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {currentSubscription && (
                <div className="flex items-center justify-between text-xs">
                  <div className="text-gray-500">
                    Twitch Channel: 
                  </div>
                  <div className="font-medium flex items-center">
                    {currentSubscription.twitchChannel ? (
                      <div className="flex items-center gap-1">
                        <Twitch className="h-3 w-3 text-purple-600" />
                        <span className="text-purple-600">{currentSubscription.twitchChannel}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 w-5 p-0 hover:bg-gray-100 rounded-full"
                          onClick={() => {
                            setTwitchChannelInput('');
                            setShowChannelChangeForm(!showChannelChangeForm);
                          }}
                        >
                          <RefreshCw className="h-3 w-3 text-gray-500" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-yellow-600">Not set</span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Channel change form */}
              {showChannelChangeForm && currentSubscription && (
                <div className="pt-2 border-t mt-2">
                  <div className="text-xs font-medium mb-1 text-gray-700">Change Twitch Channel</div>
                  <div className="flex gap-1">
                    <Input 
                      placeholder="New channel name" 
                      value={twitchChannelInput}
                      onChange={(e) => setTwitchChannelInput(e.target.value)}
                      className="h-7 text-xs"
                    />
                    <Button 
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => {
                        if (twitchChannelInput.trim()) {
                          updateTwitchChannelMutation.mutate(twitchChannelInput);
                          setShowChannelChangeForm(false);
                        }
                      }}
                      disabled={updateTwitchChannelMutation.isPending}
                    >
                      {updateTwitchChannelMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Status indicator */}
        {currentSubscription && (
          <div className={`mb-6 p-4 rounded-lg ${currentSubscription.isActive ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${currentSubscription.isActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'} mr-2`}></div>
              <p className={`text-sm font-medium ${currentSubscription.isActive ? 'text-green-700' : 'text-yellow-700'}`}>
                {currentSubscription.isActive 
                  ? `Services are running for channel: ${currentSubscription.twitchChannel}`
                  : `Services are currently inactive. Configure your settings and activate your subscription.`}
              </p>
            </div>
            {!currentSubscription.isActive && (
              <div className="mt-2 text-xs text-yellow-600">
                You can activate your subscription from the Subscriptions page.
              </div>
            )}
          </div>
        )}
        
        {/* Bot Control Panel */}
        {currentSubscription && subscriptionDetail && subscriptionDetail.plan && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary p-1.5 rounded-full">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span>Bot Control Command Center</span>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <div className={`w-2 h-2 rounded-full ${currentSubscription.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className={`${currentSubscription.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {currentSubscription.isActive ? 'Services Active' : 'Services Inactive'}
                    </span>
                  </div>
                  {!currentSubscription.isActive && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7 bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                      asChild
                    >
                      <a href="/app/subscriptions">Activate Services</a>
                    </Button>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                Control all your Twitch bot services from a single dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Viewer Bot Control */}
                <div className="border rounded-lg p-4 relative overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-blue-500" />
                        <h3 className="font-medium">Viewer Bot</h3>
                      </div>
                      <div className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium">
                        {viewerSettings.viewerCount} / {subscriptionDetail.plan.viewerCount}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Adds simulated viewers to your Twitch stream
                      </div>
                      <StatusIndicator active={currentSubscription.isActive && viewerBotActive} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {currentSubscription.isActive ? 
                          (viewerBotActive ? 
                            `${viewerSettings.viewerCount} viewers currently active` : 
                            'Viewer bot is ready to start') : 
                          'Waiting to be activated'}
                      </div>
                      <Switch 
                        checked={viewerBotActive}
                        disabled={!currentSubscription.isActive}
                        onCheckedChange={(checked) => {
                          setViewerBotActive(checked);
                          if (checked) {
                            toast({
                              title: 'Viewer Bot Activated',
                              description: `${viewerSettings.viewerCount} viewers have been added to your stream.`,
                            });
                          } else {
                            toast({
                              title: 'Viewer Bot Deactivated',
                              description: 'All viewers have been removed from your stream.',
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Chat List Control */}
                <div className="border rounded-lg p-4 relative overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-500" />
                        <h3 className="font-medium">Chat List</h3>
                      </div>
                      <div className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md font-medium">
                        {chatSettings.chatCount} / {subscriptionDetail.plan.chatCount}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Displays a static chat list in your Twitch channel
                      </div>
                      <StatusIndicator active={currentSubscription.isActive && chatListActive} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {currentSubscription.isActive ? 
                          (chatListActive ? 
                            `${chatSettings.chatCount} chat users active` : 
                            'Chat list is ready to start') : 
                          'Waiting to be activated'}
                      </div>
                      <Switch 
                        checked={chatListActive}
                        disabled={!currentSubscription.isActive}
                        onCheckedChange={(checked) => {
                          setChatListActive(checked);
                          if (checked) {
                            toast({
                              title: 'Chat List Activated',
                              description: `${chatSettings.chatCount} chat users have been added to your channel.`,
                            });
                          } else {
                            toast({
                              title: 'Chat List Deactivated',
                              description: 'All chat users have been removed from your channel.',
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Follower Bot Control */}
                <div className="border rounded-lg p-4 relative overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-teal-500" />
                        <h3 className="font-medium">Follower Bot</h3>
                      </div>
                      <div className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-md font-medium">
                        {followerSettings.followerCount} / {subscriptionDetail.plan.followerCount || 100}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Automatically adds followers to your Twitch channel
                      </div>
                      <StatusIndicator active={currentSubscription.isActive && followerBotActive} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {currentSubscription.isActive ? 
                          (followerBotActive ? 
                            `Adding ${followerSettings.followerCount} followers` : 
                            'Follower bot is ready to start') : 
                          'Waiting to be activated'}
                      </div>
                      <Switch 
                        checked={followerBotActive}
                        disabled={!currentSubscription.isActive}
                        onCheckedChange={(checked) => {
                          setFollowerBotActive(checked);
                          if (checked) {
                            toast({
                              title: 'Follower Bot Activated',
                              description: `${followerSettings.followerCount} followers per day will be added to your channel.`,
                            });
                          } else {
                            toast({
                              title: 'Follower Bot Deactivated',
                              description: 'Follower bot has been paused.',
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Advanced configuration tabs */}
        {currentSubscription && subscriptionDetail && subscriptionDetail.plan && (
          <Tabs defaultValue="viewer" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="viewer" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Eye className="mr-2 h-4 w-4" />
                Viewer Bot Settings
              </TabsTrigger>
              <TabsTrigger value="chatlist" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat List Settings
              </TabsTrigger>
              <TabsTrigger value="follower" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
                <Users className="mr-2 h-4 w-4" />
                Follower Bot Settings
              </TabsTrigger>
            </TabsList>
            
            {/* Viewer Bot Settings Content */}
            <TabsContent value="viewer">
              <Card>
                <CardHeader>
                  <CardTitle>Viewer Bot Configuration</CardTitle>
                  <CardDescription>
                    Configure how the viewer bot behaves in your Twitch channel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="viewer-count">Number of Viewers</Label>
                      <span className="text-sm text-muted-foreground">
                        {viewerSettings.viewerCount} / {subscriptionDetail.plan.viewerCount}
                      </span>
                    </div>
                    <Slider
                      id="viewer-count"
                      max={subscriptionDetail.plan.viewerCount}
                      step={1}
                      value={[viewerSettings.viewerCount]}
                      onValueChange={(value) => {
                        setViewerSettings({
                          ...viewerSettings,
                          viewerCount: value[0]
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      Control how many viewers will be active in your channel
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="chat-mode">Chat Activity Level</Label>
                    <Select 
                      value={viewerSettings.chatMode}
                      onValueChange={(value) => {
                        setViewerSettings({
                          ...viewerSettings,
                          chatMode: value
                        });
                      }}
                    >
                      <SelectTrigger id="chat-mode">
                        <SelectValue placeholder="Select chat activity level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="silent">Silent (No chat messages)</SelectItem>
                        <SelectItem value="minimal">Minimal (Very few messages)</SelectItem>
                        <SelectItem value="moderate">Moderate (Regular messages)</SelectItem>
                        <SelectItem value="active">Active (Frequent messages)</SelectItem>
                        <SelectItem value="very-active">Very Active (Constant messages)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Set how active your viewers will be in the chat
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="auto-messages"
                      checked={viewerSettings.autoMessages}
                      onCheckedChange={(checked) => {
                        setViewerSettings({
                          ...viewerSettings,
                          autoMessages: checked
                        });
                      }}
                    />
                    <Label htmlFor="auto-messages">
                      Enable automatic chat messages
                    </Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="custom-messages">Custom Chat Messages</Label>
                    <Textarea 
                      id="custom-messages"
                      placeholder="Enter custom messages, one per line"
                      className="min-h-[100px]"
                      disabled={!viewerSettings.autoMessages}
                      value={viewerSettings.customMessages ? viewerSettings.customMessages.join('\n') : ''}
                      onChange={(e) => {
                        setViewerSettings({
                          ...viewerSettings,
                          customMessages: e.target.value.split('\n').filter(msg => msg.trim())
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      Add custom messages that viewers will randomly say in chat
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveViewerSettings}
                    className="ml-auto"
                    disabled={updateViewerSettingsMutation.isPending}
                  >
                    {updateViewerSettingsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save Viewer Settings
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Chat List Settings Content */}
            <TabsContent value="chatlist">
              <Card>
                <CardHeader>
                  <CardTitle>Chat List Configuration</CardTitle>
                  <CardDescription>
                    Configure how the chat list appears in your Twitch channel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="chat-count">Number of Chat Users</Label>
                      <span className="text-sm text-muted-foreground">
                        {chatSettings.chatCount} / {subscriptionDetail.plan.chatCount}
                      </span>
                    </div>
                    <Slider
                      id="chat-count"
                      max={subscriptionDetail.plan.chatCount}
                      step={1}
                      value={[chatSettings.chatCount]}
                      onValueChange={(value) => {
                        setChatSettings({
                          ...chatSettings,
                          chatCount: value[0]
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      Control how many users will be displayed in your chat list
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message-frequency">Message Frequency</Label>
                    <Select 
                      value={chatSettings.messageFrequency}
                      onValueChange={(value) => {
                        setChatSettings({
                          ...chatSettings,
                          messageFrequency: value
                        });
                      }}
                    >
                      <SelectTrigger id="message-frequency">
                        <SelectValue placeholder="Select message frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="very-low">Very Low (Almost never)</SelectItem>
                        <SelectItem value="low">Low (Occasional messages)</SelectItem>
                        <SelectItem value="medium">Medium (Regular messages)</SelectItem>
                        <SelectItem value="high">High (Frequent messages)</SelectItem>
                        <SelectItem value="very-high">Very High (Constant messages)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Set how often chat users will send messages
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="auto-respond"
                      checked={chatSettings.autoRespond}
                      onCheckedChange={(checked) => {
                        setChatSettings({
                          ...chatSettings,
                          autoRespond: checked
                        });
                      }}
                    />
                    <Label htmlFor="auto-respond">
                      Enable bot users to respond to chat
                    </Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="chat-bot-names">Custom Chat Usernames</Label>
                    <Textarea 
                      id="chat-bot-names"
                      placeholder="Enter custom usernames, one per line"
                      className="min-h-[100px]"
                      value={chatSettings.chatBotNames ? chatSettings.chatBotNames.join('\n') : ''}
                      onChange={(e) => {
                        setChatSettings({
                          ...chatSettings,
                          chatBotNames: e.target.value.split('\n').filter(name => name.trim())
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      Add custom usernames for your chat list (leave empty for random names)
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveChatSettings}
                    className="ml-auto"
                    disabled={updateChatSettingsMutation.isPending}
                  >
                    {updateChatSettingsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save Chat Settings
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Follower Bot Settings Content */}
            <TabsContent value="follower">
              <Card>
                <CardHeader>
                  <CardTitle>Follower Bot Configuration</CardTitle>
                  <CardDescription>
                    Configure how the follower bot behaves with your Twitch channel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="follower-count">Followers Per Day</Label>
                      <span className="text-sm text-muted-foreground">
                        {followerSettings.followerCount} / {subscriptionDetail.plan.followerCount || 100}
                      </span>
                    </div>
                    <Slider
                      id="follower-count"
                      max={subscriptionDetail.plan.followerCount || 100}
                      step={1}
                      value={[followerSettings.followerCount]}
                      onValueChange={(value) => {
                        setFollowerSettings({
                          ...followerSettings,
                          followerCount: value[0]
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      Control how many followers will be added to your channel each day
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="follow-rate">Follow Rate</Label>
                    <Select 
                      value={followerSettings.followRate}
                      onValueChange={(value) => {
                        setFollowerSettings({
                          ...followerSettings,
                          followRate: value
                        });
                      }}
                    >
                      <SelectTrigger id="follow-rate">
                        <SelectValue placeholder="Select follow rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="very-slow">Very Slow (Natural growth pattern)</SelectItem>
                        <SelectItem value="slow">Slow (Gradual increase)</SelectItem>
                        <SelectItem value="medium">Medium (Balanced growth)</SelectItem>
                        <SelectItem value="fast">Fast (Rapid growth)</SelectItem>
                        <SelectItem value="very-fast">Very Fast (Immediate growth)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Set how quickly followers will be added to your channel
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="unfollow-old"
                      checked={followerSettings.unfollowOld}
                      onCheckedChange={(checked) => {
                        setFollowerSettings({
                          ...followerSettings,
                          unfollowOld: checked
                        });
                      }}
                    />
                    <Label htmlFor="unfollow-old">
                      Unfollow old bot followers after 30 days
                    </Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="target-channels">Target Channels</Label>
                    <Textarea 
                      id="target-channels"
                      placeholder="Enter target channels, one per line"
                      className="min-h-[100px]"
                      value={followerSettings.targetChannels ? followerSettings.targetChannels.join('\n') : ''}
                      onChange={(e) => {
                        setFollowerSettings({
                          ...followerSettings,
                          targetChannels: e.target.value.split('\n').filter(channel => channel.trim())
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      Add channels whose viewers will follow you (optional)
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveFollowerSettings}
                    className="ml-auto"
                    disabled={updateFollowerSettingsMutation.isPending}
                  >
                    {updateFollowerSettingsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save Follower Settings
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}