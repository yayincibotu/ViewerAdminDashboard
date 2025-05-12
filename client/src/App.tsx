import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import Dashboard from "@/pages/app/Dashboard";
import Services from "@/pages/app/Services";
import BotControl from "@/pages/app/BotControl";
import Billing from "@/pages/app/Billing";
import Profile from "@/pages/app/Profile";
import AdminDashboard from "@/pages/webadmin/Dashboard";
import UsersPage from "@/pages/webadmin/Users";
import UserDetails from "@/pages/webadmin/UserDetails";
import AdminPayments from "@/pages/webadmin/Payments";
import AdminInvoices from "@/pages/webadmin/Invoices";
import AdminServices from "@/pages/webadmin/Services";
import AdminPlans from "@/pages/webadmin/Plans";
import AdminPageContents from "@/pages/webadmin/PageContents";
import Blog from "@/pages/webadmin/Blog";
import BlogCategories from "@/pages/webadmin/BlogCategories";
import Faq from "@/pages/webadmin/Faq";
import FaqCategories from "@/pages/webadmin/FaqCategories";
import ContactMessages from "@/pages/webadmin/ContactMessages";
import Settings from "@/pages/webadmin/Settings";
import Analytics from "@/pages/webadmin/Analytics";
import Checkout from "@/pages/payment/Checkout";
import Subscribe from "@/pages/payment/Subscribe";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { user } = useAuth();
  
  const isAdmin = user?.role === "admin";
  
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* User Dashboard Routes */}
      <ProtectedRoute path="/app" component={Dashboard} />
      <ProtectedRoute path="/app/services" component={Services} />
      <ProtectedRoute path="/app/bot-control" component={BotControl} />
      <ProtectedRoute path="/app/billing" component={Billing} />
      <ProtectedRoute path="/app/profile" component={Profile} />
      
      {/* Payment Routes */}
      <ProtectedRoute path="/checkout" component={Checkout} />
      <ProtectedRoute path="/subscribe/:planId" component={Subscribe} />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/webadmin" component={AdminDashboard} />
      <ProtectedRoute path="/webadmin/users" component={UsersPage} />
      <ProtectedRoute path="/webadmin/users/:id" component={UserDetails} />
      <ProtectedRoute path="/webadmin/payments" component={AdminPayments} />
      <ProtectedRoute path="/webadmin/invoices" component={AdminInvoices} />
      <ProtectedRoute path="/webadmin/services" component={AdminServices} />
      <ProtectedRoute path="/webadmin/plans" component={AdminPlans} />
      <ProtectedRoute path="/webadmin/page-contents" component={AdminPageContents} />
      <ProtectedRoute path="/webadmin/blog" component={Blog} />
      <ProtectedRoute path="/webadmin/blog-categories" component={BlogCategories} />
      <ProtectedRoute path="/webadmin/faq" component={Faq} />
      <ProtectedRoute path="/webadmin/faq-categories" component={FaqCategories} />
      <ProtectedRoute path="/webadmin/contact-messages" component={ContactMessages} />
      <ProtectedRoute path="/webadmin/settings" component={Settings} />
      <ProtectedRoute path="/webadmin/analytics" component={Analytics} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return <Router />;
}

export default App;
