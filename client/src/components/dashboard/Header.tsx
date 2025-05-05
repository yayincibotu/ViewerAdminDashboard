import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { 
  CreditCard, 
  Settings, 
  UserCircle, 
  Bot, 
  LogOut, 
  ChevronDown,
  Users,
  MessageSquare,
  Twitch,
  Activity,
  Eye, 
  Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

const Header = () => {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();

  // Fetch user subscriptions
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['/api/user-subscriptions'],
    enabled: !!user,
  });

  // Get active subscription
  const activeSubscription = Array.isArray(subscriptions) && subscriptions.length > 0 
    ? subscriptions[0] 
    : null;

  // Check if user has a subscription
  const hasSubscription = !!activeSubscription;

  // Determine which bot features the user has access to
  const hasTwitchViewersBot = hasSubscription && activeSubscription?.plan?.viewerCount > 0;
  const hasChatBot = hasSubscription && activeSubscription?.plan?.chatBotEnabled;
  const hasFollowerBot = hasSubscription && activeSubscription?.plan?.followerBotEnabled;

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate('/');
  };

  if (!user) return null;

  return (
    <header className="border-b bg-white sticky top-0 z-50 w-full">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="ml-auto flex items-center space-x-4">
          {!isMobile && (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent">
                    <Bot className="mr-2 h-4 w-4" />
                    Bot Control
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {hasTwitchViewersBot && (
                        <ListItem
                          href="/app/bot-control?tab=viewers"
                          title="Twitch Viewers Bot"
                        >
                          Manage your Twitch viewers with our powerful viewbot.
                        </ListItem>
                      )}
                      
                      {hasChatBot && (
                        <ListItem
                          href="/app/bot-control?tab=chat"
                          title="Chat Bot"
                        >
                          Automate your Twitch chat with customizable chat messages.
                        </ListItem>
                      )}
                      
                      {hasFollowerBot && (
                        <ListItem
                          href="/app/bot-control?tab=followers"
                          title="Follower Bot"
                        >
                          Boost your Twitch followers and grow your channel.
                        </ListItem>
                      )}
                      
                      {(!hasTwitchViewersBot && !hasChatBot && !hasFollowerBot) && (
                        <ListItem
                          href="/app/subscriptions"
                          title="No Active Bots"
                        >
                          You don't have any active bot subscriptions. Get one now!
                        </ListItem>
                      )}
                      
                      <ListItem
                        href="/app/bot-control"
                        title="All Bot Controls"
                      >
                        Access all your available bot controls and settings.
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link href="/app/billing">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link href="/app/settings">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link href="/app/profile">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      <UserCircle className="mr-2 h-4 w-4" />
                      Profile
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" alt={user.username} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <Link href="/app/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <Link href="/app/billing">Billing</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <Link href="/app/settings">Settings</Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              
              {/* Bot Controls for mobile */}
              {isMobile && (
                <>
                  <DropdownMenuLabel>Bot Controls</DropdownMenuLabel>
                  {hasTwitchViewersBot && (
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      <Link href="/app/bot-control?tab=viewers">Viewers Bot</Link>
                    </DropdownMenuItem>
                  )}
                  {hasChatBot && (
                    <DropdownMenuItem>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <Link href="/app/bot-control?tab=chat">Chat Bot</Link>
                    </DropdownMenuItem>
                  )}
                  {hasFollowerBot && (
                    <DropdownMenuItem>
                      <Users className="mr-2 h-4 w-4" />
                      <Link href="/app/bot-control?tab=followers">Follower Bot</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Bot className="mr-2 h-4 w-4" />
                    <Link href="/app/bot-control">All Bot Controls</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;