import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AdminSidebar from '@/components/dashboard/AdminSidebar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarIcon, CreditCard, Filter, RefreshCw, Search } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// Payment status colors
const statusColors = {
  completed: 'bg-green-500',
  pending: 'bg-yellow-500',
  failed: 'bg-red-500',
  refunded: 'bg-purple-500',
  canceled: 'bg-gray-500',
};

// Payment type colors
const paymentTypeColors = {
  payment: 'bg-blue-500',
  refund: 'bg-purple-500',
  chargeback: 'bg-red-700',
  subscription: 'bg-emerald-600',
};

// Define the Payment type
interface Payment {
  id: number;
  userId: number;
  invoiceId: number | null;
  amount: number;
  currency: string;
  paymentType: string;
  paymentMethod: string;
  status: string;
  stripePaymentIntentId: string | null;
  transactionId: string | null;
  description: string | null;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

// Define the refund form schema
const refundFormSchema = z.object({
  reason: z.string().min(3, { message: "Refund reason is required" })
});

const AdminPayments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'payments', 'refunds'
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  const { toast } = useToast();

  // Set up the refund form
  const refundForm = useForm<z.infer<typeof refundFormSchema>>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: {
      reason: ''
    }
  });

  // Query payments data
  const { data: payments, isLoading, refetch } = useQuery<Payment[]>({
    queryKey: ['/api/admin/payments'],
    queryFn: async () => {
      // Construct the query parameters based on filters
      let url = '/api/admin/payments';
      const params = new URLSearchParams();
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      if (dateRange.from && dateRange.to) {
        params.append('startDate', dateRange.from.toISOString());
        params.append('endDate', dateRange.to.toISOString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await apiRequest('GET', url);
      return await res.json();
    }
  });

  // Process refund mutation
  const refundMutation = useMutation({
    mutationFn: async (data: { paymentId: number, reason: string }) => {
      const res = await apiRequest('POST', `/api/admin/payments/${data.paymentId}/refund`, { reason: data.reason });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Refund processed",
        description: "The payment has been refunded successfully.",
      });
      // Close the dialog and clear the form
      setRefundDialogOpen(false);
      refundForm.reset();
      // Refresh the payments data
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Refund failed",
        description: error.message || "An error occurred while processing the refund.",
        variant: "destructive",
      });
    }
  });

  // Handle refund form submission
  const onRefundSubmit = (values: z.infer<typeof refundFormSchema>) => {
    if (!selectedPayment) return;
    
    refundMutation.mutate({ 
      paymentId: selectedPayment.id, 
      reason: values.reason 
    });
  };

  // Filter payments based on search term
  const filteredPayments = payments?.filter(payment => {
    // Filter by search term (check transaction ID, payment intent ID, or user ID)
    const searchMatch = !searchTerm || 
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.stripePaymentIntentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userId.toString().includes(searchTerm) ||
      (payment.invoiceId && payment.invoiceId.toString().includes(searchTerm)) ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
    // Filter by tab selection
    const tabMatch = activeTab === 'all' || 
      (activeTab === 'payments' && payment.paymentType === 'payment') ||
      (activeTab === 'refunds' && payment.paymentType === 'refund');
    
    return searchMatch && tabMatch;
  });

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Payment Management</CardTitle>
            <CardDescription>View and manage all payment transactions</CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Tabs for different payment types */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All Transactions</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="refunds">Refunds</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex items-center relative w-full sm:w-96">
                <Search className="absolute left-2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search by ID, transaction ID, or description..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <div className="flex gap-2">
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      {statusFilter || 'Filter by status'}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Date Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        "Date Range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={{
                        from: dateRange.from,
                        to: dateRange.to
                      }}
                      onSelect={(range) => {
                        if (range) {
                          setDateRange({ from: range.from, to: range.to });
                        } else {
                          setDateRange({});
                        }
                      }}
                      numberOfMonths={2}
                    />
                    <div className="flex items-center justify-between px-4 pb-4">
                      <Button variant="outline" onClick={() => setDateRange({})}>Clear</Button>
                      <Button onClick={() => refetch()}>Apply</Button>
                    </div>
                  </PopoverContent>
                </Popover>
                
                {/* Refresh Button */}
                <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
            
            {/* Payments Table */}
            {isLoading ? (
              <div className="py-10 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-2 text-gray-500">Loading payment data...</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          No payment transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments?.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {format(new Date(payment.createdAt), "MMM d, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>{payment.userId}</TableCell>
                          <TableCell className={payment.paymentType === 'refund' ? 'text-red-600' : ''}>
                            {formatCurrency(payment.amount, payment.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${paymentTypeColors[payment.paymentType as keyof typeof paymentTypeColors] || 'bg-gray-500'} text-white`}>
                              {payment.paymentType}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">
                            <div className="flex items-center">
                              {payment.paymentMethod === 'card' && <CreditCard className="h-4 w-4 mr-1" />}
                              {payment.paymentMethod}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[payment.status as keyof typeof statusColors] || 'bg-gray-500'} text-white`}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.invoiceId ? (
                              <Button variant="link" className="p-0 h-auto" onClick={() => {
                                // Navigate to invoice
                                window.open(`/webadmin/invoices?id=${payment.invoiceId}`, '_blank');
                              }}>
                                #{payment.invoiceId}
                              </Button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="truncate max-w-[200px] block">
                              {payment.description || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {/* Refund button (only for completed payments) */}
                              {payment.status === 'completed' && payment.paymentType !== 'refund' && (
                                <Button variant="destructive" size="sm" onClick={() => {
                                  setSelectedPayment(payment);
                                  setRefundDialogOpen(true);
                                }}>
                                  Refund
                                </Button>
                              )}
                              {/* View details button */}
                              <Button variant="outline" size="sm" onClick={() => {
                                // Navigate to payment details
                                // TODO: Add payment details view
                              }}>
                                Details
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">
              {filteredPayments?.length} payment transactions
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Refund Confirmation Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              You are about to refund payment #{selectedPayment?.id} for {selectedPayment?.amount && selectedPayment?.currency ? formatCurrency(selectedPayment.amount, selectedPayment.currency) : '$0.00'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...refundForm}>
            <form onSubmit={refundForm.handleSubmit(onRefundSubmit)} className="space-y-6">
              <FormField
                control={refundForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refund Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter reason for the refund" {...field} />
                    </FormControl>
                    <FormDescription>
                      This will be recorded in the system and visible to the customer.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="destructive" 
                  disabled={refundMutation.isPending}
                >
                  {refundMutation.isPending ? "Processing..." : "Process Refund"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;