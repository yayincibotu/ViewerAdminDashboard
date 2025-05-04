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
          <Link href="/app">
            <a className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/app')}`}>
              <i className="fas fa-home mr-3"></i>
              Dashboard
            </a>
          </Link>
          
          <Link href="/app/services">
            <a className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/app/services')}`}>
              <i className="fas fa-layer-group mr-3"></i>
              Services
            </a>
          </Link>
          
          <Link href="/app/subscriptions">
            <a className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/app/subscriptions')}`}>
              <i className="fas fa-dollar-sign mr-3"></i>
              Subscriptions
            </a>
          </Link>
          
          <Link href="/app/settings">
            <a className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/app/settings')}`}>
              <i className="fas fa-cog mr-3"></i>
              Settings
            </a>
          </Link>
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
