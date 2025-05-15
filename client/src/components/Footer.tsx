import React from 'react';
import { Link } from 'wouter';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <Logo textColorClass="text-blue-500" />
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              ViewerApps provides social media growth services across multiple platforms, helping content creators and businesses boost their online presence.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-400 hover:text-white transition">Home</Link></li>
              <li><Link href="/#platforms" className="text-gray-400 hover:text-white transition">Services</Link></li>
              <li><Link href="/#pricing" className="text-gray-400 hover:text-white transition">Pricing</Link></li>
              <li><Link href="/#faq" className="text-gray-400 hover:text-white transition">FAQ</Link></li>
              <li><Link href="/#contact" className="text-gray-400 hover:text-white transition">Contact Us</Link></li>
            </ul>
          </div>
          
          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Our Services</h3>
            <ul className="space-y-2">
              <li><Link href="/#twitch" className="text-gray-400 hover:text-white transition">Twitch Services</Link></li>
              <li><Link href="/#kick" className="text-gray-400 hover:text-white transition">Kick Services</Link></li>
              <li><Link href="/#instagram" className="text-gray-400 hover:text-white transition">Instagram Services</Link></li>
              <li><Link href="/#youtube" className="text-gray-400 hover:text-white transition">YouTube Services</Link></li>
              <li><Link href="/#platforms" className="text-gray-400 hover:text-white transition">All Platforms</Link></li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <i className="fas fa-envelope text-primary-500 mt-1 mr-3"></i>
                <span className="text-gray-400">support@viewerapps.com</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-headset text-primary-500 mt-1 mr-3"></i>
                <span className="text-gray-400">24/7 Live Support</span>
              </li>
            </ul>
            <div className="mt-6">
              <Link href="/#contact" className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} ViewerApps. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition">Terms of Service</Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white text-sm transition">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
