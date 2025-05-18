import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  ShoppingCart, 
  BarChart, 
  Server, 
  MessageSquare, 
  ChevronDown, 
  ChevronRight
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path?: string;
  children?: {
    title: string;
    path: string;
  }[];
  active?: boolean;
  expanded?: boolean;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Check if user is admin
  const adminCheck = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await fetch('/api/user');
      if (!response.ok) {
        throw new Error('Kullanıcı bilgileri alınamadı');
      }
      const data = await response.json();
      if (data.role !== 'admin') {
        throw new Error('Admin yetkisi yok');
      }
      return data;
    }
  });

  useEffect(() => {
    // Define menu items with nested structure
    const items: MenuItem[] = [
      {
        title: "Dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
        path: "/webadmin",
      },
      {
        title: "Siparişler",
        icon: <ShoppingCart className="h-5 w-5" />,
        path: "/webadmin/orders",
      },
      {
        title: "Dijital Ürünler",
        icon: <Package className="h-5 w-5" />,
        children: [
          { title: "Ürün Listesi", path: "/webadmin/products" },
          { title: "Kategoriler", path: "/webadmin/categories" },
          { title: "Platformlar", path: "/webadmin/platforms" },
          { title: "Yorum Yönetimi", path: "/webadmin/comments" },
        ],
      },
      {
        title: "Kullanıcılar",
        icon: <Users className="h-5 w-5" />,
        path: "/webadmin/users",
      },
      {
        title: "Analizler",
        icon: <BarChart className="h-5 w-5" />,
        path: "/webadmin/analytics",
      },
      {
        title: "SMM Servisleri",
        icon: <Server className="h-5 w-5" />,
        path: "/webadmin/smm-services",
      },
      {
        title: "Ayarlar",
        icon: <Settings className="h-5 w-5" />,
        path: "/webadmin/settings",
      },
    ];

    // Mark active and expanded items based on current path
    const updatedItems = items.map((item) => {
      const isActive = item.path === location;
      const hasActiveChild = item.children?.some(child => child.path === location);
      
      return {
        ...item,
        active: isActive,
        expanded: hasActiveChild || isActive,
      };
    });

    setMenuItems(updatedItems);
  }, [location]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSubmenu = (index: number) => {
    const updatedItems = [...menuItems];
    updatedItems[index].expanded = !updatedItems[index].expanded;
    setMenuItems(updatedItems);
  };

  // Show login page if not admin
  if (adminCheck.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (adminCheck.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold">Yetkisiz Erişim</h1>
        <p className="text-muted-foreground">Bu sayfaya erişmek için admin yetkisine sahip olmanız gerekiyor.</p>
        <Link href="/">
          <Button>Ana Sayfaya Dön</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </Button>
            <Link href="/webadmin">
              <div className="text-xl font-bold text-white">Admin Panel</div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-zinc-400 md:inline">
              {adminCheck.data?.username}
            </span>
            <Link href="/logout">
              <Button variant="ghost" size="icon">
                <LogOut className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar */}
        <aside 
          className={`${
            isMobileMenuOpen ? "block" : "hidden"
          } w-full border-r border-zinc-800 bg-zinc-950 md:block md:w-64`}
        >
          <ScrollArea className="h-[calc(100vh-57px)]">
            <nav className="p-4">
              <ul className="space-y-2">
                {menuItems.map((item, index) => (
                  <li key={item.title}>
                    {item.children ? (
                      <div>
                        <button
                          className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm ${
                            item.active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                          }`}
                          onClick={() => toggleSubmenu(index)}
                        >
                          <div className="flex items-center">
                            {item.icon}
                            <span className="ml-3">{item.title}</span>
                          </div>
                          {item.expanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        {item.expanded && (
                          <ul className="mt-1 space-y-1 pl-10">
                            {item.children.map((child) => (
                              <li key={child.title}>
                                <Link href={child.path}>
                                  <div
                                    className={`block rounded-md px-3 py-2 text-sm ${
                                      location === child.path
                                        ? "bg-zinc-800 text-white"
                                        : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                                    }`}
                                  >
                                    {child.title}
                                  </div>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <Link href={item.path || "#"}>
                        <div
                          className={`flex items-center rounded-md px-3 py-2 text-sm ${
                            item.active
                              ? "bg-zinc-800 text-white"
                              : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                          }`}
                        >
                          {item.icon}
                          <span className="ml-3">{item.title}</span>
                        </div>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden bg-zinc-900">
          {children}
        </main>
      </div>
    </div>
  );
}