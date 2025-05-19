/**
 * StripeLoader
 * 
 * A utility to conditionally load Stripe scripts only when needed.
 * This improves performance by not loading payment scripts on pages that don't need them.
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Keep a singleton instance
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get the Stripe instance, initializing it if needed
 * Only call this function on pages that actually need Stripe functionality
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    // Check for Stripe public key
    const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    
    if (!stripePublicKey) {
      console.error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
      return Promise.resolve(null);
    }
    
    // Initialize Stripe
    stripePromise = loadStripe(stripePublicKey);
  }
  
  return stripePromise;
};

/**
 * Clear the Stripe instance (used for testing and when you want to force reload)
 */
export const clearStripeInstance = (): void => {
  stripePromise = null;
};

/**
 * Check if the current page is a payment-related page
 * Used to determine if Stripe scripts should be loaded
 */
export const isPaymentPage = (): boolean => {
  const path = window.location.pathname.toLowerCase();
  
  // List all paths where payments might be needed
  return (
    path.includes('/payment') ||
    path.includes('/checkout') ||
    path.includes('/subscribe') ||
    path.includes('/billing') ||
    path.includes('/pricing') && window.location.search.includes('checkout=true')
  );
};