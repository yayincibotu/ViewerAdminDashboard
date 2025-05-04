import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Search, Download, Calendar, Filter, FileText, RefreshCcw, MoreVertical, X, DollarSign, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

const AdminPayments: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isViewPaymentDialogOpen, setIsViewPaymentDialogOpen] = useState<boolean>(false);
  
  // Fetch payments data
  const { data: payments = [] } = useQuery({
    queryKey: ['/api/admin/payments'],
  });
  
  // Fetch users data for referencing
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
  });
  
  // Filter payments based on search query and filters
  const filteredPayments = payments.filter((payment: any) => {
    const user = users.find((user: any) => user.id === payment.userId);
    const username = user ? user.username : 'Unknown';
    
    const matchesSearch = searchQuery
      ? (username.toLowerCase().includes(searchQuery.toLowerCase()) || 
         payment.stripePaymentIntentId?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
      
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesPaymentMethod = paymentMethodFilter === 'all' || payment.paymentMethod === paymentMethodFilter;
    
    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 hover:bg-red-600">Failed</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">{status}</Badge>;
    }
  };
  
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'stripe':
        return <CreditCard className="h-4 w-4 text-blue-500 mr-2" />;
      case 'crypto':
        return <DollarSign className="h-4 w-4 text-purple-500 mr-2" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-500 mr-2" />;
    }
  };
  
  const handleViewPayment = (payment: any) => {
    setSelectedPayment(payment);
    setIsViewPaymentDialogOpen(true);
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Payments</h1>
              <p className="text-gray-500">Manage and track all payment transactions</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Date Range
              </Button>
              
              <Button variant="outline" className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold">$12,426.50</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Transactions</p>
                    <p className="text-2xl font-bold">{payments.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <CreditCard className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pending</p>
                    <p className="text-2xl font-bold">
                      {payments.filter(p => p.status === 'pending').length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                    <RefreshCcw className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Failed</p>
                    <p className="text-2xl font-bold">
                      {payments.filter(p => p.status === 'failed').length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <X className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>
                View all payment transactions and their details
              </CardDescription>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by user or transaction ID..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <span className="text-sm whitespace-nowrap">Filters:</span>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="stripe">Credit Card</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment: any) => {
                    const user = users.find((user: any) => user.id === payment.userId);
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs">
                          {payment.stripePaymentIntentId || `PAY-${payment.id}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-2">
                              {user?.username.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span>{user?.username || 'Unknown User'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                        </TableCell>
                        <TableCell>
                          {format(new Date(payment.createdAt), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getPaymentMethodIcon(payment.paymentMethod)}
                            <span className="capitalize">{payment.paymentMethod}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewPayment(payment)}
                          >
                            <span className="sr-only">View details</span>
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {filteredPayments.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No payments found matching your filters.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <div className="text-sm text-gray-500">
                Showing {filteredPayments.length} of {payments.length} transactions
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {selectedPayment && (
            <Dialog open={isViewPaymentDialogOpen} onOpenChange={setIsViewPaymentDialogOpen}>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Payment Details</DialogTitle>
                  <DialogDescription>
                    Complete information about this transaction
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500">Status</span>
                      <div>{getStatusBadge(selectedPayment.status)}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Transaction ID</Label>
                        <p className="font-mono text-sm">
                          {selectedPayment.stripePaymentIntentId || `PAY-${selectedPayment.id}`}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Date</Label>
                        <p className="text-sm">
                          {format(new Date(selectedPayment.createdAt), 'PPP p')}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">User ID</Label>
                        <p className="text-sm">{selectedPayment.userId}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Payment Method</Label>
                        <div className="flex items-center text-sm">
                          {getPaymentMethodIcon(selectedPayment.paymentMethod)}
                          <span className="capitalize">{selectedPayment.paymentMethod}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Subtotal</span>
                        <span className="text-sm">
                          ${((selectedPayment.amount - 0) / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm">Processing Fee</span>
                        <span className="text-sm">$0.00</span>
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t font-medium">
                        <span>Total</span>
                        <span>${(selectedPayment.amount / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="history" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 mt-1">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center">
                            <p className="font-medium">Payment initiated</p>
                            <span className="text-xs text-gray-500 ml-2">
                              {format(new Date(selectedPayment.createdAt), 'p')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Payment of ${(selectedPayment.amount / 100).toFixed(2)} was initiated
                          </p>
                        </div>
                      </div>
                      
                      {selectedPayment.status === 'completed' && (
                        <div className="flex items-start">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 mt-1">
                            <DollarSign className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center">
                              <p className="font-medium">Payment completed</p>
                              <span className="text-xs text-gray-500 ml-2">
                                {format(new Date(selectedPayment.createdAt), 'p')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              Payment was successfully processed
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {selectedPayment.status === 'failed' && (
                        <div className="flex items-start">
                          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3 mt-1">
                            <X className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center">
                              <p className="font-medium">Payment failed</p>
                              <span className="text-xs text-gray-500 ml-2">
                                {format(new Date(selectedPayment.createdAt), 'p')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              Payment could not be processed
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setIsViewPaymentDialogOpen(false)}>
                    Close
                  </Button>
                  
                  {selectedPayment.status === 'pending' && (
                    <Button className="bg-green-600 hover:bg-green-700">
                      Mark as Completed
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
