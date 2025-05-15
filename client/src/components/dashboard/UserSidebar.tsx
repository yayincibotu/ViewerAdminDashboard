import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import Logo from '../Logo';
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Layers, 
  Bot
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  collapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, href, isActive, collapsed }) => {
  return (
    <div className="w-full">
      <Link href={href} className={cn(
          "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 group w-full block",
          isActive 
            ? "bg-sidebar-accent text-white" 
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
        )}>
        <div className={cn(
          "flex items-center w-full", 
          collapsed ? "justify-center" : ""
        )}>
          <div className={cn(
            "flex-shrink-0 text-current", 
            collapsed ? "w-5 h-5" : "mr-3 w-5 h-5"
          )}>
            {icon}
          </div>
          {!collapsed && <span>{label}</span>}
          {collapsed && (
            <div className="absolute left-full ml-2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {label}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

const UserSidebar: React.FC = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
    // Retrieve collapsed state from localStorage if available
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setCollapsed(savedState === 'true');
    }
  }, []);

  useEffect(() => {
    // Don't save to localStorage on first mount
    if (mounted) {
      localStorage.setItem('sidebarCollapsed', collapsed.toString());
    }
  }, [collapsed, mounted]);

  // Mobile devices shouldn't collapse the sidebar
  useEffect(() => {
    if (isMobile && collapsed) {
      setCollapsed(false);
    }
  }, [isMobile]);

  const isActivePath = (path: string) => {
    return location === path;
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  if (!user) return null;

  return (
    <div className={cn(
      "h-screen bg-sidebar flex flex-col border-r border-sidebar-border relative transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Toggle Button */}
      <button 
        onClick={toggleSidebar} 
        className="absolute -right-3 top-20 bg-primary text-white rounded-full p-1 shadow-md z-10 hover:bg-primary/90 transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo */}
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "p-2 flex justify-center" : "p-6"
      )}>
        <Logo textColorClass={collapsed ? "hidden" : "text-white"} />
      </div>
      
      {/* Navigation */}
      <div className="px-3 py-2 flex-1">
        <div className={cn(
          "mb-2 px-4 text-xs font-semibold text-sidebar-foreground/60 uppercase transition-opacity",
          collapsed ? "opacity-0 h-0" : "opacity-100"
        )}>
          Main
        </div>
        <nav className="space-y-1">
          <NavItem 
            icon={<Home size={18} />} 
            label="Dashboard" 
            href="/app" 
            isActive={isActivePath('/app')} 
            collapsed={collapsed}
          />
          
          <NavItem 
            icon={<Bot size={18} />} 
            label="Bot Control" 
            href="/app/bot-control" 
            isActive={isActivePath('/app/bot-control')} 
            collapsed={collapsed}
          />
          
          <NavItem 
            icon={<Layers size={18} />} 
            label="Services" 
            href="/app/services" 
            isActive={isActivePath('/app/services')} 
            collapsed={collapsed}
          />
        </nav>
      </div>
      
      {/* User Account */}
      <div className={cn(
        "px-3 py-4 mt-auto border-t border-sidebar-border/30",
        collapsed ? "flex justify-center" : ""
      )}>
        {!collapsed && (
          <div className="mb-2 px-4 text-xs font-semibold text-sidebar-foreground/60 uppercase">
            Account
          </div>
        )}
        <div className={cn(
          "rounded-md p-3 transition-all duration-300 hover:bg-sidebar-accent/30",
          collapsed ? "flex justify-center" : "bg-sidebar-accent/20"
        )}>
          <div className={cn(
            "flex items-center",
            collapsed ? "justify-center" : ""
          )}>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user.username}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSidebar;
