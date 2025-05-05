import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Activity, Edit, RefreshCw, Twitch } from 'lucide-react';
import { useState } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';

const Subscriptions: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSubscription, setSelectedSubscription] = useState<number | null>(null);
  const [twitchChannel, setTwitchChannel] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);

  // Fetch user subscriptions
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['/api/user-subscriptions'],
  });

  // Mutation for updating Twitch channel
  const updateChannelMutation = useMutation({
    mutationFn: async ({ id, channel }: { id: number, channel: string }) => {
      const res = await apiRequest('PUT', `/api/user-subscriptions/${id}/twitch-channel`, { twitchChannel: channel });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Twitch channel updated',
        description: 'Your channel has been updated successfully.',
      });
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['/api/user-subscriptions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for toggling subscription activation
  const toggleActivationMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const res = await apiRequest('PUT', `/api/user-subscriptions/${id}/toggle`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Subscription updated',
        description: 'Subscription status has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user-subscriptions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle selecting a subscription
  const handleSelectSubscription = (subscription: any) => {
    setSelectedSubscription(subscription.subscription.id);
    setTwitchChannel(subscription.subscription.twitchChannel || '');
    setEditMode(false);
  };

  // Handle updating the Twitch channel
  const handleUpdateChannel = () => {
    if (!twitchChannel.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid Twitch channel name.',
        variant: 'destructive',
      });
      return;
    }

    updateChannelMutation.mutate({
      id: selectedSubscription!,
      channel: twitchChannel.trim(),
    });
  };

  // Handle toggling activation
  const handleToggleActivation = (id: number, isActive: boolean) => {
    toggleActivationMutation.mutate({ id, isActive });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasSubscriptions = Array.isArray(subscriptions) && subscriptions.length > 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Subscriptions</h1>
            <p className="text-gray-500">Manage your active subscriptions and channel settings</p>
          </div>
        </div>
        
        {!hasSubscriptions ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-lg p-8 text-center shadow">
            <Activity className="h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Subscriptions Found</h2>
            <p className="text-gray-500 mb-6">You don't have any active subscriptions yet. Purchase a plan to get started.</p>
            <Button className="bg-primary-600 hover:bg-primary-700" asChild>
              <a href="/#pricing">View Plans</a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Subscription List */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-medium mb-4">Your Plans</h2>
              <div className="space-y-4">
                {Array.isArray(subscriptions) && subscriptions.map((subscription: any) => (
                  <Card 
                    key={subscription.subscription.id} 
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedSubscription === subscription.subscription.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleSelectSubscription(subscription)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{subscription.plan.name}</CardTitle>
                        <Badge variant={subscription.subscription.isActive ? "default" : "outline"}>
                          {subscription.subscription.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <CardDescription>
                        {subscription.plan.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex items-center text-sm">
                        <Twitch className="h-4 w-4 mr-2 text-purple-500" />
                        <span>
                          {subscription.subscription.twitchChannel 
                            ? `Channel: ${subscription.subscription.twitchChannel}` 
                            : 'No channel set'}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between">
                      <div className="text-sm text-gray-500">
                        Valid until {new Date(subscription.subscription.endDate).toLocaleDateString()}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Subscription Details */}
            <div className="lg:col-span-2">
              {selectedSubscription ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Settings</CardTitle>
                    <CardDescription>
                      Configure your channel and bot settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Twitch Channel Settings */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Twitch Channel</h3>
                      <div className="flex items-end gap-3">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="twitch-channel">Channel Name</Label>
                          <Input 
                            id="twitch-channel" 
                            value={twitchChannel} 
                            onChange={(e) => setTwitchChannel(e.target.value)} 
                            placeholder="Enter your Twitch channel name"
                            disabled={!editMode && Boolean(twitchChannel)}
                          />
                        </div>
                        {twitchChannel && !editMode ? (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => setEditMode(true)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            onClick={handleUpdateChannel}
                            disabled={updateChannelMutation.isPending}
                          >
                            {updateChannelMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Save
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        This is the Twitch channel where our services will be applied.
                      </p>
                    </div>
                    
                    <Separator />
                    
                    {/* Service Status */}
                    {Array.isArray(subscriptions) && subscriptions.map((subscription: any) => {
                      if (subscription.subscription.id === selectedSubscription) {
                        return (
                          <div key={subscription.subscription.id}>
                            <h3 className="text-lg font-medium mb-4">Service Status</h3>
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center space-x-2">
                                <RefreshCw className="h-5 w-5 text-gray-500" />
                                <Label htmlFor="service-status" className="font-medium">
                                  Activate Services
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch 
                                  id="service-status" 
                                  checked={subscription.subscription.isActive}
                                  disabled={!subscription.subscription.twitchChannel || toggleActivationMutation.isPending}
                                  onCheckedChange={(checked) => 
                                    handleToggleActivation(subscription.subscription.id, checked)
                                  }
                                />
                                <Label className={subscription.subscription.isActive ? "text-green-600" : "text-gray-500"}>
                                  {subscription.subscription.isActive ? "Running" : "Stopped"}
                                </Label>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                              {!subscription.subscription.twitchChannel 
                                ? "You must set a Twitch channel before activating services." 
                                : "Toggle this switch to start or stop the services for this subscription."}
                            </p>
                            
                            {subscription.subscription.isActive && (
                              <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                                  <p className="text-sm font-medium text-green-700">
                                    Services are currently active for {subscription.subscription.twitchChannel}
                                  </p>
                                </div>
                                <p className="text-xs text-green-600 mt-1">
                                  Last activated: {subscription.subscription.lastActivated 
                                    ? new Date(subscription.subscription.lastActivated).toLocaleString() 
                                    : 'N/A'}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-6">
                    <Button variant="outline" asChild>
                      <a href="/app/bot-control">Advanced Settings</a>
                    </Button>
                    <Button asChild>
                      <a href={`/app/bot-control?id=${selectedSubscription}`}>
                        Bot Control Panel
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg p-8 text-center shadow">
                  <Twitch className="h-12 w-12 text-purple-500 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Select a Subscription</h2>
                  <p className="text-gray-500">
                    Choose a subscription from the list to view and manage its settings.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscriptions;