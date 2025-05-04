import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import Logo from './Logo';
import MobileMenu from './MobileMenu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

const NavBar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    return location === path ? 'text-blue-400' : 'hover:text-blue-400';
  };

  return (
    <header className="bg-gray-900 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Logo />
            <div className="hidden md:flex ml-10 space-x-8">
              <Link href="/">
                <div className={`text-sm font-medium ${isActive('/')} transition cursor-pointer`}>Live Viewers</div>
              </Link>
              <Link href="/#pricing">
                <div className={`text-sm font-medium ${isActive('/#pricing')} transition cursor-pointer`}>Followers & Sub</div>
              </Link>
              <Link href="/#platforms">
                <div className={`text-sm font-medium ${isActive('/#platforms')} transition cursor-pointer`}>Video View & Like</div>
              </Link>
              <Link href="/#contact">
                <div className={`text-sm font-medium ${isActive('/#contact')} transition cursor-pointer`}>Market</div>
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center gap-4">
                {user.role === 'admin' && (
                  <Link href="/webadmin">
                    <div className="text-sm font-medium text-white hover:text-blue-400 transition cursor-pointer">Admin</div>
                  </Link>
                )}
                <Link href="/app">
                  <div className="text-sm font-medium text-white hover:text-blue-400 transition cursor-pointer">Dashboard</div>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-white hover:text-blue-400 hover:bg-transparent"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/auth">
                <div className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition text-sm font-medium cursor-pointer">
                  Login/Register
                </div>
              </Link>
            )}
            <button
              className="md:hidden ml-4 text-gray-200 hover:text-white"
              onClick={() => setMobileMenuOpen(true)}
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </div>
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </header>
  );
};

export default NavBar;
