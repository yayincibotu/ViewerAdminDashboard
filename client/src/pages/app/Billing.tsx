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

// EditBillingForm component
interface EditBillingFormProps {
  initialData: any;
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

function EditBillingForm({ initialData, user, onClose, onSuccess }: EditBillingFormProps) {
  const { toast } = useToast();
  const [isCompany, setIsCompany] = useState(
    initialData?.isCompany === true || 
    (initialData?.isCompany !== false && !!initialData?.companyName)
  );
  
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || user?.username || '',
    email: initialData?.email || user?.email || '',
    address1: initialData?.address1 || '',
    address2: initialData?.address2 || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip: initialData?.zip || '',
    country: initialData?.country || '',
    taxId: initialData?.taxId || '',
    isCompany: initialData?.isCompany === true || 
               (initialData?.isCompany !== false && !!initialData?.companyName),
    companyName: initialData?.companyName || '',
    companyRegistrationNumber: initialData?.companyRegistrationNumber || '',
    companyVatNumber: initialData?.companyVatNumber || '',
  });
  
  const [countries, setCountries] = useState<any[]>(Country.getAllCountries());
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const updateBillingMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/billing-info', data);
    },
    onSuccess: () => {
      toast({
        title: 'Billing information updated',
        description: 'Your billing information has been updated successfully.',
      });
      onSuccess();
      queryClient.invalidateQueries({ queryKey: ['/api/billing-info'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update billing information',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    },
  });
  
  useEffect(() => {
    if (formData.country) {
      const countryStates = State.getStatesOfCountry(formData.country);
      setStates(countryStates);
      
      if (formData.state && countryStates.some(s => s.isoCode === formData.state)) {
        const stateCities = City.getCitiesOfState(formData.country, formData.state);
        setCities(stateCities);
      } else {
        setCities([]);
      }
    }
  }, [formData.country, formData.state]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // If not a company, clear company fields
    const dataToSubmit = { ...formData };
    if (!isCompany) {
      dataToSubmit.companyName = '';
      dataToSubmit.companyRegistrationNumber = '';
      dataToSubmit.companyVatNumber = '';
    }
    
    updateBillingMutation.mutate(dataToSubmit);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const fieldName = id.replace('billing', '').charAt(0).toLowerCase() + id.replace('billing', '').slice(1);
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
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
  
  return (
    <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="companyBilling">Company Billing</Label>
              <Switch 
                id="companyBilling" 
                checked={isCompany} 
                onCheckedChange={(checked) => {
                  setIsCompany(checked);
                  setFormData(prev => ({...prev, isCompany: checked}));
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {isCompany ? 'Billing to a company' : 'Billing to an individual'}
            </span>
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
                required={isCompany}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="billingCompanyRegistrationNumber">Company Registration Number</Label>
              <Input
                id="billingCompanyRegistrationNumber"
                value={formData.companyRegistrationNumber}
                onChange={handleChange}
                placeholder="Registration Number (optional)"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="billingCompanyVatNumber">VAT Number</Label>
              <Input
                id="billingCompanyVatNumber"
                value={formData.companyVatNumber}
                onChange={handleChange}
                placeholder="VAT Number (optional)"
              />
            </div>
          </>
        )}
        
        <div className="grid gap-2">
          <Label htmlFor="billingFullName">Contact Name</Label>
          <Input
            id="billingFullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Full Name"
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="billingEmail">Email</Label>
          <Input
            id="billingEmail"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email address"
            required
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
              <SelectTrigger id="billingCountry">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {countries.map((country) => (
                  <SelectItem key={country.isoCode} value={country.isoCode}>
                    <div className="flex items-center">
                      <ReactCountryFlag 
                        countryCode={country.isoCode}
                        svg
                        style={{
                          width: '1em',
                          height: '1em',
                          marginRight: '0.5em'
                        }}
                      />
                      {country.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="billingState">State / Province</Label>
            <Select 
              value={formData.state}
              onValueChange={handleStateChange}
              disabled={!formData.country || states.length === 0}
            >
              <SelectTrigger id="billingState">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {states.map((state) => (
                  <SelectItem key={state.isoCode} value={state.isoCode}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="billingCity">City</Label>
            <Select 
              value={formData.city}
              onValueChange={(value) => setFormData(prev => ({...prev, city: value}))}
              disabled={!formData.state || cities.length === 0}
            >
              <SelectTrigger id="billingCity">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {cities.map((city) => (
                  <SelectItem key={city.name} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="billingZip">Postal / ZIP Code</Label>
            <Input
              id="billingZip"
              value={formData.zip}
              onChange={handleChange}
              placeholder="ZIP / Postal code"
            />
          </div>
        </div>
        
        {isCompany && (
          <div className="grid gap-2 mt-2">
            <Label htmlFor="billingTaxId">Tax ID (optional)</Label>
            <Input
              id="billingTaxId"
              value={formData.taxId}
              onChange={handleChange}
              placeholder="Tax ID number"
            />
          </div>
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

const Billing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [showEditBillingDialog, setShowEditBillingDialog] = useState(false);
  const [showInvoiceDetailsDialog, setShowInvoiceDetailsDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<any>(null);
  
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
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<{subscription: any, plan: any}[]>({
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
  
  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      return apiRequest('POST', `/api/user-subscriptions/${subscriptionId}/cancel`);
    },
    onSuccess: () => {
      toast({
        title: 'Subscription canceled',
        description: 'Your subscription has been canceled.',
      });
      setShowCancelDialog(false);
      setSubscriptionToCancel(null);
      queryClient.invalidateQueries({ queryKey: ['/api/user-subscriptions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to cancel subscription',
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <UserSidebar />
      <div className="flex-1 overflow-auto">
        <Header />
        <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Billing & Payments</h1>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column - Billing Info */}
              <div className="lg:col-span-4 space-y-6">
                {/* Billing Info Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Billing Information</h2>
                  </div>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Contact Details</CardTitle>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setShowEditBillingDialog(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
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
                                      {Country.getCountryByCode(billingInfo.country)?.name}
                                    </>
                                  ) : (
                                    billingInfo.country
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Payment Methods Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Payment Methods</h2>
                  </div>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Your Cards</CardTitle>
                        <Button
                          size="sm"
                          onClick={() => setShowAddCardDialog(true)}
                        >
                          Add Card
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {paymentMethodsLoading ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : paymentMethods.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full mb-4">
                            <CreditCard className="h-6 w-6 text-gray-400" />
                          </div>
                          <h3 className="text-sm font-medium mb-2">No payment methods</h3>
                          <p className="text-xs text-gray-500 max-w-md mb-4">
                            Add a payment method to subscribe to our services.
                          </p>
                          <Button size="sm" onClick={() => setShowAddCardDialog(true)}>
                            Add Payment Method
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {paymentMethods.map((method) => (
                            <div key={method.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 font-medium">
                                  {getCardLogo(method.card.brand)}
                                </div>
                                <div>
                                  <div className="font-medium text-sm">
                                    ••••{method.card.last4}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Exp: {method.card.exp_month}/{method.card.exp_year}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {method.isDefault ? (
                                  <div className="text-xs bg-green-100 text-green-800 py-0.5 px-2 rounded-full">
                                    Default
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSetDefaultCard(method.id)}
                                  >
                                    Set Default
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveCard(method.id)}
                                  disabled={method.isDefault}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>
              </div>

              {/* Right Column - Subscriptions and History */}
              <div className="lg:col-span-8 space-y-6">
                {/* Subscription Plans Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCardIcon className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Your Subscription Plans</h2>
                  </div>
                  
                  {subscriptionsLoading ? (
                    <Card>
                      <CardContent className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </CardContent>
                    </Card>
                  ) : subscriptions.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                          <CreditCard className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No active subscriptions</h3>
                        <p className="text-sm text-gray-500 max-w-md mb-6">
                          You don't have any active subscription plans. Subscribe to our services to get started.
                        </p>
                        <Button>
                          Browse Plans
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {subscriptions.map((subscription) => (
                        <Card key={subscription.subscription.id} className="overflow-hidden border-l-4 border-l-primary">
                          <CardHeader className="pb-3 relative">
                            <div className="absolute top-0 right-0 p-3">
                              {subscription.subscription.status === 'active' ? (
                                <div className="flex items-center gap-1.5 text-green-600">
                                  <div className="h-2.5 w-2.5 rounded-full bg-green-600 animate-pulse"></div>
                                  <span className="text-xs font-medium">Active</span>
                                </div>
                              ) : subscription.subscription.status === 'canceled' ? (
                                <div className="flex items-center gap-1.5 text-red-500">
                                  <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                                  <span className="text-xs font-medium">Canceled</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-yellow-500">
                                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500"></div>
                                  <span className="text-xs font-medium">{subscription.subscription.status}</span>
                                </div>
                              )}
                            </div>
                            <CardTitle className="text-lg">
                              {subscription.plan?.name || 'Unknown Plan'}
                            </CardTitle>
                            <CardDescription className="line-clamp-1">
                              {subscription.plan?.description || 'Plan details'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-3">
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-gray-500">Price:</span>
                                <span className="font-semibold">
                                  ${subscription.subscription.currentPrice ? subscription.subscription.currentPrice : 'N/A'} / 
                                  {subscription.subscription.billingCycle === 'monthly' ? 'month' : 
                                  subscription.subscription.billingCycle === 'yearly' ? 'year' : 
                                  subscription.subscription.billingCycle === 'weekly' ? 'week' : 'day'}
                                </span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-500">Start Date:</span>
                                <span>
                                  {subscription?.subscription?.startDate ? new Date(subscription.subscription.startDate).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              
                              {subscription?.subscription?.status === 'canceled' && subscription?.subscription?.endDate && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-500">End Date:</span>
                                  <span>
                                    {new Date(subscription.subscription.endDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-500">Next Billing:</span>
                                <span>
                                  {subscription?.subscription?.status === 'canceled' ? 'No further billing' : 
                                    (subscription?.subscription?.nextBillingDate ? 
                                      new Date(subscription.subscription.nextBillingDate).toLocaleDateString() : 'N/A')}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between pt-3 border-t bg-gray-50 dark:bg-gray-800">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                // Use Link component's navigation to avoid a full page reload
                                window.history.pushState({}, '', `/app/bot-control?id=${subscription.subscription.id}`);
                                // Manually trigger navigation event
                                window.dispatchEvent(new PopStateEvent('popstate'));
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1.5" /> View Plan
                            </Button>
                            
                            {subscription.subscription.status === 'active' && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => {
                                  setSubscriptionToCancel(subscription);
                                  setShowCancelDialog(true);
                                }}
                              >
                                Cancel Plan
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>
                
                {/* Billing History Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Receipt className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Billing History</h2>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Recent Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {billingHistoryLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : billingHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full mb-4">
                            <Receipt className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">No billing history</h3>
                          <p className="text-sm text-gray-500 max-w-md">
                            You don't have any billing history yet. Your invoices will appear here after your first payment.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto -mx-4 sm:-mx-6">
                          <div className="inline-block min-w-full align-middle px-4 sm:px-6">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead>
                                <tr className="text-left">
                                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                  <th scope="col" className="py-3.5 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                  <th scope="col" className="py-3.5 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                  <th scope="col" className="py-3.5 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                  <th scope="col" className="py-3.5 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {billingHistory.map((invoice) => (
                                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="py-4 pl-4 pr-3 text-sm whitespace-nowrap">
                                      {new Date(invoice.date).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-3 text-sm">
                                      {invoice.description || `Invoice #${invoice.number}`}
                                    </td>
                                    <td className="py-4 px-3 text-sm font-medium">
                                      ${Number(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                                    </td>
                                    <td className="py-4 px-3 text-sm">
                                      {getInvoiceStatusBadge(invoice.status)}
                                    </td>
                                    <td className="py-4 px-3 text-sm text-right whitespace-nowrap">
                                      <div className="flex space-x-2 justify-end">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setSelectedInvoice(invoice);
                                            setShowInvoiceDetailsDialog(true);
                                          }}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        {invoice.invoiceUrl && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => window.open(invoice.invoiceUrl, '_blank')}
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Card Dialog */}
      <Dialog open={showAddCardDialog} onOpenChange={setShowAddCardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new credit or debit card to your account.
            </DialogDescription>
          </DialogHeader>
          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <AddCardForm onClose={() => setShowAddCardDialog(false)} />
            </Elements>
          ) : (
            <div className="py-4">
              <p className="text-red-500">Stripe is not properly configured. Please contact support.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Billing Information Dialog */}
      <Dialog open={showEditBillingDialog} onOpenChange={setShowEditBillingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Billing Information</DialogTitle>
            <DialogDescription>
              Update your billing address and information.
            </DialogDescription>
          </DialogHeader>
          <EditBillingForm 
            initialData={billingInfo} 
            user={user}
            onClose={() => setShowEditBillingDialog(false)}
            onSuccess={() => setShowEditBillingDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">Important information about cancellation</h4>
                  <p className="text-sm text-yellow-700">
                    Your subscription will remain active until the end of the current billing period. 
                    You will not be charged again after that date.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-2">Plan: <span className="font-medium">{subscriptionToCancel?.plan?.name}</span></p>
            <p className="text-sm text-gray-500">
              Current period ends: <span className="font-medium">
                {subscriptionToCancel?.nextBillingDate ? new Date(subscriptionToCancel.nextBillingDate).toLocaleDateString() : 'Unknown'}
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => subscriptionToCancel && cancelSubscriptionMutation.mutate(subscriptionToCancel.id)}
              disabled={cancelSubscriptionMutation.isPending}
            >
              {cancelSubscriptionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Details Dialog */}
      <Dialog open={showInvoiceDetailsDialog} onOpenChange={setShowInvoiceDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Detailed information about this invoice
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="py-4">
              <div className="flex justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold mb-1">Invoice #{selectedInvoice.number}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedInvoice.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="mb-2">{getInvoiceStatusBadge(selectedInvoice.status)}</div>
                  {selectedInvoice.invoiceUrl && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(selectedInvoice.invoiceUrl, '_blank')}
                      className="flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-1.5" />
                      PDF Invoice
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Billed To</h4>
                  <p className="font-medium">{selectedInvoice.customer?.name || user.username}</p>
                  <p>{selectedInvoice.customer?.email || user.email}</p>
                  {selectedInvoice.customer?.address && (
                    <>
                      <p>{selectedInvoice.customer.address.line1}</p>
                      {selectedInvoice.customer.address.line2 && (
                        <p>{selectedInvoice.customer.address.line2}</p>
                      )}
                      <p>
                        {selectedInvoice.customer.address.city}
                        {selectedInvoice.customer.address.state && `, ${selectedInvoice.customer.address.state}`}
                        {selectedInvoice.customer.address.postal_code && ` ${selectedInvoice.customer.address.postal_code}`}
                      </p>
                      <p>{selectedInvoice.customer.address.country}</p>
                    </>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Payment Information</h4>
                  {selectedInvoice.paymentMethod ? (
                    <div>
                      <p className="font-medium">
                        {selectedInvoice.paymentMethod.card.brand.charAt(0).toUpperCase() + 
                         selectedInvoice.paymentMethod.card.brand.slice(1)} ••••{selectedInvoice.paymentMethod.card.last4}
                      </p>
                      <p>Exp: {selectedInvoice.paymentMethod.card.exp_month}/{selectedInvoice.paymentMethod.card.exp_year}</p>
                    </div>
                  ) : (
                    <p>Payment method details not available</p>
                  )}
                </div>
              </div>
              
              <div className="border rounded-md mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-3 text-sm font-medium text-gray-500">Description</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500">Period</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((item: any, index: number) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.description}</div>
                          {item.plan && (
                            <div className="text-sm text-gray-500">
                              {item.plan.interval_count > 1 ? `${item.plan.interval_count} ` : ''}
                              {item.plan.interval === 'month' 
                                ? item.plan.interval_count > 1 ? 'months' : 'month'
                                : item.plan.interval === 'year'
                                  ? item.plan.interval_count > 1 ? 'years' : 'year'
                                  : item.plan.interval === 'week'
                                    ? item.plan.interval_count > 1 ? 'weeks' : 'week'
                                    : item.plan.interval_count > 1 ? 'days' : 'day'
                              }
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.period && (
                            <>
                              {new Date(item.period.start * 1000).toLocaleDateString()} - {new Date(item.period.end * 1000).toLocaleDateString()}
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          ${Number(item.amount / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-gray-50">
                      <td colSpan={2} className="px-4 py-3 text-right font-medium">
                        Subtotal
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${Number(selectedInvoice.subtotal / 100).toFixed(2)}
                      </td>
                    </tr>
                    {selectedInvoice.tax && (
                      <tr className="border-t bg-gray-50">
                        <td colSpan={2} className="px-4 py-3 text-right font-medium">
                          Tax
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          ${Number(selectedInvoice.tax / 100).toFixed(2)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t bg-gray-50">
                      <td colSpan={2} className="px-4 py-3 text-right font-semibold">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ${Number(selectedInvoice.amount / 100).toFixed(2)} {selectedInvoice.currency.toUpperCase()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
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

export default Billing;