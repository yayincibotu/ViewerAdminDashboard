import React, { ReactNode, useState } from 'react';
import { Bell, Search, MessageSquare, AlertCircle, UserPlus, DollarSign, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';

interface Notification {
  id: number;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

interface AdminHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  title, 
  description, 
  actions 
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch notification data (mock data for now, replace with real API call)
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/admin/notifications'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/notifications');
        if (!res.ok) {
          throw new Error('Failed to fetch notifications');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Return mock data for now
        return [
          {
            id: 1,
            type: 'info',
            title: 'New User Registration',
            message: 'A new user "StreamMaster" has registered.',
            timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
            read: false
          },
          {
            id: 2,
            type: 'success',
            title: 'Payment Received',
            message: 'Payment of $99.99 received from user "GamingPro".',
            timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
            read: false,
            link: '/webadmin/payments'
          },
          {
            id: 3,
            type: 'warning',
            title: 'Multiple Failed Logins',
            message: 'User "TwitchStar" has 3 failed login attempts.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            read: false,
            link: '/webadmin/analytics'
          },
          {
            id: 4,
            type: 'error',
            title: 'Server Issue',
            message: 'Twitch API service temporarily unavailable.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
            read: true
          },
          {
            id: 5,
            type: 'info',
            title: 'System Update',
            message: 'System maintenance scheduled for tonight at 2AM UTC.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
            read: true
          }
        ] as Notification[];
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;
  
  const filteredNotifications = notifications?.filter(notification => {
    // Filter by tab
    if (activeTab !== 'all' && notification.type !== activeTab) {
      return false;
    }
    
    // Filter by search
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'success':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
  };

  const markAllAsRead = () => {
    // Add logic to mark all notifications as read
    console.log('Mark all as read');
  };
  
  const clearAllNotifications = () => {
    // Add logic to clear all notifications
    console.log('Clear all notifications');
  };

  return (
    <div className="sticky top-0 bg-background z-10 border-b border-border p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      <div className="flex items-center space-x-3 mt-2 md:mt-0">
        {/* Real-time activity indicator */}
        <div className="flex items-center mr-2">
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">Live</span>
        </div>
        
        {/* Global Search */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Search className="h-[1.2rem] w-[1.2rem]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 p-0" align="end">
            <div className="p-3 border-b">
              <Input 
                placeholder="Search users, payments, settings..." 
                className="w-full"
                autoFocus
              />
            </div>
            <DropdownMenuLabel>Quick Access</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/webadmin/users">
                <div className="flex items-center">
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>User Management</span>
                </div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/webadmin/payments">
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span>Payment History</span>
                </div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/webadmin/settings">
                <div className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>System Settings</span>
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Notifications */}
        <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-[1.2rem] w-[1.2rem]" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] min-w-[18px] flex items-center justify-center"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[360px] p-0 max-h-[80vh] overflow-hidden flex flex-col" align="end">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-medium">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                )}
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs px-2 h-7"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs px-2 h-7"
                  onClick={clearAllNotifications}
                >
                  Clear all
                </Button>
              </div>
            </div>
            
            <div className="p-3 border-b">
              <Input 
                placeholder="Search notifications..." 
                className="w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <div className="px-4 pt-2 border-b">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="success">Success</TabsTrigger>
                  <TabsTrigger value="warning">Warnings</TabsTrigger>
                  <TabsTrigger value="error">Errors</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value={activeTab} className="flex-1 overflow-y-auto">
                {filteredNotifications.length > 0 ? (
                  <div className="py-1">
                    {filteredNotifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}`}
                      >
                        <div className="flex items-start">
                          <div className="p-1.5 bg-background rounded-full border mr-3">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <p className="font-medium truncate pr-2">{notification.title}</p>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {getTimeAgo(notification.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="font-medium mb-1">No notifications found</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? 'Try a different search term' : 'You\'re all caught up!'}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="p-3 border-t">
              <Button variant="outline" className="w-full text-sm" asChild>
                <Link href="/webadmin/notifications">View All Notifications</Link>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHeader;