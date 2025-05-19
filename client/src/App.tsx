import React, { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";

// Anasayfa bileşenlerini her zaman yükle (kritik)
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";

// Yükleme Göstergeleri
const LoadingFallback = () => <div className="flex items-center justify-center min-h-screen">
  <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
</div>;

// Lazy-loaded routes
const AuthPage = lazy(() => import("@/pages/auth-page"));

// User Dashboard Pages - Lazy loaded
const Dashboard = lazy(() => import("@/pages/app/Dashboard"));
const Services = lazy(() => import("@/pages/app/Services"));
const BotControl = lazy(() => import("@/pages/app/BotControl"));
const Billing = lazy(() => import("@/pages/app/Billing"));
const Profile = lazy(() => import("@/pages/app/Profile"));

// Admin Pages - Lazy loaded
const AdminDashboard = lazy(() => import("@/pages/webadmin/Dashboard"));
const UsersPage = lazy(() => import("@/pages/webadmin/Users"));
const UserDetails = lazy(() => import("@/pages/webadmin/UserDetails"));
const AdminPayments = lazy(() => import("@/pages/webadmin/Payments"));
const AdminInvoices = lazy(() => import("@/pages/webadmin/Invoices"));
const AdminServices = lazy(() => import("@/pages/webadmin/Services"));
const AdminPageContents = lazy(() => import("@/pages/webadmin/PageContents"));
const Blog = lazy(() => import("@/pages/webadmin/Blog"));
const BlogCategories = lazy(() => import("@/pages/webadmin/BlogCategories"));
const Faq = lazy(() => import("@/pages/webadmin/Faq"));
const FaqCategories = lazy(() => import("@/pages/webadmin/FaqCategories"));
const ContactMessages = lazy(() => import("@/pages/webadmin/ContactMessages"));
const Settings = lazy(() => import("@/pages/webadmin/Settings"));
const Analytics = lazy(() => import("@/pages/webadmin/Analytics"));
const DigitalProducts = lazy(() => import("@/pages/webadmin/DigitalProducts"));
const SmmProviders = lazy(() => import("@/pages/webadmin/SmmProviders"));
const Platforms = lazy(() => import("@/pages/webadmin/Platforms"));
const ProductCategories = lazy(() => import("@/pages/webadmin/ProductCategories"));
const CommentManagement = lazy(() => import("@/pages/webadmin/CommentManagement"));

// Payment Pages - Lazy loaded
const Checkout = lazy(() => import("@/pages/payment/Checkout"));
const Subscribe = lazy(() => import("@/pages/payment/Subscribe"));

// Shop Pages - Lazy loaded
const ShopPage = lazy(() => import("./pages/shop/Shop"));
const ProductDetail = lazy(() => import("./pages/shop/ProductDetail"));
const PlatformShop = lazy(() => import("./pages/shop/PlatformShop"));
const CategoryShop = lazy(() => import("./pages/shop/CategoryShop"));
const ShopCheckout = lazy(() => import("./pages/shop/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/shop/PaymentSuccess"));

// Service Pages - Lazy loaded
const TwitchViewers = lazy(() => import("@/pages/services/TwitchViewers"));
const KickViewers = lazy(() => import("@/pages/services/KickViewers"));

// Platform Pages - Lazy loaded
const TwitchPlatform = lazy(() => import("@/pages/platforms/Twitch"));

function Router() {
  const { user } = useAuth();
  
  const isAdmin = user?.role === "admin";
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/auth">
          <Suspense fallback={<LoadingFallback />}>
            <AuthPage />
          </Suspense>
        </Route>
        
        {/* Shop Pages */}
        <Route path="/shop">
          <Suspense fallback={<LoadingFallback />}>
            <ShopPage />
          </Suspense>
        </Route>
        <Route path="/shop/product/:id">
          <Suspense fallback={<LoadingFallback />}>
            <ProductDetail />
          </Suspense>
        </Route>
        <Route path="/shop/:platformSlug">
          <Suspense fallback={<LoadingFallback />}>
            <PlatformShop />
          </Suspense>
        </Route>
        <Route path="/shop/category/:categorySlug">
          <Suspense fallback={<LoadingFallback />}>
            <CategoryShop />
          </Suspense>
        </Route>
        <Route path="/shop/checkout/:productId">
          <Suspense fallback={<LoadingFallback />}>
            <ShopCheckout />
          </Suspense>
        </Route>
        <Route path="/shop/success">
          <Suspense fallback={<LoadingFallback />}>
            <PaymentSuccess />
          </Suspense>
        </Route>
        
        {/* Platform Pages */}
        <Route path="/twitch">
          <Suspense fallback={<LoadingFallback />}>
            <TwitchPlatform />
          </Suspense>
        </Route>
        
        {/* Service Pages */}
        <Route path="/twitch-viewers">
          <Suspense fallback={<LoadingFallback />}>
            <TwitchViewers />
          </Suspense>
        </Route>
        <Route path="/kick-viewers">
          <Suspense fallback={<LoadingFallback />}>
            <KickViewers />
          </Suspense>
        </Route>
        
        {/* User Dashboard Routes */}
        <ProtectedRoute path="/app">
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/app/services">
          <Suspense fallback={<LoadingFallback />}>
            <Services />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/app/bot-control">
          <Suspense fallback={<LoadingFallback />}>
            <BotControl />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/app/billing">
          <Suspense fallback={<LoadingFallback />}>
            <Billing />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/app/profile">
          <Suspense fallback={<LoadingFallback />}>
            <Profile />
          </Suspense>
        </ProtectedRoute>
        
        {/* Payment Routes */}
        <ProtectedRoute path="/checkout">
          <Suspense fallback={<LoadingFallback />}>
            <Checkout />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/subscribe/:planId">
          <Suspense fallback={<LoadingFallback />}>
            <Subscribe />
          </Suspense>
        </ProtectedRoute>
        
        {/* Admin Routes */}
        <ProtectedRoute path="/webadmin">
          <Suspense fallback={<LoadingFallback />}>
            <AdminDashboard />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/users">
          <Suspense fallback={<LoadingFallback />}>
            <UsersPage />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/users/:id">
          <Suspense fallback={<LoadingFallback />}>
            <UserDetails />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/payments">
          <Suspense fallback={<LoadingFallback />}>
            <AdminPayments />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/invoices">
          <Suspense fallback={<LoadingFallback />}>
            <AdminInvoices />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/services">
          <Suspense fallback={<LoadingFallback />}>
            <AdminServices />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/digital-products">
          <Suspense fallback={<LoadingFallback />}>
            <DigitalProducts />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/platforms">
          <Suspense fallback={<LoadingFallback />}>
            <Platforms />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/product-categories">
          <Suspense fallback={<LoadingFallback />}>
            <ProductCategories />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/smm-providers">
          <Suspense fallback={<LoadingFallback />}>
            <SmmProviders />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/comment-management">
          <Suspense fallback={<LoadingFallback />}>
            <CommentManagement />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/page-contents">
          <Suspense fallback={<LoadingFallback />}>
            <AdminPageContents />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/blog">
          <Suspense fallback={<LoadingFallback />}>
            <Blog />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/blog-categories">
          <Suspense fallback={<LoadingFallback />}>
            <BlogCategories />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/faq">
          <Suspense fallback={<LoadingFallback />}>
            <Faq />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/faq-categories">
          <Suspense fallback={<LoadingFallback />}>
            <FaqCategories />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/contact-messages">
          <Suspense fallback={<LoadingFallback />}>
            <ContactMessages />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/settings">
          <Suspense fallback={<LoadingFallback />}>
            <Settings />
          </Suspense>
        </ProtectedRoute>
        <ProtectedRoute path="/webadmin/analytics">
          <Suspense fallback={<LoadingFallback />}>
            <Analytics />
          </Suspense>
        </ProtectedRoute>
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return <Router />;
}

export default App;
