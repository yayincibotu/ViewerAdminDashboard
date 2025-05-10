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
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Download, FileText, Filter, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

// Status colors
const statusColors = {
  draft: 'bg-gray-500',
  issued: 'bg-blue-500',
  paid: 'bg-green-500',
  overdue: 'bg-red-500',
  void: 'bg-gray-700',
};

// Define the Invoice type
interface Invoice {
  id: number;
  userId: number;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  items: string;
  notes: string | null;
  billingDetails: string | null;
  paymentTerms: string | null;
  createdAt: string;
  updatedAt: string;
}

// Define schema for creating/editing invoice
const invoiceFormSchema = z.object({
  userId: z.number().min(1, { message: "User ID is required" }),
  invoiceNumber: z.string().optional(),
  status: z.string(),
  issueDate: z.date(),
  dueDate: z.date(),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  discount: z.number().min(0),
  total: z.number().min(0),
  currency: z.string().default('usd'),
  items: z.string().min(5, { message: "Invoice items are required" }),
  notes: z.string().optional().nullable(),
  billingDetails: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
});

// Define schema for items
const invoiceItemSchema = z.object({
  description: z.string().min(1, { message: "Description is required" }),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  amount: z.number().min(0),
});

type InvoiceItemType = z.infer<typeof invoiceItemSchema>;

const AdminInvoices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemType[]>([]);

  const { toast } = useToast();

  // Set up form for creating/editing invoice
  const invoiceForm = useForm<z.infer<typeof invoiceFormSchema>>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      userId: 0,
      status: 'draft',
      issueDate: new Date(),
      dueDate: new Date(),
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      currency: 'usd',
      items: '[]',
      notes: '',
      billingDetails: '',
      paymentTerms: 'Net 30',
    }
  });

  // Query invoices data
  const { data: invoices, isLoading, refetch } = useQuery<Invoice[]>({
    queryKey: ['/api/admin/invoices'],
    queryFn: async () => {
      // Construct the query parameters based on filters
      let url = '/api/admin/invoices';
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

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof invoiceFormSchema>) => {
      const res = await apiRequest('POST', '/api/admin/invoices', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Invoice created",
        description: "The invoice has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      invoiceForm.reset();
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create invoice",
        description: error.message || "An error occurred while creating the invoice.",
        variant: "destructive",
      });
    }
  });

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: { id: number; invoice: Partial<z.infer<typeof invoiceFormSchema>> }) => {
      const res = await apiRequest('PUT', `/api/admin/invoices/${data.id}`, data.invoice);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Invoice updated",
        description: "The invoice has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update invoice",
        description: error.message || "An error occurred while updating the invoice.",
        variant: "destructive",
      });
    }
  });

  // Update invoice status mutation
  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async (data: { id: number; status: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/invoices/${data.id}/status`, { status: data.status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "The invoice status has been updated successfully.",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update status",
        description: error.message || "An error occurred while updating the invoice status.",
        variant: "destructive",
      });
    }
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/invoices/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete invoice",
        description: error.message || "An error occurred while deleting the invoice.",
        variant: "destructive",
      });
    }
  });

  // Handle invoice form submission for create
  const onCreateInvoiceSubmit = (values: z.infer<typeof invoiceFormSchema>) => {
    // Ensure items are serialized properly
    values.items = JSON.stringify(invoiceItems);
    
    // Calculate totals
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
    values.subtotal = subtotal;
    values.total = subtotal + values.tax - values.discount;
    
    createInvoiceMutation.mutate(values);
  };

  // Handle invoice form submission for edit
  const onEditInvoiceSubmit = (values: z.infer<typeof invoiceFormSchema>) => {
    if (!editingInvoice) return;
    
    // Ensure items are serialized properly
    values.items = JSON.stringify(invoiceItems);
    
    // Calculate totals
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
    values.subtotal = subtotal;
    values.total = subtotal + values.tax - values.discount;
    
    updateInvoiceMutation.mutate({ 
      id: editingInvoice.id, 
      invoice: values 
    });
  };

  // Handle invoice delete
  const onDeleteInvoice = () => {
    if (!editingInvoice) return;
    deleteInvoiceMutation.mutate(editingInvoice.id);
  };

  // Handle opening the edit dialog
  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    
    // Parse the items JSON
    let parsedItems: InvoiceItemType[] = [];
    try {
      parsedItems = JSON.parse(invoice.items);
    } catch (e) {
      console.error("Failed to parse invoice items:", e);
    }
    setInvoiceItems(parsedItems);
    
    // Set form values
    invoiceForm.reset({
      userId: invoice.userId,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issueDate: new Date(invoice.issueDate),
      dueDate: new Date(invoice.dueDate),
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      discount: invoice.discount,
      total: invoice.total,
      currency: invoice.currency,
      items: invoice.items,
      notes: invoice.notes,
      billingDetails: invoice.billingDetails,
      paymentTerms: invoice.paymentTerms,
    });
    
    setIsEditDialogOpen(true);
  };

  // Handle opening the delete dialog
  const handleDeleteDialog = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsDeleteDialogOpen(true);
  };

  // Filter invoices based on search term
  const filteredInvoices = invoices?.filter(invoice => {
    // Filter by search term
    return !searchTerm || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.userId.toString().includes(searchTerm) ||
      (invoice.notes && invoice.notes.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  // Add new item to invoice items list
  const addInvoiceItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { description: '', quantity: 1, unitPrice: 0, amount: 0 }
    ]);
  };

  // Update invoice item
  const updateInvoiceItem = (index: number, field: keyof InvoiceItemType, value: any) => {
    const newItems = [...invoiceItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    
    // If quantity or unitPrice changed, recalculate amount
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setInvoiceItems(newItems);
  };

  // Remove invoice item
  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Calculate invoice totals
  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = invoiceForm.watch('tax') || 0;
    const discount = invoiceForm.watch('discount') || 0;
    const total = subtotal + tax - discount;
    
    return { subtotal, tax, discount, total };
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Invoice Management</CardTitle>
              <CardDescription>Create and manage customer invoices</CardDescription>
            </div>
            <Button onClick={() => {
              setInvoiceItems([]);
              invoiceForm.reset();
              setIsCreateDialogOpen(true);
            }} className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </CardHeader>
          
          <CardContent>
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex items-center relative w-full sm:w-96">
                <Search className="absolute left-2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search by invoice number or customer..." 
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="void">Void</SelectItem>
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
                      selected={dateRange}
                      onSelect={setDateRange}
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
            
            {/* Invoices Table */}
            {isLoading ? (
              <div className="py-10 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-2 text-gray-500">Loading invoices...</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No invoices found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices?.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell>{invoice.userId}</TableCell>
                          <TableCell>
                            {format(new Date(invoice.issueDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(invoice.total, invoice.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[invoice.status as keyof typeof statusColors] || 'bg-gray-500'} text-white`}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {/* Actions dropdown or buttons */}
                              <Button variant="outline" size="sm" onClick={() => handleEditInvoice(invoice)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              
                              <Button variant="outline" size="sm" onClick={() => {
                                // Download invoice
                                // TODO: Implement invoice PDF download
                                toast({
                                  title: "Download started",
                                  description: "Your invoice is being prepared for download."
                                });
                              }}>
                                <Download className="h-4 w-4" />
                              </Button>
                              
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteDialog(invoice)}>
                                <Trash2 className="h-4 w-4" />
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
              {filteredInvoices?.length} invoices found
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Create Invoice Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice for a customer by filling out the form below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...invoiceForm}>
            <form onSubmit={invoiceForm.handleSubmit(onCreateInvoiceSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <FormField
                    control={invoiceForm.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer ID</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter customer ID" {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={invoiceForm.control}
                    name="billingDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter customer billing details"
                            className="min-h-[120px]" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormDescription>
                          Include customer's name, address and contact information
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Invoice Information */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={invoiceForm.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Issue Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={invoiceForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={invoiceForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select invoice status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="issued">Issued</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="void">Void</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={invoiceForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="usd">USD - US Dollar</SelectItem>
                            <SelectItem value="eur">EUR - Euro</SelectItem>
                            <SelectItem value="gbp">GBP - British Pound</SelectItem>
                            <SelectItem value="try">TRY - Turkish Lira</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={invoiceForm.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Net 30" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Invoice Items */}
              <div className="space-y-4 border p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Invoice Items</h3>
                  <Button type="button" onClick={addInvoiceItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>
                
                {invoiceItems.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No items added yet. Click the button above to add an item.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Item Headers */}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5 font-medium">Description</div>
                      <div className="col-span-2 font-medium">Quantity</div>
                      <div className="col-span-2 font-medium">Unit Price</div>
                      <div className="col-span-2 font-medium">Amount</div>
                      <div className="col-span-1"></div>
                    </div>
                    
                    {/* Item Rows */}
                    {invoiceItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <Input 
                            placeholder="Item description" 
                            value={item.description} 
                            onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)} 
                          />
                        </div>
                        <div className="col-span-2">
                          <Input 
                            type="number" 
                            min="1"
                            value={item.quantity} 
                            onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 0)} 
                          />
                        </div>
                        <div className="col-span-2">
                          <Input 
                            type="number" 
                            min="0"
                            step="0.01"
                            value={item.unitPrice} 
                            onChange={(e) => updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} 
                          />
                        </div>
                        <div className="col-span-2 font-medium">
                          {formatCurrency(item.amount, invoiceForm.getValues('currency'))}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeInvoiceItem(index)}
                            className="h-8 w-8 p-0 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Totals */}
                    <Separator />
                    <div className="grid grid-cols-12 gap-2 pt-2">
                      <div className="col-span-9 text-right font-medium">Subtotal:</div>
                      <div className="col-span-3 font-medium">
                        {formatCurrency(calculateTotals().subtotal, invoiceForm.getValues('currency'))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-7 text-right font-medium">Tax:</div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...invoiceForm.register('tax', { valueAsNumber: true })}
                        />
                      </div>
                      <div className="col-span-3 font-medium">
                        {formatCurrency(invoiceForm.watch('tax') || 0, invoiceForm.getValues('currency'))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-7 text-right font-medium">Discount:</div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0" 
                          step="0.01"
                          {...invoiceForm.register('discount', { valueAsNumber: true })}
                        />
                      </div>
                      <div className="col-span-3 font-medium text-red-500">
                        -{formatCurrency(invoiceForm.watch('discount') || 0, invoiceForm.getValues('currency'))}
                      </div>
                    </div>
                    
                    <Separator />
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-9 text-right font-medium text-lg">Total:</div>
                      <div className="col-span-3 font-bold text-lg">
                        {formatCurrency(calculateTotals().total, invoiceForm.getValues('currency'))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Notes */}
              <FormField
                control={invoiceForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any notes or additional information for this invoice"
                        className="min-h-[100px]" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createInvoiceMutation.isPending || invoiceItems.length === 0}
                >
                  {createInvoiceMutation.isPending ? 
                    "Creating..." : 
                    invoiceItems.length === 0 ? "Add at least one item" : "Create Invoice"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Invoice Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>
              Edit invoice {editingInvoice?.invoiceNumber || ''}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...invoiceForm}>
            <form onSubmit={invoiceForm.handleSubmit(onEditInvoiceSubmit)} className="space-y-6">
              {/* Same form fields as in the create dialog */}
              {/* ... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <FormField
                    control={invoiceForm.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer ID</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter customer ID" {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={invoiceForm.control}
                    name="billingDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter customer billing details"
                            className="min-h-[120px]" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormDescription>
                          Include customer's name, address and contact information
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Invoice Information */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={invoiceForm.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Issue Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={invoiceForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={invoiceForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select invoice status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="issued">Issued</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="void">Void</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={invoiceForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="usd">USD - US Dollar</SelectItem>
                            <SelectItem value="eur">EUR - Euro</SelectItem>
                            <SelectItem value="gbp">GBP - British Pound</SelectItem>
                            <SelectItem value="try">TRY - Turkish Lira</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={invoiceForm.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Net 30" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Invoice Items */}
              <div className="space-y-4 border p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Invoice Items</h3>
                  <Button type="button" onClick={addInvoiceItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>
                
                {invoiceItems.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No items added yet. Click the button above to add an item.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Item Headers */}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5 font-medium">Description</div>
                      <div className="col-span-2 font-medium">Quantity</div>
                      <div className="col-span-2 font-medium">Unit Price</div>
                      <div className="col-span-2 font-medium">Amount</div>
                      <div className="col-span-1"></div>
                    </div>
                    
                    {/* Item Rows */}
                    {invoiceItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <Input 
                            placeholder="Item description" 
                            value={item.description} 
                            onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)} 
                          />
                        </div>
                        <div className="col-span-2">
                          <Input 
                            type="number" 
                            min="1"
                            value={item.quantity} 
                            onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 0)} 
                          />
                        </div>
                        <div className="col-span-2">
                          <Input 
                            type="number" 
                            min="0"
                            step="0.01"
                            value={item.unitPrice} 
                            onChange={(e) => updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} 
                          />
                        </div>
                        <div className="col-span-2 font-medium">
                          {formatCurrency(item.amount, invoiceForm.getValues('currency'))}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeInvoiceItem(index)}
                            className="h-8 w-8 p-0 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Totals */}
                    <Separator />
                    <div className="grid grid-cols-12 gap-2 pt-2">
                      <div className="col-span-9 text-right font-medium">Subtotal:</div>
                      <div className="col-span-3 font-medium">
                        {formatCurrency(calculateTotals().subtotal, invoiceForm.getValues('currency'))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-7 text-right font-medium">Tax:</div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...invoiceForm.register('tax', { valueAsNumber: true })}
                        />
                      </div>
                      <div className="col-span-3 font-medium">
                        {formatCurrency(invoiceForm.watch('tax') || 0, invoiceForm.getValues('currency'))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-7 text-right font-medium">Discount:</div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0" 
                          step="0.01"
                          {...invoiceForm.register('discount', { valueAsNumber: true })}
                        />
                      </div>
                      <div className="col-span-3 font-medium text-red-500">
                        -{formatCurrency(invoiceForm.watch('discount') || 0, invoiceForm.getValues('currency'))}
                      </div>
                    </div>
                    
                    <Separator />
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-9 text-right font-medium text-lg">Total:</div>
                      <div className="col-span-3 font-bold text-lg">
                        {formatCurrency(calculateTotals().total, invoiceForm.getValues('currency'))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Notes */}
              <FormField
                control={invoiceForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any notes or additional information for this invoice"
                        className="min-h-[100px]" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateInvoiceMutation.isPending || invoiceItems.length === 0}
                >
                  {updateInvoiceMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice {editingInvoice?.invoiceNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={onDeleteInvoice}
              disabled={deleteInvoiceMutation.isPending}
            >
              {deleteInvoiceMutation.isPending ? "Deleting..." : "Delete Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvoices;