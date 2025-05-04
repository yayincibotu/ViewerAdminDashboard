import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import Logo from '../Logo';

const UserSidebar: React.FC = () => {
  const [location] = useLocation();
  const { user } = useAuth();

  const isActivePath = (path: string) => {
    return location === path ? 'bg-sidebar-accent text-white' : 'text-sidebar-foreground hover:bg-sidebar-accent/50';
  };

  if (!user) return null;

  return (
    <div className="w-64 h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      <div className="p-6">
        <Logo textColorClass="text-white" />
      </div>
      
      <div className="px-3 py-2">
        <div className="mb-2 px-4 text-xs font-semibold text-sidebar-foreground/60 uppercase">
          Main
        </div>
        <nav className="space-y-1">
          <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/app')}`}>
            <Link href="/app">
              <div className="flex items-center w-full">
                <i className="fas fa-home mr-3"></i>
                Dashboard
              </div>
            </Link>
          </div>
          
          <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/app/services')}`}>
            <Link href="/app/services">
              <div className="flex items-center w-full">
                <i className="fas fa-layer-group mr-3"></i>
                Services
              </div>
            </Link>
          </div>
          
          <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/app/subscriptions')}`}>
            <Link href="/app/subscriptions">
              <div className="flex items-center w-full">
                <i className="fas fa-dollar-sign mr-3"></i>
                Subscriptions
              </div>
            </Link>
          </div>
          
          <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/app/bot-control')}`}>
            <Link href="/app/bot-control">
              <div className="flex items-center w-full">
                <i className="fas fa-robot mr-3"></i>
                Bot Control
              </div>
            </Link>
          </div>
          
          <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/app/settings')}`}>
            <Link href="/app/settings">
              <div className="flex items-center w-full">
                <i className="fas fa-cog mr-3"></i>
                Settings
              </div>
            </Link>
          </div>
        </nav>
      </div>
      
      <div className="px-3 py-2 mt-auto">
        <div className="mb-2 px-4 text-xs font-semibold text-sidebar-foreground/60 uppercase">
          Account
        </div>
        <div className="bg-sidebar-accent/20 rounded-md p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user.username}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSidebar;
