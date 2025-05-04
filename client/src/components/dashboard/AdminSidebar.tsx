import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import Logo from '../Logo';

const AdminSidebar: React.FC = () => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const isActivePath = (path: string) => {
    return location === path ? 'bg-sidebar-accent text-white' : 'text-sidebar-foreground hover:bg-sidebar-accent/50';
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="w-64 h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      <div className="p-6 flex items-center">
        <Logo textColorClass="text-white" />
        <span className="ml-2 text-white text-xs bg-red-600 px-2 py-1 rounded-md">ADMIN</span>
      </div>
      
      <div className="px-3 py-2">
        <div className="mb-2 px-4 text-xs font-semibold text-sidebar-foreground/60 uppercase">
          Administration
        </div>
        <nav className="space-y-1">
          <Link href="/webadmin">
            <a className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin')}`}>
              <i className="fas fa-chart-line mr-3"></i>
              Dashboard
            </a>
          </Link>
          
          <Link href="/webadmin/users">
            <a className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin/users')}`}>
              <i className="fas fa-users mr-3"></i>
              Users
            </a>
          </Link>
          
          <Link href="/webadmin/payments">
            <a className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin/payments')}`}>
              <i className="fas fa-credit-card mr-3"></i>
              Payments
            </a>
          </Link>
          
          <Link href="/webadmin/services">
            <a className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin/services')}`}>
              <i className="fas fa-cogs mr-3"></i>
              Services & Plans
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
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user.username}</p>
              <p className="text-xs text-red-400">Administrator</p>
            </div>
          </div>
          <div className="mt-3">
            <button 
              onClick={() => logoutMutation.mutate()}
              className="w-full text-xs bg-red-600 hover:bg-red-700 text-white py-1 rounded transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
      
      <div className="px-3 py-4">
        <Link href="/">
          <a className="flex items-center px-4 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md">
            <i className="fas fa-external-link-alt mr-3"></i>
            View Website
          </a>
        </Link>
      </div>
    </div>
  );
};

export default AdminSidebar;
