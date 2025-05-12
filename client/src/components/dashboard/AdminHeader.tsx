import React, { ReactNode } from 'react';

interface AdminHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  title, 
  description, 
  actions 
}) => {
  return (
    <div className="sticky top-0 bg-background z-10 border-b border-border p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      {actions && (
        <div className="flex items-center space-x-2 mt-2 md:mt-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default AdminHeader;