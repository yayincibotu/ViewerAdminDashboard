import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlayCircle, StopCircle, Users, MessageSquare, UserPlus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SubscriptionWithPlan {
  subscription: {
    id: number;
    userId: number;
    planId: number;
    status: string;
    startDate: string;
    endDate: string;
    stripeSubscriptionId: string | null;
    twitchChannel: string | null;
    isActive: boolean;
    viewerSettings: string;
    chatSettings: string;
    followerSettings: string;
    geographicTargeting: string | null;
    servicesStatus: string;
  };
  plan: {
    id: number;
    name: string;
    price: number;
    description: string;
    viewerCount: number;
    chatCount: number;
    followerCount: number;
    geographicTargeting: boolean;
  };
}

const BotControl = () => {
  const { toast } = useToast();
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null);
  
  // Fetch user subscriptions
  const { data: subscriptions, isLoading } = useQuery<SubscriptionWithPlan[]>({
    queryKey: ["/api/user-subscriptions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Find the selected subscription
  const selectedSubscription = subscriptions?.find(
    (sub) => sub.subscription.id === selectedSubscriptionId
  );

  // Parse service statuses
  const servicesStatus = selectedSubscription?.subscription.servicesStatus 
    ? JSON.parse(selectedSubscription.subscription.servicesStatus) 
    : { viewers: false, chat: false, followers: false };

  // Set the first subscription as selected by default
  useEffect(() => {
    if (subscriptions && subscriptions.length > 0 && !selectedSubscriptionId) {
      setSelectedSubscriptionId(subscriptions[0].subscription.id);
    }
  }, [subscriptions, selectedSubscriptionId]);

  // Toggle service (viewers, chat, followers)
  const toggleServiceMutation = useMutation({
    mutationFn: async ({ 
      subscriptionId, 
      serviceType, 
      isActive 
    }: { 
      subscriptionId: number; 
      serviceType: string; 
      isActive: boolean 
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/user-subscriptions/${subscriptionId}/service/${serviceType}`,
        { isActive }
      );
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate the subscription query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/user-subscriptions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleService = (serviceType: string, currentStatus: boolean) => {
    if (!selectedSubscriptionId) return;

    // Check if the subscription is active
    if (!selectedSubscription?.subscription.isActive) {
      toast({
        title: "Subscription Inactive",
        description: "Please activate your subscription first before starting services.",
        variant: "destructive",
      });
      return;
    }

    // Check if Twitch channel is set
    if (!selectedSubscription?.subscription.twitchChannel) {
      toast({
        title: "No Twitch Channel",
        description: "Please set a Twitch channel for this subscription before starting services.",
        variant: "destructive",
      });
      return;
    }

    toggleServiceMutation.mutate({
      subscriptionId: selectedSubscriptionId,
      serviceType,
      isActive: !currentStatus,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <Alert>
        <AlertTitle>No Subscriptions Found</AlertTitle>
        <AlertDescription>
          You don't have any active subscriptions. Please purchase a subscription to access bot controls.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Bot Control Panel</h1>
        <p className="text-muted-foreground">
          Control your Twitch bots and monitor their status
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Select Subscription</CardTitle>
            
            {selectedSubscription && (
              <Badge variant={selectedSubscription.subscription.isActive ? "default" : "destructive"}>
                {selectedSubscription.subscription.isActive ? "Active" : "Inactive"}
              </Badge>
            )}
          </div>
          <CardDescription>
            Choose the subscription plan you want to control
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedSubscriptionId?.toString() || ""}
            onValueChange={(value) => setSelectedSubscriptionId(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a subscription plan" />
            </SelectTrigger>
            <SelectContent>
              {subscriptions.map((sub) => (
                <SelectItem key={sub.subscription.id} value={sub.subscription.id.toString()}>
                  {sub.plan.name} {sub.subscription.twitchChannel ? `(${sub.subscription.twitchChannel})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedSubscription && !selectedSubscription.subscription.twitchChannel && (
            <Alert className="mt-4" variant="destructive">
              <AlertTitle>No Twitch Channel Set</AlertTitle>
              <AlertDescription>
                Please set a Twitch channel for this subscription in the Subscriptions page.
              </AlertDescription>
            </Alert>
          )}

          {selectedSubscription && !selectedSubscription.subscription.isActive && (
            <Alert className="mt-4" variant="destructive">
              <AlertTitle>Subscription Inactive</AlertTitle>
              <AlertDescription>
                This subscription is currently inactive. Please activate it in the Subscriptions page.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {selectedSubscription && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Twitch Channel: {selectedSubscription.subscription.twitchChannel || "Not Set"}</CardTitle>
              <CardDescription>
                Controlling services for {selectedSubscription.plan.name} ({selectedSubscription.plan.description})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Viewer Bot Control */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Viewer Bot</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="viewers-toggle">
                      {servicesStatus.viewers ? "Running" : "Stopped"}
                    </Label>
                    <Switch
                      id="viewers-toggle"
                      checked={servicesStatus.viewers}
                      onCheckedChange={() => handleToggleService("viewers", servicesStatus.viewers)}
                      disabled={
                        toggleServiceMutation.isPending ||
                        !selectedSubscription.subscription.isActive ||
                        !selectedSubscription.subscription.twitchChannel
                      }
                    />
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm">
                    <span className="font-medium">Status:</span>{" "}
                    {servicesStatus.viewers ? (
                      <span className="text-green-500">
                        {selectedSubscription.plan.viewerCount} viewers currently active on {selectedSubscription.subscription.twitchChannel}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not currently running</span>
                    )}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Max Viewers:</span>{" "}
                    {selectedSubscription.plan.viewerCount}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Chat Bot Control */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Chat Bot</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="chat-toggle">
                      {servicesStatus.chat ? "Running" : "Stopped"}
                    </Label>
                    <Switch
                      id="chat-toggle"
                      checked={servicesStatus.chat}
                      onCheckedChange={() => handleToggleService("chat", servicesStatus.chat)}
                      disabled={
                        toggleServiceMutation.isPending ||
                        !selectedSubscription.subscription.isActive ||
                        !selectedSubscription.subscription.twitchChannel
                      }
                    />
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm">
                    <span className="font-medium">Status:</span>{" "}
                    {servicesStatus.chat ? (
                      <span className="text-green-500">
                        {selectedSubscription.plan.chatCount} chat bots currently active on {selectedSubscription.subscription.twitchChannel}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not currently running</span>
                    )}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Max Chat Bots:</span>{" "}
                    {selectedSubscription.plan.chatCount}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Follower Bot Control */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Follower Bot</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="followers-toggle">
                      {servicesStatus.followers ? "Running" : "Stopped"}
                    </Label>
                    <Switch
                      id="followers-toggle"
                      checked={servicesStatus.followers}
                      onCheckedChange={() => handleToggleService("followers", servicesStatus.followers)}
                      disabled={
                        toggleServiceMutation.isPending ||
                        !selectedSubscription.subscription.isActive ||
                        !selectedSubscription.subscription.twitchChannel
                      }
                    />
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm">
                    <span className="font-medium">Status:</span>{" "}
                    {servicesStatus.followers ? (
                      <span className="text-green-500">
                        Adding {selectedSubscription.plan.followerCount} followers to {selectedSubscription.subscription.twitchChannel}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not currently running</span>
                    )}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Max Followers:</span>{" "}
                    {selectedSubscription.plan.followerCount}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  if (!selectedSubscriptionId) return;
                  // Turn all services off
                  toggleServiceMutation.mutate({
                    subscriptionId: selectedSubscriptionId,
                    serviceType: "viewers",
                    isActive: false,
                  });
                  toggleServiceMutation.mutate({
                    subscriptionId: selectedSubscriptionId,
                    serviceType: "chat",
                    isActive: false,
                  });
                  toggleServiceMutation.mutate({
                    subscriptionId: selectedSubscriptionId,
                    serviceType: "followers",
                    isActive: false,
                  });
                }}
                disabled={
                  toggleServiceMutation.isPending ||
                  !selectedSubscription.subscription.isActive ||
                  !selectedSubscription.subscription.twitchChannel ||
                  (!servicesStatus.viewers && !servicesStatus.chat && !servicesStatus.followers)
                }
              >
                {toggleServiceMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <StopCircle className="h-4 w-4 mr-2" />
                )}
                Stop All Services
              </Button>
              <Button
                onClick={() => {
                  if (!selectedSubscriptionId) return;
                  // Turn all services on
                  toggleServiceMutation.mutate({
                    subscriptionId: selectedSubscriptionId,
                    serviceType: "viewers",
                    isActive: true,
                  });
                  toggleServiceMutation.mutate({
                    subscriptionId: selectedSubscriptionId,
                    serviceType: "chat",
                    isActive: true,
                  });
                  toggleServiceMutation.mutate({
                    subscriptionId: selectedSubscriptionId,
                    serviceType: "followers",
                    isActive: true,
                  });
                }}
                disabled={
                  toggleServiceMutation.isPending ||
                  !selectedSubscription.subscription.isActive ||
                  !selectedSubscription.subscription.twitchChannel ||
                  (servicesStatus.viewers && servicesStatus.chat && servicesStatus.followers)
                }
              >
                {toggleServiceMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4 mr-2" />
                )}
                Start All Services
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
};

export default BotControl;