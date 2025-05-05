import { ReactNode } from 'react';
import AdminSidebar from '@/components/dashboard/AdminSidebar';
import Header from '@/components/dashboard/Header';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;