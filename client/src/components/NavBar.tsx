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
                <a className={`text-sm font-medium ${isActive('/')} transition`}>Live Viewers</a>
              </Link>
              <Link href="/#pricing">
                <a className={`text-sm font-medium ${isActive('/#pricing')} transition`}>Followers & Sub</a>
              </Link>
              <Link href="/#platforms">
                <a className={`text-sm font-medium ${isActive('/#platforms')} transition`}>Video View & Like</a>
              </Link>
              <Link href="/#contact">
                <a className={`text-sm font-medium ${isActive('/#contact')} transition`}>Market</a>
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center gap-4">
                {user.role === 'admin' && (
                  <Link href="/webadmin">
                    <a className="text-sm font-medium text-white hover:text-blue-400 transition">Admin</a>
                  </Link>
                )}
                <Link href="/app">
                  <a className="text-sm font-medium text-white hover:text-blue-400 transition">Dashboard</a>
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
                <a className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition text-sm font-medium">
                  Login/Register
                </a>
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
