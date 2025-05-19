import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';

interface StripeProviderProps {
  children: React.ReactNode;
  clientSecret: string;
}

/**
 * A component that only loads Stripe scripts when directly used
 * This prevents Stripe scripts from loading on non-payment pages
 */
const StripeProvider: React.FC<StripeProviderProps> = ({ children, clientSecret }) => {
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load Stripe on mount
    const loadStripeInstance = async () => {
      try {
        setLoading(true);
        const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
        
        if (!stripeKey) {
          throw new Error('Missing Stripe public key');
        }
        
        const stripe = await loadStripe(stripeKey);
        setStripeInstance(stripe);
      } catch (err) {
        console.error('Failed to load Stripe:', err);
        setError('Could not load payment system. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadStripeInstance();
    
    // Cleanup function - no need to unload Stripe,
    // but this helps with React strict mode
    return () => {
      setStripeInstance(null);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !stripeInstance) {
    return (
      <div className="text-center py-6 text-red-500">
        {error || 'Unable to initialize payment system. Please try again later.'}
      </div>
    );
  }

  return (
    <Elements 
      stripe={stripeInstance} 
      options={{ 
        clientSecret,
        appearance: { theme: 'stripe' } 
      }}
    >
      {children}
    </Elements>
  );
};

export default StripeProvider;