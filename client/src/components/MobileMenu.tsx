import React from 'react';
import { Link, useLocation } from 'wouter';
import Logo from './Logo';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <Logo textColorClass="text-blue-500" />
          <button onClick={onClose} className="text-white text-xl">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <nav>
          <ul className="space-y-6">
            <li>
              <Link href="/">
                <a onClick={onClose} className="block text-white text-lg font-medium">
                  Live Viewers
                </a>
              </Link>
            </li>
            <li>
              <Link href="/#pricing">
                <a onClick={onClose} className="block text-white text-lg font-medium">
                  Followers & Sub
                </a>
              </Link>
            </li>
            <li>
              <Link href="/#platforms">
                <a onClick={onClose} className="block text-white text-lg font-medium">
                  Video View & Like
                </a>
              </Link>
            </li>
            <li>
              <Link href="/#contact">
                <a onClick={onClose} className="block text-white text-lg font-medium">
                  Market
                </a>
              </Link>
            </li>
            <li>
              <Link href="/#pricing">
                <a onClick={onClose} className="block text-white text-lg font-medium">
                  Pricing
                </a>
              </Link>
            </li>
            <li>
              <Link href="/#contact">
                <a onClick={onClose} className="block text-white text-lg font-medium">
                  Contact
                </a>
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="mt-10">
          {user ? (
            <div className="space-y-4">
              {user.role === 'admin' && (
                <Link href="/webadmin">
                  <a onClick={onClose} className="block w-full py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-md text-center font-medium transition">
                    Admin Dashboard
                  </a>
                </Link>
              )}
              <Link href="/app">
                <a onClick={onClose} className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-center font-medium transition">
                  User Dashboard
                </a>
              </Link>
              <Button 
                onClick={handleLogout} 
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-md text-center font-medium transition"
              >
                Logout
              </Button>
            </div>
          ) : (
            <Link href="/auth">
              <a onClick={onClose} className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-center font-medium transition">
                Login / Register
              </a>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
