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
    <div className="w-64 h-screen bg-sidebar flex flex-col border-r border-sidebar-border fixed left-0 top-0 overflow-y-auto">
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
            <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin')}`}>
              <i className="fas fa-chart-line mr-3"></i>
              Dashboard
            </div>
          </Link>
          
          <Link href="/webadmin/users">
            <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin/users')}`}>
              <i className="fas fa-users mr-3"></i>
              Users
            </div>
          </Link>
          
          <Link href="/webadmin/payments">
            <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin/payments')}`}>
              <i className="fas fa-credit-card mr-3"></i>
              Payments
            </div>
          </Link>
          
          <Link href="/webadmin/invoices">
            <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin/invoices')}`}>
              <i className="fas fa-file-invoice-dollar mr-3"></i>
              Invoices
            </div>
          </Link>
          
          <Link href="/webadmin/services">
            <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin/services')}`}>
              <i className="fas fa-cogs mr-3"></i>
              Services
            </div>
          </Link>
          
          <div>
            <Link href="/webadmin/digital-products">
              <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                location.startsWith('/webadmin/digital-products') ? 'bg-sidebar-accent text-white' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}>
                <i className="fas fa-shopping-cart mr-3"></i>
                Dijital Ürünler
              </div>
            </Link>
            <div className="ml-8 space-y-1 mt-1">
              <Link href="/webadmin/platforms">
                <div className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md ${isActivePath('/webadmin/platforms')}`}>
                  <i className="fas fa-desktop mr-2"></i>
                  Platformlar
                </div>
              </Link>
              <Link href="/webadmin/product-categories">
                <div className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md ${isActivePath('/webadmin/product-categories')}`}>
                  <i className="fas fa-tags mr-2"></i>
                  Kategoriler
                </div>
              </Link>
            </div>
          </div>
          
          <Link href="/webadmin/smm-providers">
            <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin/smm-providers')}`}>
              <i className="fas fa-cloud mr-3"></i>
              SMM Sağlayıcıları
            </div>
          </Link>
        </nav>
        
        <div className="mt-6 mb-2 px-4 text-xs font-semibold text-sidebar-foreground/60 uppercase">
          Content Management
        </div>
        <nav className="space-y-1">
          <Link href="/webadmin/page-contents">
            <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin/page-contents')}`}>
              <i className="fas fa-file-alt mr-3"></i>
              Page Content
            </div>
          </Link>
          
          <Link href="/webadmin/blog">
            <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin/blog')}`}>
              <i className="fas fa-blog mr-3"></i>
              Blog
            </div>
          </Link>
          
          <Link href="/webadmin/blog-categories">
            <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin/blog-categories')}`}>
              <i className="fas fa-folder mr-3"></i>
              Blog Categories
            </div>
          </Link>
          
          <Link href="/webadmin/faq">
            <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin/faq')}`}>
              <i className="fas fa-question-circle mr-3"></i>
              FAQ Management
            </div>
          </Link>
          
          <Link href="/webadmin/faq-categories">
            <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin/faq-categories')}`}>
              <i className="fas fa-list-alt mr-3"></i>
              FAQ Categories
            </div>
          </Link>
          
          <Link href="/webadmin/contact-messages">
            <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin/contact-messages')}`}>
              <i className="fas fa-envelope mr-3"></i>
              Contact Messages
            </div>
          </Link>
        </nav>
        
        <div className="mt-6 mb-2 px-4 text-xs font-semibold text-sidebar-foreground/60 uppercase">
          System
        </div>
        <nav className="space-y-1">
          <Link href="/webadmin/settings">
            <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin/settings')}`}>
              <i className="fas fa-cog mr-3"></i>
              Settings
            </div>
          </Link>
          
          <Link href="/webadmin/analytics">
            <div className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActivePath('/webadmin/analytics')}`}>
              <i className="fas fa-chart-line mr-3"></i>
              Analytics
            </div>
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
          <div className="flex items-center px-4 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md">
            <i className="fas fa-external-link-alt mr-3"></i>
            View Website
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminSidebar;
