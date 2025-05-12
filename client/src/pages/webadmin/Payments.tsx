import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AdminLayout from '@/components/dashboard/AdminLayout';
import AdminHeader from '@/components/dashboard/AdminHeader';
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
  refunded: 'bg-gray-500',
};

// Define the payment interface
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

// Define the schema for refund form
const refundSchema = z.object({
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
});

const AdminPayments = () => {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all');
  const { toast } = useToast();

  // Fetch payments data
  const {
    data: payments = [],
    isLoading,
    refetch: refetchPayments
  } = useQuery<Payment[]>({
    queryKey: ['/api/admin/payments'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/payments');
      return res.json();
    },
  });

  // Handle refund form
  const refundForm = useForm<z.infer<typeof refundSchema>>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      reason: '',
    },
  });

  // Process refund mutation
  const refundMutation = useMutation({
    mutationFn: async (data: { paymentId: number; reason: string }) => {
      const res = await apiRequest('POST', `/api/admin/payments/${data.paymentId}/refund`, { reason: data.reason });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Refund Processed',
        description: 'The payment has been successfully refunded.',
        variant: 'default',
      });
      setRefundDialogOpen(false);
      refetchPayments();
    },
    onError: (error: any) => {
      toast({
        title: 'Refund Failed',
        description: error.message || 'There was an error processing the refund.',
        variant: 'destructive',
      });
    },
  });

  // Submit refund form
  const onRefundSubmit = (data: z.infer<typeof refundSchema>) => {
    if (!selectedPayment) return;
    
    refundMutation.mutate({
      paymentId: selectedPayment.id,
      reason: data.reason,
    });
  };

  // Filter payments based on search query and filters
  const filteredPayments = payments.filter(payment => {
    // Search query filter
    const matchesSearch = searchQuery === '' || 
      payment.id.toString().includes(searchQuery) || 
      payment.userId.toString().includes(searchQuery) ||
      (payment.description && payment.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    // Payment type filter
    const matchesType = paymentTypeFilter === 'all' || payment.paymentType === paymentTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Format currency for display
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  return (
    <AdminLayout>
      <AdminHeader
        title="Payment Management"
        description="View and manage all payment transactions"
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => refetchPayments()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        }
      />
      <div className="p-6">
        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Payments</CardTitle>
                <CardDescription>View and manage all payment transactions</CardDescription>
              </div>

              {/* Search and filter controls */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
                    className="pl-8 w-[200px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Payment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Tabs for different payment types */}
            <Tabs defaultValue="all" className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All Payments</TabsTrigger>
                <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                <TabsTrigger value="one-time">One-time Payments</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                {/* Payments table */}
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
                        {filteredPayments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-4">
                              No payments found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredPayments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>{format(new Date(payment.createdAt), 'MMM dd, yyyy')}</TableCell>
                              <TableCell>{payment.userId}</TableCell>
                              <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                              <TableCell>{payment.paymentType}</TableCell>
                              <TableCell>{payment.paymentMethod}</TableCell>
                              <TableCell>
                                <Badge className={`${statusColors[payment.status as keyof typeof statusColors] || 'bg-gray-500'} text-white`}>
                                  {payment.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {payment.invoiceId ? (
                                  <Button variant="link" size="sm">
                                    View Invoice
                                  </Button>
                                ) : (
                                  'N/A'
                                )}
                              </TableCell>
                              <TableCell className="max-w-[150px] truncate">
                                {payment.description || 'N/A'}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => {
                                      setSelectedPayment(payment);
                                      setRefundDialogOpen(true);
                                    }}
                                    disabled={payment.status === 'refunded'}
                                  >
                                    Refund
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
              </TabsContent>
              <TabsContent value="subscriptions">
                {/* Subscription payments table - same structure with filtered data */}
                <p>Subscription payments will be displayed here</p>
              </TabsContent>
              <TabsContent value="one-time">
                {/* One-time payments table - same structure with filtered data */}
                <p>One-time payments will be displayed here</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Refund Dialog */}
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
    </AdminLayout>
  );
};

export default AdminPayments;