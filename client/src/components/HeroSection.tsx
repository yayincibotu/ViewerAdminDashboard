import React from 'react';
import { Link } from 'wouter';

const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute right-0 top-0 w-1/2 h-full">
        <div className="w-full h-full bg-gradient-to-bl from-purple-200 via-blue-200 to-purple-100 rounded-bl-[300px] opacity-80"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Grow Your Audience Instantly with
            </h1>
            <h1 className="text-4xl md:text-5xl font-bold text-purple-600 mb-6">
              Twitch Views
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Start Your Free Trial Today</h2>
            
            <p className="text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
              Enhance your streaming experience with Twitch Views, a powerful tool designed to increase your Twitch views and engagement. 
              Discover how our system can help you gain visibility and attract more viewers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/auth">
                <div className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded text-center font-medium transition-colors cursor-pointer">
                  Start Free Trial
                </div>
              </Link>
              <Link href="#pricing">
                <div className="px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 rounded text-center font-medium transition-colors cursor-pointer">
                  Pricing
                </div>
              </Link>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 flex justify-center md:justify-end">
            <div className="rounded-full w-[350px] h-[350px] md:w-[400px] md:h-[400px] bg-gradient-to-br from-blue-300 via-purple-300 to-blue-200 opacity-80"></div>
          </div>
        </div>
        
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mt-20">
          <div className="text-center">
            <div className="inline-block p-3 mb-4 text-blue-800">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M12 1.5a.75.75 0 0 1 .75.75V4.5a.75.75 0 0 1-1.5 0V2.25A.75.75 0 0 1 12 1.5Zm0 15a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0v-2.25a.75.75 0 0 1 .75-.75ZM12 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm-7.5 7.5a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5H5.25a.75.75 0 0 1-.75-.75Zm4.5-6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm9 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm1.5 3a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5h-2.25a.75.75 0 0 1-.75-.75ZM3.75 16.5a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1-.75-.75Zm.75-8.25a.75.75 0 0 0 0 1.5h2.25a.75.75 0 0 0 0-1.5H4.5Z" />
              </svg>
            </div>
            <h3 className="font-medium text-sm">Free Trial</h3>
            <p className="text-xs text-gray-600 mt-1">Twitch Viewbot and Hick View</p>
          </div>
          <div className="text-center">
            <div className="inline-block p-3 mb-4 text-blue-800">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M5.25 6.375a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" />
                <path fillRule="evenodd" d="M2.25 4.5A.75.75 0 0 1 3 3.75h18a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-18a.75.75 0 0 1-.75-.75V4.5Zm1.5 4.5a.75.75 0 0 1 .75-.75h18a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-18a.75.75 0 0 1-.75-.75V9Zm3 4.5a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-12a.75.75 0 0 1-.75-.75v-1.5Zm4.5 4.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1-.75-.75v-1.5Z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-medium text-sm">Infinite Offer</h3>
            <p className="text-xs text-gray-600 mt-1">Up to 70% off</p>
          </div>
          <div className="text-center">
            <div className="inline-block p-3 mb-4 text-blue-800">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-medium text-sm">Instant Activation</h3>
            <p className="text-xs text-gray-600 mt-1">All digital products and services</p>
          </div>
          <div className="text-center">
            <div className="inline-block p-3 mb-4 text-blue-800">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-medium text-sm">Secure Payment</h3>
            <p className="text-xs text-gray-600 mt-1">Credit Card, ETH, Bitcoin</p>
          </div>
          <div className="text-center">
            <div className="inline-block p-3 mb-4 text-blue-800">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M11.644 1.59a.75.75 0 0 1 .712 0l9.75 5.25a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.712 0l-9.75-5.25a.75.75 0 0 1 0-1.32l9.75-5.25Z" />
                <path d="m3.265 10.602 7.668 4.129a2.25 2.25 0 0 0 2.134 0l7.668-4.13 1.37.739a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.71 0l-9.75-5.25a.75.75 0 0 1 0-1.32l1.37-.738Z" />
                <path d="m10.933 19.231-7.668-4.13-1.37.739a.75.75 0 0 0 0 1.32l9.75 5.25c.221.12.489.12.71 0l9.75-5.25a.75.75 0 0 0 0-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 0 1-2.134-.001Z" />
              </svg>
            </div>
            <h3 className="font-medium text-sm">Timeless Promo</h3>
            <p className="text-xs text-gray-600 mt-1">Thousands of followers daily</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
