import React from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import FeatureCard from '@/components/FeatureCard';
import PlatformCard from '@/components/PlatformCard';
import BenefitCard from '@/components/BenefitCard';
import PricingCard from '@/components/PricingCard';
import PaymentMethodCard from '@/components/PaymentMethodCard';
import { useQuery } from '@tanstack/react-query';

const HomePage: React.FC = () => {
  const { data: plans = [] } = useQuery({ 
    queryKey: ['/api/subscription-plans'],
  });
  
  const features = [
    { icon: "fas fa-gift", title: "Free Trial", description: "Twitch Viewbot and Kick View" },
    { icon: "fas fa-infinity", title: "Infinite Offer", description: "Up to 70% off" },
    { icon: "fas fa-bolt", title: "Instant Activation", description: "All digital products and services" },
    { icon: "fas fa-lock", title: "Secure Payment", description: "Credit Card, EFT, Bitcoin" },
    { icon: "fas fa-clock", title: "Timeless Promo", description: "Thousands of followers daily" }
  ];
  
  const platforms = [
    {
      icon: "fab fa-twitch",
      bgColor: "bg-purple-500",
      name: "Twitch",
      description: "Buy Real and Organic Twitch viewers. With 100% customizable and easy control panel.",
      services: [
        { name: "Twitch Viewers", url: "/twitch-viewers" },
        { name: "Twitch Followers", url: "/twitch-followers" },
        { name: "Twitch Gift Sub & Prime Sub", url: "/twitch-gift-sub" },
      ]
    },
    {
      icon: "fas fa-play",
      bgColor: "bg-green-500",
      name: "Kick",
      description: "You can buy Kick viewers or Kick followers via Viewerapps.",
      services: [
        { name: "Kick Viewers", url: "/kick-viewers" },
        { name: "Kick Chat Package", url: "/kick-chat-package" },
        { name: "Kick Follower", url: "/kick-follower" },
      ]
    },
    {
      icon: "fab fa-instagram",
      bgColor: "bg-pink-500",
      name: "Instagram",
      description: "Buy instant delivery instagram products and services.",
      services: [
        { name: "Instagram Like", url: "/instagram-like" },
        { name: "Instagram Follower", url: "/instagram-follower" },
        { name: "Instagram Video & Reel View", url: "/instagram-video-view" },
      ]
    },
    {
      icon: "fab fa-youtube",
      bgColor: "bg-red-500",
      name: "YouTube",
      description: "Geotargeting with Youtube services with instant delivery.",
      services: [
        { name: "YouTube Video View", url: "/youtube-video-view" },
        { name: "YouTube Subscriber", url: "/youtube-subscriber" },
        { name: "YouTube Live View", url: "/youtube-live-view" },
      ]
    }
  ];
  
  const benefits = [
    { 
      icon: "fas fa-sliders-h", 
      title: "Adjustable Viewer Counter", 
      description: "You can select the live viewers count for streaming your Twitch stream based on your subscription plan, giving you control over your view count and metrics.",
      link: "/features/viewer-counter"
    },
    { 
      icon: "fas fa-comments", 
      title: "Twitch Chat Packages", 
      description: "Our Twitch Chat Package uses advanced Artificial Intelligence technology to automatically sort streams for you.",
      link: "/features/chat-packages"
    },
    { 
      icon: "fas fa-chart-line", 
      title: "Real Statistics and Impression", 
      description: "Twitch views helps you reach key goals and enhances your affiliate and partner status. It attracts real viewers, enhancing your channel's performance.",
      link: "/features/real-statistics"
    },
    { 
      icon: "fas fa-shield-alt", 
      title: "Secure Service", 
      description: "Viewerapps Twitch views boosts your metrics to help you easily reach affiliate and partner levels with complete security.",
      link: "/features/secure-service"
    },
    { 
      icon: "fas fa-laptop", 
      title: "User Friendly Dashboard", 
      description: "Exercise ultimate control over all interaction with your viewers on twitch, Viewer and Chat included through our intuitive dashboard.",
      link: "/features/dashboard"
    },
    { 
      icon: "fas fa-headset", 
      title: "24/7 Live Support", 
      description: "Reach out to Viewerapps 24/7 support team for any subscription or technical queries. We're always available to assist you.",
      link: "/support"
    }
  ];
  
  // Convert API plans to pricing card format
  const pricingPlans = plans.map((plan) => ({
    name: plan.name,
    price: plan.price,
    period: "month",
    planId: plan.id,
    popular: plan.isPopular,
    features: plan.features.map(feature => ({
      name: feature,
      included: true
    })).concat(
      plan.geographicTargeting 
        ? [{ name: "Geographic Targeting", included: true }] 
        : [{ name: "Geographic Targeting", included: false }]
    )
  }));
  
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Feature Cards */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
          </div>
        </section>
        
        {/* Platforms Section */}
        <section id="platforms" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">ViewerApps Has a Service for All Platforms</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {platforms.map((platform, index) => (
                <PlatformCard
                  key={index}
                  icon={platform.icon}
                  bgColor={platform.bgColor}
                  name={platform.name}
                  description={platform.description}
                  services={platform.services}
                />
              ))}
            </div>
            
            <div className="text-center mt-10">
              <a href="#" className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium">
                View All Platforms
                <i className="fas fa-arrow-right ml-2"></i>
              </a>
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Organic Twitch Growth with Twitch Viewers</h2>
              <p className="text-gray-600">Enhance your streaming experience and achieve organic Twitch growth with our revolutionary Twitch views.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <BenefitCard
                  key={index}
                  icon={benefit.icon}
                  title={benefit.title}
                  description={benefit.description}
                  link={benefit.link}
                />
              ))}
            </div>
          </div>
        </section>
        
        {/* Pricing Plans */}
        <section id="pricing" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold mb-4">Twitch Viewbot Plans & Pricing</h2>
              <p className="text-gray-600">We have crafted exciting plans to help you attract more potential viewers, downloads and customers and surpass your competitors.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pricingPlans.map((plan, index) => (
                <PricingCard
                  key={index}
                  name={plan.name}
                  price={plan.price}
                  period={plan.period}
                  features={plan.features}
                  popular={plan.popular}
                  planId={plan.planId}
                />
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <a href="#" className="inline-flex items-center px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-md font-medium transition">
                View Higher Tier Plans
                <i className="fas fa-arrow-right ml-2"></i>
              </a>
            </div>
          </div>
        </section>
        
        {/* Dashboard Preview */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-full md:w-1/2 mb-10 md:mb-0 md:pr-12">
                <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">User Dashboard</span>
                <h2 className="text-3xl font-bold mt-2 mb-4">Manage Your Services with Our Intuitive Dashboard</h2>
                <p className="text-gray-600 mb-6">Our modern web app provides you with everything you need to manage your subscriptions, monitor your stream performance, and optimize your growth strategy.</p>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <i className="fas fa-check-circle text-green-500 text-lg"></i>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium">Real-time Analytics</h3>
                      <p className="text-gray-600 text-sm">Monitor your views, followers, and engagement metrics in real-time with detailed analytics.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <i className="fas fa-check-circle text-green-500 text-lg"></i>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium">Service Control Panel</h3>
                      <p className="text-gray-600 text-sm">Easily manage your active services, adjust viewer counts, and customize chat settings.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <i className="fas fa-check-circle text-green-500 text-lg"></i>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium">Subscription Management</h3>
                      <p className="text-gray-600 text-sm">View, upgrade, or renew your subscriptions directly from your dashboard.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <a href="/app" className="inline-flex items-center px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition">
                    Access Your Dashboard
                    <i className="fas fa-arrow-right ml-2"></i>
                  </a>
                </div>
              </div>
              
              <div className="w-full md:w-1/2">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                  alt="Dashboard Preview" 
                  className="rounded-lg shadow-xl w-full" 
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* Admin Panel Preview */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row-reverse items-center">
              <div className="w-full md:w-1/2 mb-10 md:mb-0 md:pl-12">
                <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">Admin Panel</span>
                <h2 className="text-3xl font-bold mt-2 mb-4">Powerful Admin Tools for Site Management</h2>
                <p className="text-gray-600 mb-6">Our comprehensive admin panel gives site administrators complete control over all aspects of the ViewerApps platform.</p>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <i className="fas fa-user-shield text-primary-500 text-lg"></i>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium">User Management</h3>
                      <p className="text-gray-600 text-sm">Manage user accounts, view user activity, and handle support requests efficiently.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <i className="fas fa-chart-bar text-primary-500 text-lg"></i>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium">Business Analytics</h3>
                      <p className="text-gray-600 text-sm">Access detailed reports on sales, subscriptions, and platform usage metrics.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <i className="fas fa-cog text-primary-500 text-lg"></i>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium">Service Configuration</h3>
                      <p className="text-gray-600 text-sm">Easily manage service offerings, pricing plans, and system settings.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <a href="/webadmin" className="inline-flex items-center px-5 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-md font-medium transition">
                    Admin Access
                    <i className="fas fa-lock ml-2"></i>
                  </a>
                </div>
              </div>
              
              <div className="w-full md:w-1/2">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                  alt="Admin Panel Preview" 
                  className="rounded-lg shadow-xl w-full" 
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* Payment Options */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold mb-4">Secure Payment Methods</h2>
              <p className="text-gray-600">Choose from multiple secure payment options to purchase your subscription plans.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <PaymentMethodCard
                title="Credit Card Payment"
                description="Securely process payments using all major credit cards through our Stripe integration."
                iconClass="fas fa-credit-card"
                bgColor="bg-blue-100 text-blue-600"
                methodIcons={[
                  { icon: "fab fa-cc-visa", color: "text-blue-800" },
                  { icon: "fab fa-cc-mastercard", color: "text-red-600" },
                  { icon: "fab fa-cc-amex", color: "text-blue-500" },
                  { icon: "fab fa-cc-discover", color: "text-orange-500" }
                ]}
                securityText="Secure Processing"
                securityIcon="fas fa-lock"
                imageSrc="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300"
                imageAlt="Credit Card Payment"
                buttonText="Pay with Credit Card"
                buttonLink="/checkout"
                buttonBgColor="bg-blue-600 hover:bg-blue-700"
              />
              
              <PaymentMethodCard
                title="Cryptocurrency Payment"
                description="Pay anonymously using Bitcoin, Ethereum, or other popular cryptocurrencies."
                iconClass="fab fa-bitcoin"
                bgColor="bg-purple-100 text-purple-600"
                methodIcons={[
                  { icon: "fab fa-bitcoin", color: "text-orange-500" },
                  { icon: "fab fa-ethereum", color: "text-purple-600" },
                  { icon: "fas fa-coins", color: "text-yellow-500" }
                ]}
                securityText="Anonymous"
                securityIcon="fas fa-shield-alt"
                imageSrc="https://images.unsplash.com/photo-1516245834210-c4c142787335?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300"
                imageAlt="Cryptocurrency Payment"
                buttonText="Pay with Crypto"
                buttonLink="/crypto-checkout"
                buttonBgColor="bg-purple-600 hover:bg-purple-700"
              />
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;
