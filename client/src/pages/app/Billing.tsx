import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import UserSidebar from '@/components/dashboard/UserSidebar';
import Header from '@/components/dashboard/Header';
import ReactCountryFlag from "react-country-flag";
import { Country, State, City } from 'country-state-city';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  CreditCard, 
  CalendarIcon, 
  Download, 
  Edit, 
  Clock, 
  ArrowDownCircle,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Trash2,
  Star
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistance } from 'date-fns';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Load stripe outside of the component for better performance
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.error('Missing VITE_STRIPE_PUBLIC_KEY. Stripe functionality will not work properly.');
}

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) 
  : null;

// Card input styles
const cardElementOptions = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: 'Arial, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
  hidePostalCode: true,
};

// AddCardForm component with Stripe Elements
const AddCardForm = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardholderName, setCardholderName] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const setupIntentMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      return apiRequest('POST', '/api/payment-methods', { paymentMethodId });
    },
    onSuccess: () => {
      toast({
        title: 'Payment method added',
        description: 'Your card has been added successfully.',
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add payment method',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setLoading(true);
    setPaymentError(null);
    
    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      setLoading(false);
      setPaymentError('Card element not found. Please refresh and try again.');
      return;
    }
    
    // Create payment method
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: cardholderName || user?.username || '',
        email: user?.email || '',
      },
    });
    
    if (error) {
      setPaymentError(error.message || 'Something went wrong. Please try again.');
      setLoading(false);
      return;
    }
    
    // Add payment method to customer
    setupIntentMutation.mutate(paymentMethod.id);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="cardName">Name on Card</Label>
          <Input
            id="cardName"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="John Doe"
          />
        </div>
        <div className="grid gap-2">
          <Label>Card Details</Label>
          <div className="border rounded-md p-3">
            <CardElement options={cardElementOptions} />
          </div>
          {paymentError && (
            <div className="text-sm text-red-500 mt-1">{paymentError}</div>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Card"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

const Billing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [showEditBillingDialog, setShowEditBillingDialog] = useState(false);
  
  // Define billing info type for TypeScript
  interface BillingInfoType {
    fullName?: string;
    email?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    taxId?: string;
    [key: string]: any; // Allow any other properties that might come from the API
  }
  
  // Fetch billing info from the server
  const { data: billingInfo = {} as BillingInfoType, isSuccess: billingInfoLoaded } = useQuery<BillingInfoType>({
    queryKey: ['/api/billing-info'],
    enabled: !!user
  });
  
  // Debug: log billing info to console
  useEffect(() => {
    if (billingInfo) {
      console.log('Billing info loaded:', billingInfo);
    }
  }, [billingInfo]);
  
  // Fetch real payment methods from the API
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading } = useQuery<any[]>({
    queryKey: ['/api/payment-methods'],
    enabled: !!user,
  });

  // Fetch real billing history from the API
  const { data: billingHistory = [], isLoading: billingHistoryLoading } = useQuery<any[]>({
    queryKey: ['/api/billing-history'],
    enabled: !!user,
  });
  
  // Fetch user subscriptions from the API
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<any[]>({
    queryKey: ['/api/user-subscriptions'],
    enabled: !!user,
  });
  
  // Get the active subscription
  const activeSubscription = subscriptions.length > 0 ? subscriptions[0] : null;
  
  // Set default payment method mutation
  const setDefaultPaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      return apiRequest('POST', `/api/payment-methods/${paymentMethodId}/set-default`);
    },
    onSuccess: () => {
      toast({
        title: 'Default payment method updated',
        description: 'Your default payment method has been updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update default payment method',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Remove payment method mutation
  const removePaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      return apiRequest('DELETE', `/api/payment-methods/${paymentMethodId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Payment method removed',
        description: 'Your payment method has been removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove payment method',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Handle setting a card as default
  const handleSetDefaultCard = (paymentMethodId: string) => {
    setDefaultPaymentMethodMutation.mutate(paymentMethodId);
  };
  
  // Handle removing a card
  const handleRemoveCard = (paymentMethodId: string) => {
    removePaymentMethodMutation.mutate(paymentMethodId);
  };

  const getCardLogo = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳 Visa';
      case 'mastercard':
        return '💳 Mastercard';
      case 'amex':
        return '💳 American Express';
      default:
        return '💳 Card';
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <div className="flex items-center space-x-1.5 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Paid</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center space-x-1.5 text-yellow-500">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Pending</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center space-x-1.5 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Failed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-1.5 text-gray-500">
            <Info className="h-4 w-4" />
            <span className="text-xs font-medium">{status}</span>
          </div>
        );
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      <UserSidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header />
        <div className="container mx-auto py-6 px-4">
          <h1 className="text-2xl font-bold mb-6">Billing & Payments</h1>
          {/* Debug info */}
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
            <p>Debug - Raw billing info:</p>
            <pre className="overflow-auto max-h-20">{JSON.stringify(billingInfo, null, 2)}</pre>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Billing Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Billing Information</CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowEditBillingDialog(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <CardDescription>Your billing address and details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-semibold">Name:</div>
                    <div>{billingInfo?.fullName || user.username}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Email:</div>
                    <div>{billingInfo?.email || user.email}</div>
                  </div>
                  {billingInfo?.address1 && (
                    <div>
                      <div className="font-semibold">Address:</div>
                      <div>{billingInfo.address1}</div>
                      {billingInfo.address2 && <div>{billingInfo.address2}</div>}
                      <div>
                        {billingInfo.city && `${billingInfo.city}, `}
                        {billingInfo.state && (
                          typeof billingInfo.state === 'string' && billingInfo.state.length === 2 && 
                          typeof billingInfo.country === 'string' && billingInfo.country.length === 2 
                            ? `${State.getStateByCodeAndCountry(billingInfo.state, billingInfo.country)?.name || billingInfo.state} `
                            : `${billingInfo.state} `
                        )}
                        {billingInfo.zip}
                      </div>
                      <div className="flex items-center">
                        {billingInfo.country && (
                          <>
                            {typeof billingInfo.country === 'string' && billingInfo.country.length === 2 ? (
                              <>
                                <ReactCountryFlag 
                                  countryCode={billingInfo.country}
                                  svg
                                  style={{
                                    width: '1.2em',
                                    height: '1.2em',
                                    marginRight: '0.5em'
                                  }}
                                />
                                {Country.getCountryByCode(billingInfo.country)?.name || billingInfo.country}
                              </>
                            ) : (
                              // Handle legacy country format or numeric values
                              <>{billingInfo.country}</>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {billingInfo?.taxId && (
                    <div>
                      <div className="font-semibold">Tax ID:</div>
                      <div>{billingInfo.taxId}</div>
                    </div>
                  )}
                  {!billingInfo?.address1 && (
                    <div className="text-gray-500 italic">
                      No billing address on file. Add your billing information for invoices.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Current Plan Card */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Current Plan</CardTitle>
                  <div className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                    Active
                  </div>
                </div>
                <CardDescription>Your subscription details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-xl font-bold">50 Live Viewers</div>
                    <div className="text-sm text-gray-500">Premium subscription</div>
                  </div>
                  
                  <div className="flex justify-between items-baseline">
                    <div className="text-2xl font-bold">$99.99<span className="text-gray-500 text-sm font-normal">/month</span></div>
                    <div className="text-sm text-gray-500">Renews on May 15, 2023</div>
                  </div>
                  
                  <div className="pt-2 flex flex-col gap-1.5">
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>50 viewers per stream</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Chat Bot (20 custom commands)</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Geographic targeting</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Priority support</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-between">
                <Button variant="outline">Cancel Plan</Button>
                <Button>Upgrade Plan</Button>
              </CardFooter>
            </Card>

            {/* Payment Method Card */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Payment Methods</CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowAddCardDialog(true)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </div>
                <CardDescription>Manage your payment methods</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentMethodsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No payment methods found</p>
                        <p className="text-sm mt-1">Add a card to manage your subscriptions</p>
                      </div>
                    ) : (
                      paymentMethods.map((method: any) => (
                        <div 
                          key={method.id} 
                          className={`border rounded-lg p-4 relative ${method.billing_details?.name ? 'border-primary/50 bg-primary/5' : ''}`}
                        >
                          {method.billing_details?.name && (
                            <div className="absolute top-3 right-3 text-xs font-medium text-primary">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                <span>Default</span>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center">
                            <div className="flex-shrink-0 mr-3 text-xl">
                              {getCardLogo(method.card?.brand || '')}
                            </div>
                            <div>
                              <div className="font-medium">
                                {method.card?.brand?.charAt(0).toUpperCase() + method.card?.brand?.slice(1) || 'Card'} •••• {method.card?.last4}
                              </div>
                              <div className="text-sm text-gray-500">
                                Expires {method.card?.exp_month}/{method.card?.exp_year}
                              </div>
                              {method.billing_details?.name && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {method.billing_details.name}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end space-x-2">
                            {!method.billing_details?.name && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8"
                                onClick={() => handleSetDefaultCard(method.id)}
                                disabled={setDefaultPaymentMethodMutation.isPending}
                              >
                                {setDefaultPaymentMethodMutation.isPending && method.id === setDefaultPaymentMethodMutation.variables ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : null}
                                Set as default
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 text-destructive"
                              onClick={() => handleRemoveCard(method.id)}
                              disabled={removePaymentMethodMutation.isPending}
                            >
                              {removePaymentMethodMutation.isPending && method.id === removePaymentMethodMutation.variables ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 mr-1" />
                              )}
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>


          </div>

          {/* Billing History */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billing History</CardTitle>
                <CardDescription>View and download your invoices</CardDescription>
              </CardHeader>
              <CardContent>
                {billingHistoryLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Date</th>
                          <th className="text-left py-3 px-4 font-medium">Description</th>
                          <th className="text-left py-3 px-4 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-right py-3 px-4 font-medium">Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingHistory.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              <ArrowDownCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                              <p>No billing history found</p>
                            </td>
                          </tr>
                        ) : (
                          billingHistory.map((invoice: any) => {
                            // Format date from Stripe timestamp (seconds)
                            const invoiceDate = invoice.created 
                              ? new Date(invoice.created * 1000) 
                              : new Date();
                            
                            // Format amount from Stripe (cents to dollars)
                            const amount = invoice.amount_paid 
                              ? (invoice.amount_paid / 100).toFixed(2) 
                              : "0.00";
                              
                            return (
                              <tr key={invoice.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">
                                  <div>{invoiceDate.toLocaleDateString()}</div>
                                  <div className="text-xs text-gray-500">
                                    {formatDistance(invoiceDate, new Date(), { addSuffix: true })}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  {invoice.lines?.data?.[0]?.description || "Subscription Payment"}
                                </td>
                                <td className="py-3 px-4 font-medium">${amount}</td>
                                <td className="py-3 px-4">
                                  {getInvoiceStatusBadge(invoice.status || "unknown")}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {invoice.hosted_invoice_url && (
                                    <Button size="sm" variant="ghost" asChild>
                                      <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4 mr-1" />
                                        PDF
                                      </a>
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add New Card Dialog */}
      <Dialog open={showAddCardDialog} onOpenChange={setShowAddCardDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Enter your card details to add a new payment method.
            </DialogDescription>
          </DialogHeader>
          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <AddCardForm onClose={() => setShowAddCardDialog(false)} />
            </Elements>
          ) : (
            <div className="p-6 text-center text-red-500">
              <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
              <p>Stripe is not configured properly.</p>
              <p className="text-sm">Please check your environment variables.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Billing Info Dialog */}
      <Dialog open={showEditBillingDialog} onOpenChange={setShowEditBillingDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Billing Information</DialogTitle>
            <DialogDescription>
              Update your billing information for invoices.
            </DialogDescription>
          </DialogHeader>
          <EditBillingForm 
            initialData={billingInfo} 
            user={user}
            onClose={() => setShowEditBillingDialog(false)}
            onSuccess={() => {
              setShowEditBillingDialog(false);
              queryClient.invalidateQueries({ queryKey: ['/api/billing-info'] });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;