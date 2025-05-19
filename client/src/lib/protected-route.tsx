import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import React from "react";

type ProtectedRouteProps = {
  path: string;
  component?: React.ComponentType<any>;
  children?: React.ReactNode;
};

export function ProtectedRoute({ path, component: Component, children }: ProtectedRouteProps) {
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

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Component prop için kullanım (geriye dönük uyumluluk)
  if (Component) {
    return <Route path={path} component={Component} />;
  }
  
  // Children prop için kullanım (yeni kullanım)
  return (
    <Route path={path}>
      {children}
    </Route>
  );
}
