import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import AdminLayout from "@/components/layout/AdminLayout";

export function ProtectedAdminRoute({
  path,
  component: Component,
  noLayout = false,
}: {
  path: string;
  component: React.ComponentType<any>;
  noLayout?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (noLayout) {
    return <Route path={path} component={Component} />;
  }

  return (
    <Route path={path}>
      <AdminLayout>
        <Component />
      </AdminLayout>
    </Route>
  );
}