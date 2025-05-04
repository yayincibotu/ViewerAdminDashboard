import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="gradient-bg absolute top-0 right-0 w-1/2 h-full opacity-70 rounded-bl-full"></div>
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Grow Your Audience Instantly with 
              <span className="gradient-text block">Twitch Views</span>
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Start Your Free Trial Today</h2>
            <p className="text-gray-600 mb-8 max-w-lg">
              Enhance your streaming experience with Twitch Views, a powerful tool designed to increase your Twitch views and engagement. Discover how our system can help you gain visibility and attract more viewers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth">
                <a className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-center font-medium transition-colors">
                  Start Free Trial
                </a>
              </Link>
              <Link href="#pricing">
                <a className="px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-md text-center font-medium transition-colors">
                  Pricing
                </a>
              </Link>
            </div>
          </div>
          <div className="w-full md:w-1/2 flex justify-center">
            <img 
              src="https://images.unsplash.com/photo-1598550476439-6847785fcea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600" 
              alt="Streaming Content Creator" 
              className="rounded-lg shadow-xl max-w-full h-auto" 
              width="500" 
              height="500"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
