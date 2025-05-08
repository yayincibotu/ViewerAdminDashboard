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
import { Switch } from '@/components/ui/switch';
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
  Star,
  Building2,
  SwitchCamera,
  Eye,
  FileText,
  Receipt,
  CreditCard as CreditCardIcon,
  ExternalLink
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
  const [showInvoiceDetailsDialog, setShowInvoiceDetailsDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
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
    // Şirket bilgileri eklenmiştir
    isCompany?: boolean;
    companyName?: string;
    companyRegistrationNumber?: string;
    companyVatNumber?: string;
    [key: string]: any; // Allow any other properties that might come from the API
  }
  
  // Fetch billing info from the server
  const { data: billingInfo = {} as BillingInfoType, isSuccess: billingInfoLoaded } = useQuery<BillingInfoType>({
    queryKey: ['/api/billing-info'],
    enabled: !!user
  });
  
  // Debug log removed for production
  
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
          {/* Debug info - Hidden in production */}
          {false && (
            <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
              <p>Debug - Raw billing info:</p>
              <pre className="overflow-auto max-h-20">{JSON.stringify(billingInfo, null, 2)}</pre>
            </div>
          )}

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
                  {billingInfo?.companyName ? (
                    <>
                      <div className="flex items-center gap-1.5 text-primary font-medium pb-1 mb-1 border-b">
                        <Building2 className="h-4 w-4" />
                        <span>Company Billing</span>
                      </div>
                      <div>
                        <div className="font-semibold">Company:</div>
                        <div>{billingInfo.companyName}</div>
                      </div>
                      {billingInfo.companyRegistrationNumber && (
                        <div>
                          <div className="font-semibold">Registration Number:</div>
                          <div>{billingInfo.companyRegistrationNumber}</div>
                        </div>
                      )}
                      {billingInfo.companyVatNumber && (
                        <div>
                          <div className="font-semibold">VAT Number:</div>
                          <div>{billingInfo.companyVatNumber}</div>
                        </div>
                      )}
                    </>
                  ) : null}
                  
                  <div>
                    <div className="font-semibold">Contact Name:</div>
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
                                  <div className="flex justify-end gap-2">
                                    {invoice.hosted_invoice_url && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => window.open(invoice.hosted_invoice_url, '_blank')}
                                        title="View invoice in Stripe"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(`/api/invoice/${invoice.id}/pdf`, '_blank')}
                                      title="Download invoice PDF"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        apiRequest('GET', `/api/billing-history/${invoice.id}`)
                                          .then(res => res.json())
                                          .then(data => {
                                            setSelectedInvoice(data);
                                            setShowInvoiceDetailsDialog(true);
                                          })
                                          .catch(error => {
                                            toast({
                                              title: "Error fetching invoice details",
                                              description: error.message,
                                              variant: "destructive"
                                            });
                                          });
                                      }}
                                    >
                                      <Info className="h-4 w-4 mr-2" />
                                      Details
                                    </Button>
                                  </div>
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
              
              // Sync billing information with Stripe
              if (user.stripeCustomerId) {
                apiRequest('POST', '/api/sync-billing-with-stripe')
                  .then(() => {
                    toast({
                      title: 'Billing information synced',
                      description: 'Your billing information has been synced with payment provider.',
                    });
                  })
                  .catch(error => {
                    console.error('Failed to sync billing info with Stripe:', error);
                  });
              }
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Invoice Details Dialog */}
      <Dialog open={showInvoiceDetailsDialog} onOpenChange={setShowInvoiceDetailsDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Complete information about this invoice
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice ? (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Invoice #{selectedInvoice.number}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedInvoice.created * 1000).toLocaleDateString()} ({formatDistance(new Date(selectedInvoice.created * 1000), new Date(), { addSuffix: true })})
                  </p>
                </div>
                <div className="flex items-center mt-2 sm:mt-0">
                  {getInvoiceStatusBadge(selectedInvoice.status)}
                </div>
              </div>
              
              {/* Invoice Summary */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Bill To</h4>
                  <p className="text-sm">{selectedInvoice.customer_name || user.username}</p>
                  <p className="text-sm">{selectedInvoice.customer_email || user.email}</p>
                  {selectedInvoice.customer_address?.line1 && (
                    <>
                      <p className="text-sm">{selectedInvoice.customer_address.line1}</p>
                      {selectedInvoice.customer_address.line2 && (
                        <p className="text-sm">{selectedInvoice.customer_address.line2}</p>
                      )}
                      <p className="text-sm">
                        {selectedInvoice.customer_address.city}, {selectedInvoice.customer_address.state} {selectedInvoice.customer_address.postal_code}
                      </p>
                      <p className="text-sm">{selectedInvoice.customer_address.country}</p>
                    </>
                  )}
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Payment Details</h4>
                  <div className="flex items-center gap-1.5">
                    <CreditCardIcon className="h-4 w-4 text-gray-500" />
                    <p className="text-sm">
                      {selectedInvoice.payment_intent?.payment_method_details?.card?.brand
                        ? `${selectedInvoice.payment_intent.payment_method_details.card.brand.toUpperCase()} •••• ${selectedInvoice.payment_intent.payment_method_details.card.last4}`
                        : "Payment method information not available"}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <p className="text-sm">
                      {selectedInvoice.payment_intent?.created 
                        ? `Paid on ${new Date(selectedInvoice.payment_intent.created * 1000).toLocaleDateString()}`
                        : "Payment date not available"}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Invoice Line Items */}
              <div>
                <h4 className="text-sm font-medium mb-2">Invoice Items</h4>
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedInvoice.lines?.data?.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="font-medium">{item.description}</div>
                            {item.period?.start && item.period?.end && (
                              <div className="text-xs text-gray-500">
                                {new Date(item.period.start * 1000).toLocaleDateString()} - {new Date(item.period.end * 1000).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium">${(item.amount / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">Subtotal</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">${(selectedInvoice.subtotal / 100).toFixed(2)}</td>
                      </tr>
                      {selectedInvoice.tax && (
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Tax</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">${(selectedInvoice.tax / 100).toFixed(2)}</td>
                        </tr>
                      )}
                      {selectedInvoice.total_discount_amounts && selectedInvoice.total_discount_amounts > 0 && (
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Discounts</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-green-600">-${(selectedInvoice.total_discount_amounts / 100).toFixed(2)}</td>
                        </tr>
                      )}
                      <tr className="border-t">
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">Total</td>
                        <td className="px-4 py-3 text-sm text-right font-bold">${(selectedInvoice.total / 100).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              
              {/* Download and View Actions */}
              <div className="flex justify-end gap-3">
                {selectedInvoice.hosted_invoice_url && (
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(selectedInvoice.hosted_invoice_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View in Browser
                  </Button>
                )}
                <Button 
                  variant="default"
                  onClick={() => window.open(`/api/invoice/${selectedInvoice.id}/pdf`, '_blank')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading invoice details...</p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowInvoiceDetailsDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// EditBillingForm component
interface EditBillingFormProps {
  initialData: any;
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

function EditBillingForm({ initialData, user, onClose, onSuccess }: EditBillingFormProps) {
  const { toast } = useToast();
  const [isCompany, setIsCompany] = useState(!!initialData?.companyName);
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || user?.username || '',
    email: initialData?.email || user?.email || '',
    address1: initialData?.address1 || '',
    address2: initialData?.address2 || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip: initialData?.zip || '',
    country: initialData?.country || '',
    isCompany: !!initialData?.companyName,
    companyName: initialData?.companyName || '',
    companyRegistrationNumber: initialData?.companyRegistrationNumber || '',
    companyVatNumber: initialData?.companyVatNumber || '',
  });
  
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initial setup of states and cities based on country and state
  useEffect(() => {
    if (formData.country) {
      const countryStates = State.getStatesOfCountry(formData.country);
      setStates(countryStates);
      
      if (formData.state && countryStates.length > 0) {
        const stateCities = City.getCitiesOfState(formData.country, formData.state);
        setCities(stateCities);
      }
    }
  }, []);
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Log the data being sent to verify company info is included
      console.log("Sending form data to server:", formData);
      
      const response = await apiRequest('POST', '/api/billing-info', formData);
      const data = await response.json();
      
      console.log("Server response:", data);
      
      toast({
        title: 'Billing information updated',
        description: 'Your billing information has been updated successfully.',
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error updating billing information',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle company info
  const handleCompanyToggle = (checked: boolean) => {
    setIsCompany(checked);
    setFormData(prev => ({
      ...prev,
      isCompany: checked
    }));
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    // Extract field name from ID by removing billing prefix
    let field = id.startsWith('billing') ? id.slice(7) : id;
    // Convert first letter to lowercase for camelCase
    field = field.charAt(0).toLowerCase() + field.slice(1);
    
    console.log(`Input change: ID=${id}, field=${field}, value=${value}`);
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle country selection
  const handleCountryChange = (value: string) => {
    const countryStates = State.getStatesOfCountry(value);
    setStates(countryStates);
    setCities([]);
    
    setFormData(prev => ({
      ...prev,
      country: value,
      state: '',
      city: ''
    }));
  };
  
  // Handle state selection
  const handleStateChange = (value: string) => {
    const stateCities = City.getCitiesOfState(formData.country, value);
    setCities(stateCities);
    
    setFormData(prev => ({
      ...prev,
      state: value,
      city: ''
    }));
  };
  
  // Handle city selection
  const handleCityChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      city: value
    }));
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="billingFullName">Full Name</Label>
          <Input
            id="billingFullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Full Name"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="billingEmail">Email</Label>
          <Input
            id="billingEmail"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@example.com"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="billingAddress1">Address Line 1</Label>
          <Input
            id="billingAddress1"
            value={formData.address1}
            onChange={handleChange}
            placeholder="Street address"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="billingAddress2">Address Line 2</Label>
          <Input
            id="billingAddress2"
            value={formData.address2}
            onChange={handleChange}
            placeholder="Apt, Suite, etc. (optional)"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="billingCountry">Country</Label>
            <Select 
              value={formData.country}
              onValueChange={handleCountryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {Country.getAllCountries()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((country) => (
                    <SelectItem key={country.isoCode} value={country.isoCode}>
                      <div className="flex items-center gap-2">
                        <ReactCountryFlag 
                          countryCode={country.isoCode}
                          svg
                          style={{
                            width: '1.2em',
                            height: '1.2em',
                          }}
                        />
                        {country.name}
                      </div>
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="billingState">State / Province</Label>
            {states.length > 0 ? (
              <Select 
                value={formData.state}
                onValueChange={handleStateChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {states.map((state) => (
                    <SelectItem key={state.isoCode} value={state.isoCode}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="billingState"
                value={formData.state}
                onChange={handleChange}
                placeholder="Enter state/province"
              />
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="billingCity">City</Label>
            {cities.length > 0 ? (
              <Select 
                value={formData.city}
                onValueChange={handleCityChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {cities.map((city) => (
                    <SelectItem key={city.name} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="billingCity"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter city"
              />
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="billingZip">ZIP / Postal</Label>
            <Input
              id="billingZip"
              value={formData.zip}
              onChange={handleChange}
              placeholder="ZIP/Postal Code"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 py-2 border-t border-b my-2">
          <Switch 
            id="company-mode" 
            checked={isCompany}
            onCheckedChange={handleCompanyToggle}
          />
          <div className="grid gap-0.5">
            <Label htmlFor="company-mode" className="text-sm font-medium flex items-center gap-1">
              <Building2 className="h-4 w-4 text-primary" />
              Company Billing
            </Label>
            <span className="text-xs text-gray-500">Purchase as a company/business</span>
          </div>
        </div>
        
        {isCompany && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="billingCompanyName">Company Name</Label>
              <Input
                id="billingCompanyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Company Name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="billingCompanyRegistrationNumber">Registration Number</Label>
                <Input
                  id="billingCompanyRegistrationNumber"
                  value={formData.companyRegistrationNumber}
                  onChange={handleChange}
                  placeholder="Company Registration Number"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="billingCompanyVatNumber">VAT Number</Label>
                <Input
                  id="billingCompanyVatNumber"
                  value={formData.companyVatNumber}
                  onChange={handleChange}
                  placeholder="VAT/GST Number"
                />
              </div>
            </div>
          </>
        )}
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default Billing;