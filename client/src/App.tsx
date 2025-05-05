import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { ProtectedAdminRoute } from "@/lib/protected-admin-route";
import Dashboard from "@/pages/app/Dashboard";
import Services from "@/pages/app/Services";
import Subscriptions from "@/pages/app/Subscriptions";
import BotControl from "@/pages/app/BotControl";
import Settings from "@/pages/app/Settings";
import Billing from "@/pages/app/Billing";
import Profile from "@/pages/app/Profile";
import AdminDashboard from "@/pages/webadmin/Dashboard";
import AdminUsers from "@/pages/webadmin/Users";
import AdminPayments from "@/pages/webadmin/Payments";
import AdminServices from "@/pages/webadmin/Services";
import Checkout from "@/pages/payment/Checkout";
import Subscribe from "@/pages/payment/Subscribe";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* User Dashboard Routes */}
      <ProtectedRoute path="/app" component={Dashboard} />
      <ProtectedRoute path="/app/services" component={Services} />
      <ProtectedRoute path="/app/subscriptions" component={Subscriptions} />
      <ProtectedRoute path="/app/bot-control" component={BotControl} />
      <ProtectedRoute path="/app/billing" component={Billing} />
      <ProtectedRoute path="/app/profile" component={Profile} />
      <ProtectedRoute path="/app/settings" component={Settings} />
      
      {/* Payment Routes */}
      <ProtectedRoute path="/checkout" component={Checkout} noLayout={true} />
      <ProtectedRoute path="/subscribe/:planId" component={Subscribe} noLayout={true} />
      
      {/* Admin Routes */}
      <ProtectedAdminRoute path="/webadmin" component={AdminDashboard} />
      <ProtectedAdminRoute path="/webadmin/users" component={AdminUsers} />
      <ProtectedAdminRoute path="/webadmin/payments" component={AdminPayments} />
      <ProtectedAdminRoute path="/webadmin/services" component={AdminServices} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return <Router />;
}

export default App;
