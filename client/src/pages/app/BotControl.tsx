import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import UserSidebar from '@/components/dashboard/UserSidebar';
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
  Twitch
} from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';

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
  const [selectedSubscription, setSelectedSubscription] = useState<number | null>(subscriptionId ? parseInt(subscriptionId) : null);
  
  // Viewer settings state
  const [viewerSettings, setViewerSettings] = useState(DEFAULT_VIEWER_SETTINGS);
  const [customMessage, setCustomMessage] = useState('');
  
  // Chat settings state
  const [chatSettings, setChatSettings] = useState(DEFAULT_CHAT_SETTINGS);
  const [botName, setBotName] = useState('');
  const [responseKey, setResponseKey] = useState('');
  const [responseValue, setResponseValue] = useState('');
  
  // Follower settings state
  const [followerSettings, setFollowerSettings] = useState(DEFAULT_FOLLOWER_SETTINGS);
  
  // Geo targeting state
  const [geoTargeting, setGeoTargeting] = useState('');
  const [countryInput, setCountryInput] = useState('');
  
  // Fetch user subscriptions
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['/api/user-subscriptions'],
  });
  
  // Fetch detailed subscription data when a subscription is selected
  const { data: subscriptionDetail, isLoading: detailLoading } = useQuery({
    queryKey: [`/api/user-subscriptions/${selectedSubscription}`],
    enabled: !!selectedSubscription,
  });
  
  // Parse settings when subscription detail loads
  useEffect(() => {
    if (subscriptionDetail) {
      try {
        // Parse viewer settings
        if (subscriptionDetail.subscription.viewerSettings) {
          const parsedViewerSettings = JSON.parse(subscriptionDetail.subscription.viewerSettings);
          setViewerSettings({
            ...DEFAULT_VIEWER_SETTINGS,
            ...parsedViewerSettings
          });
        }
        
        // Parse chat settings
        if (subscriptionDetail.subscription.chatSettings) {
          const parsedChatSettings = JSON.parse(subscriptionDetail.subscription.chatSettings);
          setChatSettings({
            ...DEFAULT_CHAT_SETTINGS,
            ...parsedChatSettings
          });
        }
        
        // Parse follower settings
        if (subscriptionDetail.subscription.followerSettings) {
          const parsedFollowerSettings = JSON.parse(subscriptionDetail.subscription.followerSettings);
          setFollowerSettings({
            ...DEFAULT_FOLLOWER_SETTINGS,
            ...parsedFollowerSettings
          });
        }
        
        // Parse geographic targeting
        if (subscriptionDetail.subscription.geographicTargeting) {
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
      subscriptions.length > 0 && 
      !subscriptionId
    ) {
      setSelectedSubscription(subscriptions[0].subscription.id);
    }
  }, [subscriptions, subscriptionsLoading, selectedSubscription, subscriptionId]);
  
  // Viewer settings update mutation
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
  
  // Chat settings update mutation
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
  
  // Follower settings update mutation
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
  
  // Geographic targeting update mutation
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
  
  // Add custom message to viewer settings
  const addCustomMessage = () => {
    if (!customMessage.trim()) return;
    
    setViewerSettings(prev => ({
      ...prev,
      customMessages: [...(prev.customMessages || []), customMessage.trim()]
    }));
    
    setCustomMessage('');
  };
  
  // Remove custom message from viewer settings
  const removeCustomMessage = (index: number) => {
    setViewerSettings(prev => ({
      ...prev,
      customMessages: prev.customMessages?.filter((_, i) => i !== index) || []
    }));
  };
  
  // Add bot name to chat settings
  const addBotName = () => {
    if (!botName.trim()) return;
    
    setChatSettings(prev => ({
      ...prev,
      chatBotNames: [...(prev.chatBotNames || []), botName.trim()]
    }));
    
    setBotName('');
  };
  
  // Remove bot name from chat settings
  const removeBotName = (index: number) => {
    setChatSettings(prev => ({
      ...prev,
      chatBotNames: prev.chatBotNames?.filter((_, i) => i !== index) || []
    }));
  };
  
  // Add custom response to chat settings
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
  
  // Remove custom response from chat settings
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
  
  // Add country to geographic targeting
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
  
  // Remove country from geographic targeting
  const removeCountry = (country: string) => {
    const countries = geoTargeting
      ? geoTargeting.split(',').map(c => c.trim()).filter(c => c !== country)
      : [];
      
    setGeoTargeting(countries.join(', '));
  };
  
  if (subscriptionsLoading || (selectedSubscription && detailLoading)) {
    return (
      <div className="flex h-screen bg-gray-100">
        <UserSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Check if user has any subscriptions
  if (subscriptions.length === 0) {
    return (
      <div className="flex h-screen bg-gray-100">
        <UserSidebar />
        <div className="flex-1 p-8">
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
  if (currentSubscription && !currentSubscription.twitchChannel) {
    return (
      <div className="flex h-screen bg-gray-100">
        <UserSidebar />
        <div className="flex-1 p-8">
          <div className="flex flex-col items-center justify-center bg-white rounded-lg p-8 text-center shadow">
            <div className="rounded-full bg-yellow-100 p-4 mb-4">
              <Twitch className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Twitch Channel Required</h2>
            <p className="text-gray-500 mb-6">
              You need to set a Twitch channel for your subscription before you can use the bot control panel.
            </p>
            <Button asChild>
              <a href="/app/subscriptions">Configure Channel</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <UserSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Bot Control Panel</h1>
              <p className="text-gray-500">Configure your Twitch bot settings</p>
            </div>
            
            {/* Subscription selector */}
            {subscriptions.length > 1 && (
              <div className="w-64">
                <Select
                  value={selectedSubscription?.toString()}
                  onValueChange={(value) => setSelectedSubscription(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a subscription" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptions.map((sub: any) => (
                      <SelectItem key={sub.subscription.id} value={sub.subscription.id.toString()}>
                        {sub.plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
          
          {currentSubscription && subscriptionDetail && (
            <Tabs defaultValue="viewers" className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="viewers" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>Viewers</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat</span>
                </TabsTrigger>
                <TabsTrigger value="followers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Followers</span>
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
                                  onClick={() => removeCustomMessage(index)}
                                >
                                  &times;
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-2">
                            No custom messages added yet. Add messages above.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-6 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setViewerSettings(DEFAULT_VIEWER_SETTINGS)}
                    >
                      Reset to Default
                    </Button>
                    <Button
                      onClick={() => updateViewerSettingsMutation.mutate()}
                      disabled={updateViewerSettingsMutation.isPending}
                    >
                      {updateViewerSettingsMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Settings
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Chat Tab */}
              <TabsContent value="chat">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                      Chat Bot Settings
                    </CardTitle>
                    <CardDescription>
                      Configure chat bots and their behavior in your stream
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
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low (Occasional messages)</SelectItem>
                            <SelectItem value="medium">Medium (Regular messages)</SelectItem>
                            <SelectItem value="high">High (Frequent messages)</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Label htmlFor="auto-respond">Auto-Respond to Messages</Label>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Custom Bot Names</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a username for your chat bots"
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
                                  onClick={() => removeBotName(index)}
                                >
                                  &times;
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-2">
                            No bot names added yet. Random names will be used.
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Custom Responses</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input
                            placeholder="When someone says this..."
                            value={responseKey}
                            onChange={(e) => setResponseKey(e.target.value)}
                          />
                          <Input
                            placeholder="Bot will respond with this..."
                            value={responseValue}
                            onChange={(e) => setResponseValue(e.target.value)}
                          />
                        </div>
                        <Button 
                          type="button" 
                          onClick={addCustomResponse}
                          variant="outline"
                          className="w-full mt-2"
                        >
                          Add Response
                        </Button>
                        {chatSettings.customResponses && Object.keys(chatSettings.customResponses).length > 0 ? (
                          <div className="mt-2 space-y-2">
                            {Object.entries(chatSettings.customResponses).map(([key, value]) => (
                              <div key={key} className="p-2 bg-gray-50 rounded">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-xs">Trigger:</span>
                                    <span className="text-sm">{key}</span>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => removeCustomResponse(key)}
                                  >
                                    &times;
                                  </Button>
                                </div>
                                <div className="mt-1 pl-4 border-l-2 border-gray-200">
                                  <span className="text-xs text-gray-500">Response:</span>
                                  <p className="text-sm">{value}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-2">
                            No custom responses added yet. Bots will use default responses.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-6 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setChatSettings(DEFAULT_CHAT_SETTINGS)}
                    >
                      Reset to Default
                    </Button>
                    <Button
                      onClick={() => updateChatSettingsMutation.mutate()}
                      disabled={updateChatSettingsMutation.isPending}
                    >
                      {updateChatSettingsMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Settings
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Followers Tab */}
              <TabsContent value="followers">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-500" />
                      Follower Bot Settings
                    </CardTitle>
                    <CardDescription>
                      Configure follower behavior and delivery schedule
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label htmlFor="follower-count">Follower Count: {followerSettings.followerCount}</Label>
                          <span className="text-sm text-gray-500">
                            Max: {subscriptionDetail.plan.followerCount}
                          </span>
                        </div>
                        <Slider
                          id="follower-count"
                          value={[followerSettings.followerCount]}
                          max={subscriptionDetail.plan.followerCount}
                          min={1}
                          step={1}
                          onValueChange={(values) => setFollowerSettings({
                            ...followerSettings,
                            followerCount: values[0]
                          })}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="delivery-speed">Delivery Speed</Label>
                        <Select
                          value={followerSettings.deliverySpeed}
                          onValueChange={(value) => setFollowerSettings({
                            ...followerSettings,
                            deliverySpeed: value
                          })}
                        >
                          <SelectTrigger id="delivery-speed">
                            <SelectValue placeholder="Select delivery speed" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slow">Slow (Over several days)</SelectItem>
                            <SelectItem value="normal">Normal (Over 24 hours)</SelectItem>
                            <SelectItem value="fast">Fast (Over a few hours)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="schedule-delivery"
                            checked={followerSettings.scheduleDelivery}
                            onCheckedChange={(checked) => setFollowerSettings({
                              ...followerSettings,
                              scheduleDelivery: checked
                            })}
                          />
                          <Label htmlFor="schedule-delivery">Schedule Delivery</Label>
                        </div>
                        
                        {followerSettings.scheduleDelivery && (
                          <div className="mt-2">
                            <Label htmlFor="schedule-time">Start Time</Label>
                            <Input
                              id="schedule-time"
                              type="time"
                              value={followerSettings.scheduleTime}
                              onChange={(e) => setFollowerSettings({
                                ...followerSettings,
                                scheduleTime: e.target.value
                              })}
                              className="mt-1"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Follower delivery will start at this time in your local timezone
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-6 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setFollowerSettings(DEFAULT_FOLLOWER_SETTINGS)}
                    >
                      Reset to Default
                    </Button>
                    <Button
                      onClick={() => updateFollowerSettingsMutation.mutate()}
                      disabled={updateFollowerSettingsMutation.isPending}
                    >
                      {updateFollowerSettingsMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Settings
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Geo Targeting Tab */}
              {subscriptionDetail.plan.geographicTargeting && (
                <TabsContent value="geo">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-blue-500" />
                        Geographic Targeting
                      </CardTitle>
                      <CardDescription>
                        Configure the countries your viewers will appear to be from
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <p className="text-sm text-gray-700 mb-4">
                          Geographic targeting allows you to specify which countries your viewers will appear to come from.
                          This helps make your audience seem more realistic and can be important for regional content.
                        </p>
                        
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter a country name (e.g. USA, Germany, Brazil)"
                              value={countryInput}
                              onChange={(e) => setCountryInput(e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              type="button" 
                              onClick={addCountry}
                              variant="outline"
                            >
                              Add
                            </Button>
                          </div>
                          
                          <div>
                            <Label className="mb-2 block">Selected Countries</Label>
                            {geoTargeting ? (
                              <div className="flex flex-wrap gap-2">
                                {geoTargeting.split(',').map((country) => (
                                  <div 
                                    key={country.trim()} 
                                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full flex items-center text-sm"
                                  >
                                    {country.trim()}
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-5 w-5 p-0 ml-1"
                                      onClick={() => removeCountry(country.trim())}
                                    >
                                      &times;
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 p-4 border border-dashed rounded-md text-center">
                                No countries selected. Viewers will come from all regions by default.
                              </div>
                            )}
                          </div>
                          
                          <div className="bg-blue-50 p-4 rounded-md">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-blue-600" />
                              <h3 className="font-medium text-blue-700">Pro Tip</h3>
                            </div>
                            <p className="text-sm text-blue-600">
                              For best results, select countries that match your target audience or content language.
                              If left empty, viewers will be distributed across all regions.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6 flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setGeoTargeting('')}
                      >
                        Reset to Default
                      </Button>
                      <Button
                        onClick={() => updateGeoTargetingMutation.mutate()}
                        disabled={updateGeoTargetingMutation.isPending}
                      >
                        {updateGeoTargetingMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Settings
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