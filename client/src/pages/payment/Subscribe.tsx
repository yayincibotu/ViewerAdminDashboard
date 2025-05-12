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

const CryptoSubscribe = ({ 
  planName, 
  price, 
  cryptoData 
}: { 
  planName: string, 
  price: number,
  cryptoData: any
}) => {
  const [cryptoAddress, setCryptoAddress] = useState('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
  const [isPaymentConfirming, setIsPaymentConfirming] = useState(false);
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  // If we have crypto data from the API, use it
  useEffect(() => {
    if (cryptoData && cryptoData.cryptoAddress) {
      setCryptoAddress(cryptoData.cryptoAddress);
    }
  }, [cryptoData]);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(cryptoAddress);
    toast({
      title: "Address Copied",
      description: "Bitcoin address has been copied to clipboard.",
    });
  };
  
  const confirmPayment = async () => {
    if (!cryptoData || !cryptoData.transactionId) {
      toast({
        title: "Error",
        description: "Cannot confirm payment without transaction ID",
        variant: "destructive"
      });
      return;
    }
    
    setIsPaymentConfirming(true);
    
    try {
      // Call API to confirm payment
      const response = await apiRequest("POST", "/api/confirm-crypto-payment", {
        transactionId: cryptoData.transactionId
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Payment Received",
          description: "Your subscription has been activated successfully!",
        });
        
        // Redirect to subscriptions page
        navigate('/app/subscriptions');
      } else {
        toast({
          title: "Payment Not Found",
          description: "We haven't detected your payment yet. Please try again in a few minutes.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Error confirming payment:", err);
      toast({
        title: "Error",
        description: "An error occurred while confirming your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPaymentConfirming(false);
    }
  };
  
  const btcAmount = (price / 65000).toFixed(6); // A simple conversion example - in production use actual rates
  
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium mb-4">Send Bitcoin Payment</h3>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-500 mb-2">Send exactly</p>
          <p className="text-2xl font-mono font-bold">{btcAmount} BTC</p>
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
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
      
      <Button 
        className="w-full py-6 text-lg" 
        onClick={confirmPayment}
        disabled={isPaymentConfirming}
      >
        {isPaymentConfirming ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Confirming...
          </span>
        ) : (
          <span className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5" />
            I've Sent the Payment
          </span>
        )}
      </Button>
    </div>
  );
};

const SubscribePage: React.FC = () => {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cryptoData, setCryptoData] = useState<any>(null);
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const params = useParams();
  const planId = params.planId ? parseInt(params.planId) : null;
  
  // Fetch plan details
  const { data: plan, isLoading: isPlanLoading } = useQuery({
    queryKey: [`/api/subscription-plans/${planId}`],
    enabled: !!planId,
  });
  
  const { toast } = useToast();
  
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
  }, [navigate, user, planId]);
  
  // Create subscription when payment method changes
  useEffect(() => {
    if (!plan || !planId || !user) return;
    
    const createSubscription = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First check if user is still authenticated
        const authCheckResponse = await fetch("/api/user", { 
          credentials: "include",
        });
        
        if (authCheckResponse.status === 401) {
          console.error("User is not authenticated, redirecting to login");
          toast({
            title: "Authentication required",
            description: "Please log in again to continue.",
            variant: "destructive"
          });
          navigate("/auth");
          return;
        }
        
        // Create a new AbortController for this request
        const controller = new AbortController();
        
        // Set a timeout for the request
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        // Use the new direct payment intent API for card payments
        if (paymentMethod === 'card') {
          try {
            console.log("Making payment request with planId:", planId);
            
            // Manual fetch with explicit credentials and headers
            const response = await fetch("/api/create-subscription-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ planId: Number(planId) }),
              credentials: "include",
              signal: controller.signal
            });
            
            // Clear the timeout since the request completed
            clearTimeout(timeoutId);
            
            console.log("Payment request status:", response.status);
            console.log("Payment request headers:", Object.fromEntries(response.headers.entries()));
            
            // Handle errors
            if (!response.ok) {
              console.log("Error response:", response.status, response.statusText);
              const errorText = await response.text();
              console.log("Error response body:", errorText);
              
              // Check if the response is a redirect to login page
              if (response.status === 401 || errorText.includes('<!DOCTYPE html>')) {
                console.error("Authentication error, redirecting to login");
                toast({
                  title: "Session expired",
                  description: "Please log in again to continue.",
                  variant: "destructive"
                });
                navigate("/auth");
                return;
              }
              
              let errorMessage = "Failed to create payment";
              try {
                // Try to parse as JSON
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
              } catch (e) {
                // If not JSON, use the text directly
                if (errorText && errorText.length < 100) {
                  errorMessage = errorText;
                }
              }
              
              throw new Error(errorMessage);
            }
            
            // For successful response, first check content type
            const contentType = response.headers.get('Content-Type');
            let data;
            
            console.log("Response content type:", contentType);
            
            // Get response text first to analyze it
            const responseClone = response.clone();
            const responseText = await responseClone.text();
            
            // Check if it's actually HTML despite content type header
            if (responseText.includes('<!DOCTYPE html>')) {
              console.error("Server returned HTML instead of JSON:", responseText.substring(0, 100));
              toast({
                title: "Session expired",
                description: "Please log in again to continue.",
                variant: "destructive"
              });
              navigate("/auth");
              return;
            }
            
            try {
              // Parse the response as JSON
              data = JSON.parse(responseText);
              console.log("Payment API response data:", data);
            } catch (e) {
              console.error("JSON parse error:", e);
              console.error("Response text was:", responseText);
              throw new Error("Failed to process server response. Please try again.");
            }
            
            console.log("Payment intent response:", data);
            
            // Check if we have client secret
            if (data.clientSecret) {
              setClientSecret(data.clientSecret);
              setCryptoData(null);
            } else {
              console.error("Missing client secret in response:", data);
              setError("Failed to initialize payment. Please try again or contact support.");
            }
          } catch (error) {
            console.error("Error creating payment intent:", error);
            setError(error instanceof Error ? error.message : "Failed to create payment");
          }
        } 
        // Use the existing API for crypto payments
        else if (paymentMethod === 'crypto') {
          const response = await apiRequest("POST", "/api/get-or-create-subscription", 
            { 
              planId: planId,
              paymentMethod: 'crypto'
            }
          );
          
          // Clear the timeout since the request completed
          clearTimeout(timeoutId);
          
          let data;
          
          if (!response.ok) {
            // Read the error response as JSON or text
            const errorText = await response.text();
            let errorMessage = "Failed to create subscription";
            
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              // If we can't parse the error as JSON, use the text directly
              if (errorText) errorMessage = errorText;
            }
            
            throw new Error(errorMessage);
          }
          
          // Response is OK, get a clone before parsing as JSON to prevent "body already read" errors
          try {
            const responseClone = response.clone();
            try {
              data = await response.json();
            } catch (e) {
              // If the first attempt fails, try with the clone
              console.warn("First JSON parse attempt failed, trying with clone");
              data = await responseClone.json();
            }
          } catch (jsonError) {
            console.error("Error parsing response:", jsonError);
            throw new Error("Failed to parse server response");
          }
          
          console.log("Crypto payment response:", data);
          
          if (data.paymentMethod === 'crypto' && data.transactionId) {
            setCryptoData(data);
            setClientSecret("");
          } else {
            console.error("Unexpected crypto payment response:", data);
            setError("Failed to initialize cryptocurrency payment. Please try again or contact support.");
          }
        }
      } catch (err: any) {
        console.error("Error creating subscription:", err);
        setError(err.message || "Failed to initialize payment. Please try again later.");
        
        // If there's a Stripe configuration issue, switch to crypto payment
        if (err.message && (
          err.message.includes('Stripe is not configured') || 
          err.message.includes('stripe_not_configured')
        )) {
          setPaymentMethod('crypto');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    createSubscription();
  }, [paymentMethod, planId, plan, user]);
  
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
            <Link href="/#pricing" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Plans
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
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
                                planId={plan?.id || 0} 
                                planName={plan?.name || ""} 
                                price={plan?.price || 0} 
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
                      {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                      ) : (
                        <CryptoSubscribe 
                          planName={plan?.name || ""} 
                          price={plan?.price || 0}
                          cryptoData={cryptoData} 
                        />
                      )}
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
                      <span>${plan ? plan.price : 0}/month</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 space-y-2">
                    <h4 className="text-sm font-medium">Plan Features:</h4>
                    <ul className="space-y-2">
                      {plan && plan.features && Array.isArray(plan.features) && plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {!plan || !plan.features || !Array.isArray(plan.features) ? (
                        <li className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>Loading features...</span>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>Need help? <Link href="/contact" className="text-primary-600 hover:underline">Contact Support</Link></p>
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
