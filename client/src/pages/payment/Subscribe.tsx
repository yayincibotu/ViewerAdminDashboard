import React, { useEffect, useState } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { useLocation, Link, useParams } from 'wouter';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublicKey) {
  console.warn('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const SubscribeForm = ({ planId, planName, price }: { planId: number, planName: string, price: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [location, navigate] = useLocation();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/app/subscriptions',
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // The payment succeeded, but we'll be redirected to the return_url
        toast({
          title: "Subscription Processing",
          description: "Your subscription is being processed.",
        });
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement className="pb-4" />
      
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
        <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Recurring Subscription</p>
          <p>You're setting up a recurring monthly subscription. You can cancel anytime from your account dashboard.</p>
        </div>
      </div>
      
      <div className="pt-4 border-t">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Plan</span>
          <span>{planName}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Billing</span>
          <span>Monthly</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>${price}/month</span>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full py-6 text-lg" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          <span className="flex items-center">
            <Lock className="mr-2 h-5 w-5" />
            Subscribe for ${price}/month
          </span>
        )}
      </Button>
    </form>
  );
};

const CryptoSubscribe = ({ planName, price }: { planName: string, price: number }) => {
  const [cryptoAddress, setCryptoAddress] = useState('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(cryptoAddress);
    toast({
      title: "Address Copied",
      description: "Bitcoin address has been copied to clipboard.",
    });
  };
  
  const { toast } = useToast();
  
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium mb-4">Send Bitcoin Payment</h3>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-500 mb-2">Send exactly</p>
          <p className="text-2xl font-mono font-bold">0.00384 BTC</p>
          <p className="text-sm text-gray-500 mt-1">≈ ${price} USD</p>
        </div>
        
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Bitcoin Address</p>
          <div className="flex items-center">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex-1 font-mono text-sm truncate">
              {cryptoAddress}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2"
              onClick={copyToClipboard}
            >
              Copy
            </Button>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 flex items-start">
          <div className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="text-sm text-yellow-700">
            <p className="font-medium mb-1">Important</p>
            <p>Please send exactly the amount shown. Your subscription will activate after 1 network confirmation.</p>
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Plan</span>
          <span>{planName}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Billing</span>
          <span>Monthly</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>${price}/month</span>
        </div>
      </div>
      
      <Button className="w-full py-6 text-lg">
        <CheckCircle className="mr-2 h-5 w-5" />
        I've Sent the Payment
      </Button>
    </div>
  );
};

const SubscribePage: React.FC = () => {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const params = useParams();
  const planId = params.planId ? parseInt(params.planId) : null;
  
  // Fetch plan details
  const { data: plan, isLoading: isPlanLoading } = useQuery({
    queryKey: ['/api/subscription-plans', planId],
    enabled: !!planId,
  });
  
  useEffect(() => {
    // Make sure the user is logged in
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Make sure a valid plan ID is provided
    if (!planId) {
      setError("Invalid plan selected. Please go back and choose a valid subscription plan.");
      setIsLoading(false);
      return;
    }
    
    // Create subscription
    const createSubscription = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("POST", "/api/get-or-create-subscription", { 
          planId: planId
        });
        
        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError("Failed to initialize subscription. Please try again.");
        }
      } catch (err) {
        console.error("Error creating subscription:", err);
        setError("Failed to initialize subscription. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (plan) {
      createSubscription();
    }
  }, [navigate, user, planId, plan]);
  
  // Show appropriate UI based on loading state and errors
  if (!user) {
    return null; // Will redirect to auth
  }
  
  if (isPlanLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!plan && !isPlanLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Plan Not Found</CardTitle>
                <CardDescription>The subscription plan you selected does not exist</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4 text-red-700">
                  <p>Please go back and select a valid subscription plan.</p>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/#pricing">
                  <Button>View Available Plans</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Error</CardTitle>
                <CardDescription>There was a problem setting up your subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4 text-red-700">
                  <p>{error}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => window.location.reload()} className="mr-2">
                  Try Again
                </Button>
                <Link href="/#pricing">
                  <Button variant="outline">Return to Plans</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link href="/#pricing">
              <a className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Plans
              </a>
            </Link>
            <h1 className="text-3xl font-bold mt-4">Subscribe to {plan?.name}</h1>
            <p className="text-gray-500">Complete your subscription and start growing your audience</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Select how you want to pay for your subscription</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="card" className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4" /> 
                        Credit Card
                      </TabsTrigger>
                      <TabsTrigger value="crypto" className="flex items-center">
                        <i className="fab fa-bitcoin mr-2"></i>
                        Cryptocurrency
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="card" className="pt-6">
                      {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                      ) : (
                        <>
                          {clientSecret && stripePromise ? (
                            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                              <SubscribeForm 
                                planId={plan.id} 
                                planName={plan.name} 
                                price={plan.price} 
                              />
                            </Elements>
                          ) : (
                            <div className="text-center py-8 text-red-500">
                              Unable to initialize Stripe. Please try again later.
                            </div>
                          )}
                        </>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="crypto" className="pt-6">
                      <CryptoSubscribe 
                        planName={plan.name} 
                        price={plan.price} 
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Plan</span>
                    <div>
                      <span className="font-medium block">{plan?.name}</span>
                      {plan?.isPopular && (
                        <Badge className="mt-1 bg-primary-100 text-primary-800 hover:bg-primary-200">
                          Popular Choice
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Billing Cycle</span>
                      <span>Monthly</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>${plan?.price}/month</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 space-y-2">
                    <h4 className="text-sm font-medium">Plan Features:</h4>
                    <ul className="space-y-2">
                      {plan?.features?.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>Need help? <Link href="/contact"><a className="text-primary-600 hover:underline">Contact Support</a></Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SubscribePage;
