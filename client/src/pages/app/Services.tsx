import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import UserSidebar from '@/components/dashboard/UserSidebar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, Zap } from 'lucide-react';
import { Link } from 'wouter';

// Bot viewer interface
interface BotViewerFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Services: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch user subscriptions
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['/api/user-subscriptions'],
  });
  
  // Fetch available platforms
  const { data: platforms = [], isLoading: platformsLoading } = useQuery({
    queryKey: ['/api/platforms'],
  });
  
  // Check if user has any active subscriptions
  const hasActiveSubscription = subscriptions.length > 0;
  
  // Common bot features
  const botViewerFeatures: BotViewerFeature[] = [
    {
      icon: <div className="rounded-full bg-blue-100 p-2"><Zap className="h-5 w-5 text-blue-600" /></div>,
      title: "Twitch Live Viewers",
      description: "Boost your viewer count with realistic, random viewers who stay in your stream.",
    },
    {
      icon: <div className="rounded-full bg-purple-100 p-2"><i className="fas fa-comments h-5 w-5 text-purple-600" /></div>,
      title: "Chat Bot",
      description: "Automated chatters that engage with your content and simulate real conversation.",
    },
    {
      icon: <div className="rounded-full bg-green-100 p-2"><i className="fas fa-user-plus h-5 w-5 text-green-600" /></div>,
      title: "Twitch Followers",
      description: "Organic growth with followers that look authentic and boost your channel credibility.",
    },
    {
      icon: <div className="rounded-full bg-orange-100 p-2"><Settings className="h-5 w-5 text-orange-600" /></div>,
      title: "Customization",
      description: "Tailor bot behavior, chat frequency, and viewer count to your specific needs.",
    },
  ];
  
  if (isLoading || platformsLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <UserSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              <h1 className="text-2xl font-bold">Services</h1>
              <p className="text-gray-500">Explore our bot services and solutions</p>
            </div>
            {hasActiveSubscription && (
              <Link href="/app/subscriptions">
                <Button>Manage Subscriptions</Button>
              </Link>
            )}
          </div>
          
          {/* Services Overview */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-6">Boost Your Stream</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {botViewerFeatures.map((feature, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-4">
                      {feature.icon}
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Platform Services */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Available Platforms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platforms.map((platform: any) => (
                <Card key={platform.id} className={`border border-gray-200 overflow-hidden`}>
                  <div className={`${platform.bgColor} h-2 w-full`}></div>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`${platform.bgColor} rounded-full w-10 h-10 flex items-center justify-center text-white`}>
                        <i className={`${platform.iconClass}`}></i>
                      </div>
                      <CardTitle>{platform.name}</CardTitle>
                    </div>
                    <CardDescription>
                      {platform.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <h4 className="text-sm font-medium">Available Services:</h4>
                    <ul className="space-y-1">
                      <li className="text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span>Live Viewers</span>
                      </li>
                      <li className="text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span>Chatters</span>
                      </li>
                      <li className="text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span>Followers</span>
                      </li>
                      {platform.name === "Twitch" && (
                        <li className="text-sm flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          <span>Chat List</span>
                        </li>
                      )}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {hasActiveSubscription ? (
                      <Link href="/app/subscriptions">
                        <Button variant="outline" className="w-full">View Your Subscriptions</Button>
                      </Link>
                    ) : (
                      <Link href="/#pricing">
                        <Button className="w-full">Get Started</Button>
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Call to action for users without subscriptions */}
          {!hasActiveSubscription && (
            <div className="mt-12 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg shadow-lg overflow-hidden">
              <div className="px-8 py-10 text-white">
                <h2 className="text-2xl font-bold mb-4">Ready to boost your channel?</h2>
                <p className="mb-6 text-white/90 max-w-2xl">
                  Get instant access to our premium Twitch growth services. Choose the plan that fits your streaming goals and start growing today.
                </p>
                <Link href="/#pricing">
                  <Button variant="secondary" size="lg">
                    View Pricing Plans
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Services;