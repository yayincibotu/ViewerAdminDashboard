import { ReactNode } from 'react';
import UserSidebar from '@/components/dashboard/UserSidebar';
import Header from '@/components/dashboard/Header';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <UserSidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;