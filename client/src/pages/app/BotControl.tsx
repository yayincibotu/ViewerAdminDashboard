import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import UserSidebar from '@/components/dashboard/UserSidebar';
import Header from '@/components/dashboard/Header';
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
import { SubscriptionPlan, UserSubscription } from '@shared/schema';

// Durum gösterge bileşeni
const StatusIndicator = ({ active }: { active: boolean }) => (
  <div className="flex items-center gap-1.5">
    <div className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
    <span className={`text-xs font-medium ${active ? 'text-green-600' : 'text-red-600'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  </div>
);
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Define interfaces for settings
interface ViewerSettings {
  viewerCount: number;
  chatMode: string;
  autoMessages: boolean;
  customMessages: string[];
}

interface ChatSettings {
  chatCount: number;
  messageFrequency: string;
  autoRespond: boolean;
  chatBotNames: string[];
  customResponses: Record<string, string>;
}

interface FollowerSettings {
  followerCount: number;
  deliverySpeed: string;
  scheduleDelivery: boolean;
  scheduleTime: string;
}

interface SubscriptionDetailResponse {
  subscription: UserSubscription;
  plan: SubscriptionPlan;
}

// Define default settings
const DEFAULT_VIEWER_SETTINGS: ViewerSettings = {
  viewerCount: 15,
  chatMode: 'moderate',
  autoMessages: true,
  customMessages: []
};

const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  chatCount: 10,
  messageFrequency: 'medium',
  autoRespond: true,
  chatBotNames: [],
  customResponses: {}
};

const DEFAULT_FOLLOWER_SETTINGS: FollowerSettings = {
  followerCount: 25,
  deliverySpeed: 'normal',
  scheduleDelivery: false,
  scheduleTime: ''
};

const BotControl = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  
  // Extract the ID from the query string manually
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const subscriptionId = urlParams.get('id');
  
  // All state variables defined at the beginning
  const [selectedSubscription, setSelectedSubscription] = useState<number | null>(
    subscriptionId ? parseInt(subscriptionId) : null
  );
  const [viewerSettings, setViewerSettings] = useState(DEFAULT_VIEWER_SETTINGS);
  const [customMessage, setCustomMessage] = useState('');
  const [chatSettings, setChatSettings] = useState(DEFAULT_CHAT_SETTINGS);
  const [botName, setBotName] = useState('');
  const [responseKey, setResponseKey] = useState('');
  const [responseValue, setResponseValue] = useState('');
  const [followerSettings, setFollowerSettings] = useState(DEFAULT_FOLLOWER_SETTINGS);
  const [geoTargeting, setGeoTargeting] = useState('');
  const [countryInput, setCountryInput] = useState('');
  const [twitchChannelInput, setTwitchChannelInput] = useState('');
  const [showChannelChangeForm, setShowChannelChangeForm] = useState(false);
  
  // Bot activation states
  const [viewerBotActive, setViewerBotActive] = useState(false);
  const [chatListActive, setChatListActive] = useState(false);
  const [chatBotActive, setChatBotActive] = useState(false);
  const [followerBotActive, setFollowerBotActive] = useState(false);
  
  // Fetch user subscriptions
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<{subscription: UserSubscription; plan: SubscriptionPlan}[]>({
    queryKey: ['/api/user-subscriptions'],
  });
  
  // Fetch detailed subscription data when a subscription is selected
  const { data: subscriptionDetail, isLoading: detailLoading } = useQuery<SubscriptionDetailResponse>({
    queryKey: [`/api/user-subscriptions/${selectedSubscription}`],
    enabled: !!selectedSubscription,
  });
  
  // All mutations
  const updateTwitchChannelMutation = useMutation({
    mutationFn: async (twitchChannel: string) => {
      if (!selectedSubscription) return null;
      
      const res = await apiRequest('PUT', `/api/user-subscriptions/${selectedSubscription}/twitch-channel`, {
        twitchChannel
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Twitch Channel Updated',
        description: 'Your Twitch channel has been saved for this subscription.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/user-subscriptions/${selectedSubscription}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const updateViewerSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubscription) return null;
      
      const res = await apiRequest('PUT', `/api/user-subscriptions/${selectedSubscription}/viewer-settings`, {
        settings: JSON.stringify(viewerSettings)
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Viewer settings updated',
        description: 'Your viewer settings have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/user-subscriptions/${selectedSubscription}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const updateChatSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubscription) return null;
      
      const res = await apiRequest('PUT', `/api/user-subscriptions/${selectedSubscription}/chat-settings`, {
        settings: JSON.stringify(chatSettings)
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Chat settings updated',
        description: 'Your chat settings have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/user-subscriptions/${selectedSubscription}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const updateFollowerSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubscription) return null;
      
      const res = await apiRequest('PUT', `/api/user-subscriptions/${selectedSubscription}/follower-settings`, {
        settings: JSON.stringify(followerSettings)
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Follower settings updated',
        description: 'Your follower settings have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/user-subscriptions/${selectedSubscription}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const updateGeoTargetingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubscription) return null;
      
      const res = await apiRequest('PUT', `/api/user-subscriptions/${selectedSubscription}/geographic-targeting`, {
        countries: geoTargeting
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Geographic targeting updated',
        description: 'Your geographic targeting settings have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/user-subscriptions/${selectedSubscription}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Toggle subscription status
  const toggleSubscriptionMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (!selectedSubscription) return null;
      
      const res = await apiRequest('PUT', `/api/user-subscriptions/${selectedSubscription}/toggle-status`, {
        isActive
      });
      return res.json();
    },
    onSuccess: (data) => {
      const statusText = data.isActive ? 'activated' : 'deactivated';
      toast({
        title: `Subscription ${statusText}`,
        description: `Your subscription has been ${statusText} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/user-subscriptions/${selectedSubscription}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-subscriptions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Status change failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Parse settings when subscription detail loads
  useEffect(() => {
    if (subscriptionDetail) {
      try {
        // Parse viewer settings
        if (subscriptionDetail.subscription?.viewerSettings) {
          const parsedViewerSettings = JSON.parse(subscriptionDetail.subscription.viewerSettings);
          setViewerSettings({
            ...DEFAULT_VIEWER_SETTINGS,
            ...parsedViewerSettings
          });
        }
        
        // Parse chat settings
        if (subscriptionDetail.subscription?.chatSettings) {
          const parsedChatSettings = JSON.parse(subscriptionDetail.subscription.chatSettings);
          setChatSettings({
            ...DEFAULT_CHAT_SETTINGS,
            ...parsedChatSettings
          });
        }
        
        // Parse follower settings
        if (subscriptionDetail.subscription?.followerSettings) {
          const parsedFollowerSettings = JSON.parse(subscriptionDetail.subscription.followerSettings);
          setFollowerSettings({
            ...DEFAULT_FOLLOWER_SETTINGS,
            ...parsedFollowerSettings
          });
        }
        
        // Parse geographic targeting
        if (subscriptionDetail.subscription?.geographicTargeting) {
          setGeoTargeting(subscriptionDetail.subscription.geographicTargeting);
        }
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
  }, [subscriptionDetail]);
  
  // Select first subscription if none selected and subscriptions are loaded
  useEffect(() => {
    if (
      !selectedSubscription && 
      !subscriptionsLoading && 
      subscriptions && 
      subscriptions.length > 0 && 
      !subscriptionId
    ) {
      setSelectedSubscription(subscriptions[0]?.subscription?.id);
    }
  }, [subscriptions, subscriptionsLoading, selectedSubscription, subscriptionId]);
  
  // Helper functions
  const addCustomMessage = () => {
    if (!customMessage.trim()) return;
    
    setViewerSettings(prev => ({
      ...prev,
      customMessages: [...(prev.customMessages || []), customMessage.trim()]
    }));
    
    setCustomMessage('');
  };
  
  const removeCustomMessage = (index: number) => {
    setViewerSettings(prev => ({
      ...prev,
      customMessages: prev.customMessages?.filter((_, i) => i !== index) || []
    }));
  };
  
  const addBotName = () => {
    if (!botName.trim()) return;
    
    setChatSettings(prev => ({
      ...prev,
      chatBotNames: [...(prev.chatBotNames || []), botName.trim()]
    }));
    
    setBotName('');
  };
  
  const removeBotName = (index: number) => {
    setChatSettings(prev => ({
      ...prev,
      chatBotNames: prev.chatBotNames?.filter((_, i) => i !== index) || []
    }));
  };
  
  const addCustomResponse = () => {
    if (!responseKey.trim() || !responseValue.trim()) return;
    
    setChatSettings(prev => ({
      ...prev,
      customResponses: {
        ...(prev.customResponses || {}),
        [responseKey.trim()]: responseValue.trim()
      }
    }));
    
    setResponseKey('');
    setResponseValue('');
  };
  
  const removeCustomResponse = (key: string) => {
    setChatSettings(prev => {
      const responses = { ...(prev.customResponses || {}) };
      delete responses[key];
      return {
        ...prev,
        customResponses: responses
      };
    });
  };
  
  const addCountry = () => {
    if (!countryInput.trim()) return;
    
    const countries = geoTargeting 
      ? geoTargeting.split(',').map(c => c.trim()) 
      : [];
      
    if (!countries.includes(countryInput.trim())) {
      countries.push(countryInput.trim());
    }
    
    setGeoTargeting(countries.join(', '));
    setCountryInput('');
  };
  
  const removeCountry = (country: string) => {
    const countries = geoTargeting
      ? geoTargeting.split(',').map(c => c.trim()).filter(c => c !== country)
      : [];
      
    setGeoTargeting(countries.join(', '));
  };
  
  // Loading state
  if (subscriptionsLoading || (selectedSubscription && detailLoading)) {
    return (
      <div className="flex h-screen bg-gray-100">
        <UserSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }
  
  // No subscriptions state
  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="flex h-screen bg-gray-100">
        <UserSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
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
      </div>
    );
  }
  
  // Check if selected subscription has a Twitch channel
  const currentSubscription = subscriptionDetail?.subscription;
  
  // If the subscription doesn't have a Twitch channel, show the setup form
  if (currentSubscription && !currentSubscription.twitchChannel) {
    return (
      <div className="flex h-screen bg-gray-100">
        <UserSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
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
              
              <Button 
                variant="outline" 
                onClick={() => {
                  // Go back to the main dashboard
                  window.location.href = "/app";
                }}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Main bot control panel
  return (
    <div className="flex h-screen bg-gray-100">
      <UserSidebar />
      
      <div className="flex-1 overflow-auto flex flex-col">
        <Header />
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
                      {subscriptions.map((sub: {subscription: UserSubscription; plan: SubscriptionPlan}) => (
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
                

              </div>
            </div>
          </div>
          
          {/* Status indicator */}
          {currentSubscription && (
            <div className={`mb-6 p-4 rounded-lg ${currentSubscription?.isActive ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${currentSubscription?.isActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'} mr-2`}></div>
                <p className={`text-sm font-medium ${currentSubscription?.isActive ? 'text-green-700' : 'text-yellow-700'}`}>
                  {currentSubscription?.isActive 
                    ? `Services are running for channel: ${currentSubscription?.twitchChannel}`
                    : `Services are currently inactive. Configure your settings and activate your subscription.`}
                </p>
              </div>
              {!currentSubscription?.isActive && (
                <div className="mt-2 text-xs text-yellow-600">
                  You can activate your subscription using the "Activate Services" button from the bot control panel.
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
                      <div className={`w-2 h-2 rounded-full ${currentSubscription?.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                      <span className={`${currentSubscription?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {currentSubscription?.isActive ? 'Services Active' : 'Services Inactive'}
                      </span>
                    </div>
                    {!currentSubscription?.isActive && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs h-7 bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                        onClick={() => {
                          // Toggle subscription activation directly from here
                          toggleSubscriptionMutation.mutate(true);
                        }}
                        disabled={toggleSubscriptionMutation.isPending}
                      >
                        {toggleSubscriptionMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          "Activate Services"
                        )}
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
                        <StatusIndicator active={Boolean(currentSubscription?.isActive && viewerBotActive)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {currentSubscription?.isActive ? 
                            (viewerBotActive ? 
                              `${viewerSettings.viewerCount} viewers currently active` : 
                              'Viewer bot is ready to start') : 
                            'Waiting to be activated'}
                        </div>
                        <Switch 
                          checked={viewerBotActive}
                          disabled={!currentSubscription?.isActive}
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
                        <StatusIndicator active={Boolean(currentSubscription?.isActive && chatListActive)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {currentSubscription?.isActive ? 
                            (chatListActive ? 
                              `${chatSettings.chatCount} chatters in list` : 
                              'Chat list is ready to start') : 
                            'Waiting to be activated'}
                        </div>
                        <Switch 
                          checked={chatListActive}
                          disabled={!currentSubscription?.isActive}
                          onCheckedChange={(checked) => {
                            setChatListActive(checked);
                            if (checked) {
                              toast({
                                title: 'Chat List Activated',
                                description: `Chat list with ${chatSettings.chatCount} chatters has been activated.`,
                              });
                            } else {
                              toast({
                                title: 'Chat List Deactivated',
                                description: 'Chat list has been turned off.',
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Chat Bot Control */}
                  <div className="border rounded-lg p-4 relative overflow-hidden">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-indigo-500" />
                          <h3 className="font-medium">Chat Bot</h3>
                        </div>
                        <div className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium">
                          {chatSettings.chatBotNames?.length || 0} bots
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Simulates chat activity in your Twitch channel
                        </div>
                        <StatusIndicator active={Boolean(currentSubscription?.isActive && chatBotActive)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {currentSubscription?.isActive ? 
                            (chatBotActive ? 
                              `Active with ${chatSettings.messageFrequency} frequency` : 
                              'Chat bot is ready to start') : 
                            'Waiting to be activated'}
                        </div>
                        <Switch 
                          checked={chatBotActive}
                          disabled={!currentSubscription?.isActive}
                          onCheckedChange={(checked) => {
                            setChatBotActive(checked);
                            if (checked) {
                              toast({
                                title: 'Chat Bot Activated',
                                description: `Chat bot with ${chatSettings.messageFrequency} message frequency has been activated.`,
                              });
                            } else {
                              toast({
                                title: 'Chat Bot Deactivated',
                                description: 'Chat bot has been turned off.',
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>


                </div>

                {currentSubscription?.isActive && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-800 flex items-start gap-2">
                    <div className="mt-0.5">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p>Your bots are currently active and running on <strong>{currentSubscription?.twitchChannel}</strong>. 
                      Configure specific settings for each bot type in the tabs below.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentSubscription && subscriptionDetail && subscriptionDetail.plan && (
            <Tabs defaultValue="viewers" className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="viewers" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>Viewers</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat</span>
                </TabsTrigger>
                {subscriptionDetail.plan.geographicTargeting && (
                  <TabsTrigger value="geo" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Geo Targeting</span>
                  </TabsTrigger>
                )}
              </TabsList>
              
              {/* Viewers Tab */}
              <TabsContent value="viewers">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-500" />
                      Viewer Bot Settings
                    </CardTitle>
                    <CardDescription>
                      Configure how many viewers will be added to your stream and their behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label htmlFor="viewer-count">Viewer Count: {viewerSettings.viewerCount}</Label>
                          <span className="text-sm text-gray-500">
                            Max: {subscriptionDetail.plan.viewerCount}
                          </span>
                        </div>
                        <Slider
                          id="viewer-count"
                          value={[viewerSettings.viewerCount]}
                          max={subscriptionDetail.plan.viewerCount}
                          min={1}
                          step={1}
                          onValueChange={(values) => setViewerSettings({
                            ...viewerSettings,
                            viewerCount: values[0]
                          })}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="chat-mode">Chat Mode</Label>
                        <Select
                          value={viewerSettings.chatMode}
                          onValueChange={(value) => setViewerSettings({
                            ...viewerSettings,
                            chatMode: value
                          })}
                        >
                          <SelectTrigger id="chat-mode">
                            <SelectValue placeholder="Select chat mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="quiet">Quiet (Minimal chatting)</SelectItem>
                            <SelectItem value="moderate">Moderate (Regular chatting)</SelectItem>
                            <SelectItem value="active">Active (Frequent chatting)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500">
                          Controls how frequently the viewers will chat in your stream
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="auto-messages"
                          checked={viewerSettings.autoMessages}
                          onCheckedChange={(checked) => setViewerSettings({
                            ...viewerSettings,
                            autoMessages: checked
                          })}
                        />
                        <Label htmlFor="auto-messages">Enable Auto Messages</Label>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Custom Chat Messages</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a custom message for bots to use"
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                          />
                          <Button 
                            type="button" 
                            onClick={addCustomMessage}
                            variant="outline"
                          >
                            Add
                          </Button>
                        </div>
                        {viewerSettings.customMessages && viewerSettings.customMessages.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            {viewerSettings.customMessages.map((message, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm">{message}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => removeCustomMessage(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-2">No custom messages added</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => updateViewerSettingsMutation.mutate()}
                      disabled={updateViewerSettingsMutation.isPending}
                      className="ml-auto"
                    >
                      {updateViewerSettingsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Viewer Settings
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Chat Tab */}
              <TabsContent value="chat">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      Chat Bot Settings
                    </CardTitle>
                    <CardDescription>
                      Configure your chat bot's appearance and behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label htmlFor="chat-count">Chat Bot Count: {chatSettings.chatCount}</Label>
                          <span className="text-sm text-gray-500">
                            Max: {subscriptionDetail.plan.chatCount}
                          </span>
                        </div>
                        <Slider
                          id="chat-count"
                          value={[chatSettings.chatCount]}
                          max={subscriptionDetail.plan.chatCount}
                          min={1}
                          step={1}
                          onValueChange={(values) => setChatSettings({
                            ...chatSettings,
                            chatCount: values[0]
                          })}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="message-frequency">Message Frequency</Label>
                        <Select
                          value={chatSettings.messageFrequency}
                          onValueChange={(value) => setChatSettings({
                            ...chatSettings,
                            messageFrequency: value
                          })}
                        >
                          <SelectTrigger id="message-frequency">
                            <SelectValue placeholder="Select message frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low (Occasional messages)</SelectItem>
                            <SelectItem value="medium">Medium (Regular messages)</SelectItem>
                            <SelectItem value="high">High (Frequent messages)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500">
                          Controls how often bots will chat in your channel
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="auto-respond"
                          checked={chatSettings.autoRespond}
                          onCheckedChange={(checked) => setChatSettings({
                            ...chatSettings,
                            autoRespond: checked
                          })}
                        />
                        <Label htmlFor="auto-respond">Enable Auto Responses</Label>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Custom Bot Names</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a custom bot name"
                            value={botName}
                            onChange={(e) => setBotName(e.target.value)}
                          />
                          <Button 
                            type="button" 
                            onClick={addBotName}
                            variant="outline"
                          >
                            Add
                          </Button>
                        </div>
                        {chatSettings.chatBotNames && chatSettings.chatBotNames.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            {chatSettings.chatBotNames.map((name, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm">{name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => removeBotName(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-2">No custom bot names added</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Custom Responses</Label>
                        <div className="grid grid-cols-1 gap-2">
                          <Input
                            placeholder="Trigger phrase (e.g. !commands)"
                            value={responseKey}
                            onChange={(e) => setResponseKey(e.target.value)}
                          />
                          <Textarea
                            placeholder="Bot response"
                            value={responseValue}
                            onChange={(e) => setResponseValue(e.target.value)}
                            className="min-h-[80px]"
                          />
                          <Button 
                            type="button" 
                            onClick={addCustomResponse}
                            variant="outline"
                            disabled={!responseKey.trim() || !responseValue.trim()}
                          >
                            Add Response
                          </Button>
                        </div>
                        
                        {chatSettings.customResponses && Object.keys(chatSettings.customResponses).length > 0 ? (
                          <div className="mt-2 space-y-2">
                            {Object.entries(chatSettings.customResponses).map(([key, value]) => (
                              <div key={key} className="border p-3 rounded-md bg-gray-50">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium text-sm">{key}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => removeCustomResponse(key)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-sm text-gray-600">{value}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-2">No custom responses added</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => updateChatSettingsMutation.mutate()}
                      disabled={updateChatSettingsMutation.isPending}
                      className="ml-auto"
                    >
                      {updateChatSettingsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Chat Settings
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              

              
              {/* Geographic Targeting Tab */}
              {subscriptionDetail.plan.geographicTargeting && (
                <TabsContent value="geo">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-blue-500" />
                        Geographic Targeting
                      </CardTitle>
                      <CardDescription>
                        Target specific countries for your viewer bots
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-md">
                          <p className="text-sm text-blue-800">
                            Geographic targeting allows you to make your viewers appear from specific countries.
                            This helps simulate a more realistic audience from your target regions.
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Add Countries</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter country name (e.g., United States)"
                              value={countryInput}
                              onChange={(e) => setCountryInput(e.target.value)}
                            />
                            <Button 
                              type="button" 
                              onClick={addCountry}
                              variant="outline"
                              disabled={!countryInput.trim()}
                            >
                              Add
                            </Button>
                          </div>
                          
                          <div className="mt-4">
                            <Label className="mb-2 block">Selected Countries</Label>
                            {geoTargeting ? (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {geoTargeting.split(',').map((country) => (
                                  <div 
                                    key={country.trim()} 
                                    className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm flex items-center"
                                  >
                                    <span>{country.trim()}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 ml-1 hover:bg-blue-200 rounded-full"
                                      onClick={() => removeCountry(country.trim())}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No countries selected. Viewers will appear from random locations.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => updateGeoTargetingMutation.mutate()}
                        disabled={updateGeoTargetingMutation.isPending}
                        className="ml-auto"
                      >
                        {updateGeoTargetingMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Targeting Settings
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default BotControl;