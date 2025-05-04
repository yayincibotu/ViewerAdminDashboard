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
            <div className="relative overflow-hidden">
              {/* Premium geometric pattern generated with CSS */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-700/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-600/10 rounded-full translate-y-1/3 -translate-x-1/4"></div>
              
              {/* 3D Card with stats */}
              <div className="w-[350px] md:w-[400px] h-[350px] md:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-xl p-6 flex flex-col justify-between backdrop-blur-sm border border-slate-200 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-blue-900">Viewer Analytics</h3>
                    <p className="text-xs text-slate-500">Real-time statistics</p>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-800"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 my-4">
                  <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                    <h4 className="text-xs text-slate-500">Current Viewers</h4>
                    <p className="text-2xl font-bold text-blue-700">247</p>
                    <div className="text-xs text-emerald-600 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                      +12.4%
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                    <h4 className="text-xs text-slate-500">Active Chatters</h4>
                    <p className="text-2xl font-bold text-purple-700">86</p>
                    <div className="text-xs text-emerald-600 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                      +8.7%
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Growth Progress</span>
                      <span className="text-blue-800 font-medium">78%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Retention Rate</span>
                      <span className="text-blue-800 font-medium">92%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-600 to-blue-400 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                </div>
                
                <button className="mt-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-colors duration-200">
                  Get Started Now
                </button>
              </div>
            </div>
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
