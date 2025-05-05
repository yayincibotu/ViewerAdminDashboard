import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import UserSidebar from '@/components/dashboard/UserSidebar';
import Header from '@/components/dashboard/Header';
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
  AlertTriangle
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistance } from 'date-fns';

// Mock data - in production, this would come from the API
const PAYMENT_METHODS = [
  {
    id: 'card-1',
    type: 'credit_card',
    cardBrand: 'visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2024,
    isDefault: true
  },
  {
    id: 'card-2',
    type: 'credit_card',
    cardBrand: 'mastercard',
    last4: '8210',
    expMonth: 8,
    expYear: 2025,
    isDefault: false
  }
];

const BILLING_HISTORY = [
  {
    id: 'inv-001',
    date: new Date(2023, 0, 15),
    amount: 49.99,
    status: 'paid',
    description: '25 Live Viewers Plan - Monthly',
    invoice_url: '#'
  },
  {
    id: 'inv-002',
    date: new Date(2023, 1, 15),
    amount: 49.99,
    status: 'paid',
    description: '25 Live Viewers Plan - Monthly',
    invoice_url: '#'
  },
  {
    id: 'inv-003',
    date: new Date(2023, 2, 15),
    amount: 49.99,
    status: 'failed',
    description: '25 Live Viewers Plan - Monthly',
    invoice_url: '#'
  },
  {
    id: 'inv-004',
    date: new Date(2023, 3, 15),
    amount: 99.99,
    status: 'paid',
    description: '50 Live Viewers Plan - Monthly',
    invoice_url: '#'
  },
  {
    id: 'inv-005',
    date: new Date(2023, 4, 15),
    amount: 99.99,
    status: 'paid',
    description: '50 Live Viewers Plan - Monthly',
    invoice_url: '#'
  }
];

const Billing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [showEditBillingDialog, setShowEditBillingDialog] = useState(false);
  const [newCardDetails, setNewCardDetails] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: '',
  });

  // This would be a real API query in production
  const { data: paymentMethods = PAYMENT_METHODS, isLoading: paymentMethodsLoading } = useQuery({
    queryKey: ['/api/payment-methods'],
    enabled: false, // Disable actual API call since we're using mock data
  });

  // This would be a real API query in production
  const { data: billingHistory = BILLING_HISTORY, isLoading: billingHistoryLoading } = useQuery({
    queryKey: ['/api/billing-history'],
    enabled: false, // Disable actual API call since we're using mock data
  });

  const addPaymentMethodMutation = useMutation({
    mutationFn: async (cardDetails) => {
      // Simulate API call
      return new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000));
    },
    onSuccess: () => {
      toast({
        title: 'Payment method added',
        description: 'Your payment method has been added successfully.',
      });
      setShowAddCardDialog(false);
      // In a real app, we would invalidate the payment methods query
      // queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add payment method',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAddCard = () => {
    addPaymentMethodMutation.mutate(newCardDetails);
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
                    {paymentMethods.map((method) => (
                      <div 
                        key={method.id} 
                        className={`border rounded-lg p-4 relative ${method.isDefault ? 'border-primary/50 bg-primary/5' : ''}`}
                      >
                        {method.isDefault && (
                          <div className="absolute top-3 right-3 text-xs font-medium text-primary">
                            Default
                          </div>
                        )}
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3 text-xl">
                            {getCardLogo(method.cardBrand)}
                          </div>
                          <div>
                            <div className="font-medium">
                              {method.cardBrand.charAt(0).toUpperCase() + method.cardBrand.slice(1)} •••• {method.last4}
                            </div>
                            <div className="text-sm text-gray-500">
                              Expires {method.expMonth}/{method.expYear}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end space-x-2">
                          {!method.isDefault && (
                            <Button size="sm" variant="ghost" className="h-8">
                              Set as default
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 text-destructive">
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing Info Card */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Billing Information</CardTitle>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setShowEditBillingDialog(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <CardDescription>Your billing details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Name</div>
                    <div>{user.username}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Email</div>
                    <div>{user.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Billing Address</div>
                    <div>123 Streaming Ave</div>
                    <div>San Francisco, CA 94103</div>
                    <div>United States</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Tax ID</div>
                    <div>US123456789</div>
                  </div>
                </div>
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
                        {billingHistory.map((invoice) => (
                          <tr key={invoice.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>{invoice.date.toLocaleDateString()}</div>
                              <div className="text-xs text-gray-500">
                                {formatDistance(invoice.date, new Date(), { addSuffix: true })}
                              </div>
                            </td>
                            <td className="py-3 px-4">{invoice.description}</td>
                            <td className="py-3 px-4 font-medium">${invoice.amount.toFixed(2)}</td>
                            <td className="py-3 px-4">
                              {getInvoiceStatusBadge(invoice.status)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button size="sm" variant="ghost" asChild>
                                <a href={invoice.invoice_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-1" />
                                  PDF
                                </a>
                              </Button>
                            </td>
                          </tr>
                        ))}
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
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cardName">Name on Card</Label>
              <Input
                id="cardName"
                value={newCardDetails.cardName}
                onChange={(e) => setNewCardDetails({ ...newCardDetails, cardName: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                value={newCardDetails.cardNumber}
                onChange={(e) => setNewCardDetails({ ...newCardDetails, cardNumber: e.target.value })}
                placeholder="4242 4242 4242 4242"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cardExpiry">Expiry Date</Label>
                <Input
                  id="cardExpiry"
                  value={newCardDetails.cardExpiry}
                  onChange={(e) => setNewCardDetails({ ...newCardDetails, cardExpiry: e.target.value })}
                  placeholder="MM/YY"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cardCvc">CVC</Label>
                <Input
                  id="cardCvc"
                  value={newCardDetails.cardCvc}
                  onChange={(e) => setNewCardDetails({ ...newCardDetails, cardCvc: e.target.value })}
                  placeholder="123"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCardDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddCard} 
              disabled={addPaymentMethodMutation.isPending}
            >
              {addPaymentMethodMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Card"
              )}
            </Button>
          </DialogFooter>
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
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="billingName">Full Name</Label>
              <Input
                id="billingName"
                defaultValue={user.username}
                placeholder="Full Name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="billingEmail">Email</Label>
              <Input
                id="billingEmail"
                defaultValue={user.email}
                placeholder="email@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="billingAddress1">Address Line 1</Label>
              <Input
                id="billingAddress1"
                defaultValue="123 Streaming Ave"
                placeholder="Street address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="billingAddress2">Address Line 2</Label>
              <Input
                id="billingAddress2"
                placeholder="Apt, Suite, etc. (optional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="billingCity">City</Label>
                <Input
                  id="billingCity"
                  defaultValue="San Francisco"
                  placeholder="City"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="billingState">State / Province</Label>
                <Input
                  id="billingState"
                  defaultValue="CA"
                  placeholder="State/Province"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="billingZip">ZIP / Postal</Label>
                <Input
                  id="billingZip"
                  defaultValue="94103"
                  placeholder="ZIP/Postal Code"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="billingCountry">Country</Label>
                <Select defaultValue="US">
                  <SelectTrigger id="billingCountry">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taxId">Tax ID (Optional)</Label>
              <Input
                id="taxId"
                defaultValue="US123456789"
                placeholder="Tax ID Number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditBillingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: 'Billing information updated',
                description: 'Your billing information has been updated successfully.',
              });
              setShowEditBillingDialog(false);
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;