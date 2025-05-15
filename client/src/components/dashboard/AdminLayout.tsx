import React, { ReactNode, useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '@/hooks/use-auth';
import { Redirect, useLocation } from 'wouter';
import { 
  Loader2, 
  Search, 
  PlusCircle, 
  RefreshCw, 
  HelpCircle, 
  FileText,
  Layout,
  Users,
  ShoppingCart,
  Settings,
  BarChart3,
  MessageSquare,
  CalendarDays,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';

interface AdminLayoutProps {
  children: ReactNode;
}

interface ShortcutCard {
  title: string;
  icon: React.ReactNode;
  link: string;
  color: string;
  description: string;
  shortcut?: string;
  badge?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // Define shortcut cards
  const shortcutCards: ShortcutCard[] = [
    {
      title: 'Dashboard',
      icon: <Layout className="h-5 w-5" />,
      link: '/webadmin',
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      description: 'Genel platform istatistikleri',
      shortcut: 'Alt+D',
    },
    {
      title: 'Kullanıcılar',
      icon: <Users className="h-5 w-5" />,
      link: '/webadmin/users',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      description: 'Kullanıcı yönetimi',
      shortcut: 'Alt+U',
      badge: 'Yeni',
    },
    {
      title: 'Abonelikler',
      icon: <ShoppingCart className="h-5 w-5" />,
      link: '/webadmin/subscriptions',
      color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      description: 'Abonelik planları',
      shortcut: 'Alt+S',
    },
    {
      title: 'Analitik',
      icon: <BarChart3 className="h-5 w-5" />,
      link: '/webadmin/analytics',
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      description: 'Detaylı raporlar ve analizler',
      shortcut: 'Alt+A',
    },
    {
      title: 'Ayarlar',
      icon: <Settings className="h-5 w-5" />,
      link: '/webadmin/settings',
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      description: 'Sistem ayarları',
      shortcut: 'Alt+O',
    },
    {
      title: 'Güvenlik',
      icon: <Shield className="h-5 w-5" />,
      link: '/webadmin/security',
      color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      description: 'Güvenlik ayarları',
      shortcut: 'Alt+G',
    },
  ];

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        // Dashboard shortcut
        if (e.key === 'd') {
          navigate('/webadmin');
          e.preventDefault();
        }
        // Users shortcut
        else if (e.key === 'u') {
          navigate('/webadmin/users');
          e.preventDefault();
        }
        // Subscriptions shortcut
        else if (e.key === 's') {
          navigate('/webadmin/subscriptions');
          e.preventDefault();
        }
        // Analytics shortcut
        else if (e.key === 'a') {
          navigate('/webadmin/analytics');
          e.preventDefault();
        }
        // Settings shortcut
        else if (e.key === 'o') {
          navigate('/webadmin/settings');
          e.preventDefault();
        }
        // Security shortcut
        else if (e.key === 'g') {
          navigate('/webadmin/security');
          e.preventDefault();
        }
        // Quick search shortcut
        else if (e.key === 'q') {
          navigate('/webadmin/search');
          e.preventDefault();
        }
        // New content shortcut
        else if (e.key === 'n') {
          navigate('/webadmin/new-content');
          e.preventDefault();
        }
        // Toggle shortcuts panel
        else if (e.key === '/') {
          setShowShortcuts(prev => !prev);
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  // Redirect to auth page if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // Redirect to dashboard if not admin
  if (user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  // Function to toggle shortcuts panel
  const toggleShortcuts = () => {
    setShowShortcuts(prev => !prev);
  };
  
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-background ml-64 overflow-y-auto h-screen relative">
        {/* Quick Action Bar */}
        <div className="bg-background border-b px-4 py-2 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => navigate('/webadmin/search')}>
                    <Search className="h-4 w-4 mr-2" />
                    Hızlı Ara
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Site içeriğinde arama yapın (Alt+Q)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => navigate('/webadmin/new-content')}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Yeni İçerik
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Yeni içerik oluşturun (Alt+N)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => navigate('/webadmin/calendar')}>
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Takvim
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Etkinlik takvimine erişin (Alt+C)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleShortcuts}>
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Klavye kısayolları (Alt+/)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sayfayı yenile (F5)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => navigate('/webadmin/help')}>
                    <FileText className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dokümantasyon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Shortcuts Panel */}
        {showShortcuts && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Yönetim Paneli Kısayolları</h2>
                  <Button variant="ghost" size="sm" onClick={toggleShortcuts}>
                    Kapat
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {shortcutCards.map((card, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center p-3 rounded-lg ${card.color} cursor-pointer hover:opacity-90 transition-opacity`}
                      onClick={() => {
                        navigate(card.link);
                        setShowShortcuts(false);
                      }}
                    >
                      <div className="bg-white dark:bg-gray-800 p-2 rounded-full mr-3">
                        {card.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="font-medium">{card.title}</h3>
                          {card.badge && (
                            <Badge variant="outline" className="ml-2 text-xs">{card.badge}</Badge>
                          )}
                        </div>
                        <p className="text-sm opacity-80">{card.description}</p>
                      </div>
                      {card.shortcut && (
                        <span className="text-xs bg-white/20 dark:bg-black/20 px-2 py-1 rounded">
                          {card.shortcut}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Diğer Kısayollar</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Arama</span>
                      <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Alt+Q</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yeni İçerik</span>
                      <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Alt+N</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Takvim</span>
                      <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Alt+C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kısayollar Paneli</span>
                      <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Alt+/</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {children}
      </main>
    </div>
  );
};

export default AdminLayout;