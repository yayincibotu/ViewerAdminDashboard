import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AdminLayout from '@/components/dashboard/AdminLayout';
import AdminHeader from '@/components/dashboard/AdminHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Filter, Plus, Edit, Trash2, BookOpen, Tag, CheckCircle2, X, Box, Package, Loader2, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Schema for creating/editing subscription plan
const planFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  viewerCount: z.coerce.number().min(0, "Viewer count must be a positive number"),
  chatCount: z.coerce.number().min(0, "Chat count must be a positive number"),
  followerCount: z.coerce.number().min(0, "Follower count must be a positive number"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  stripePriceId: z.string().optional(),
  platform: z.string(),
  isPopular: z.boolean().default(false),
  geographicTargeting: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  features: z.array(z.string()).min(1, "At least one feature is required")
});

type PlanFormValues = z.infer<typeof planFormSchema>;

interface Plan {
  id: number;
  name: string;
  price: number;
  platform: string;
  description: string;
  viewerCount: number;
  chatCount: number;
  followerCount: number;
  features: string[];
  isPopular: boolean;
  geographicTargeting: boolean;
  stripePriceId?: string;
  stripeProductId?: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Platform {
  id: number;
  name: string;
  slug: string;
  description: string;
  iconClass: string;
  bgColor: string;
}

const AdminServices: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = useState<boolean>(false);
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [features, setFeatures] = useState<string[]>([
    "Up to X Live Viewers",
    "Realistic Chatters",
    "Up to X Chat List",
    "Chat Package",
    "Realistic View", 
    "Unlimited Usage", 
    "Free Support: 24/7", 
    "X Twitch Follower"
  ]);
  const [newFeature, setNewFeature] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<string>('plans');
  const { toast } = useToast();
  
  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const response = await fetch('/api/subscription-plans');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }
      return response.json();
    }
  });
  
  // Fetch platforms
  const { data: platforms = [], isLoading: platformsLoading } = useQuery<Platform[]>({
    queryKey: ['/api/platforms'],
    queryFn: async () => {
      const response = await fetch('/api/platforms');
      if (!response.ok) {
        throw new Error('Failed to fetch platforms');
      }
      return response.json();
    }
  });
  
  // Set up form for subscription plan
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      viewerCount: 0,
      chatCount: 0,
      followerCount: 0,
      description: "",
      stripePriceId: "",
      platform: "twitch",
      isPopular: false,
      geographicTargeting: false,
      isVisible: true,
      features: []
    }
  });
  
  // Create subscription plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: PlanFormValues) => {
      const res = await apiRequest("POST", "/api/admin/subscription-plans", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan created",
        description: "Subscription plan has been created successfully."
      });
      setIsAddPlanDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating plan",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update subscription plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (data: PlanFormValues & { id: number }) => {
      const { id, ...planData } = data;
      const res = await apiRequest("PUT", `/api/admin/subscription-plans/${id}`, planData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan updated",
        description: "Subscription plan has been updated successfully."
      });
      setIsEditPlanDialogOpen(false);
      setSelectedPlan(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating plan",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Delete subscription plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        const res = await apiRequest("DELETE", `/api/admin/subscription-plans/${id}`);
        
        // For 204 No Content response (success case)
        if (res.status === 204) {
          return { success: true };
        }
        
        // Clone the response before reading the body
        // This prevents the "body stream already read" error
        const clonedResponse = res.clone();
        
        // Try to parse the JSON response
        let data;
        try {
          data = await res.json();
        } catch (e) {
          // If JSON parsing fails, return a generic error based on status code
          if (res.status === 409) {
            throw new Error("Cannot delete this plan because it has active subscribers");
          } else {
            throw new Error(`Server error: ${res.status}`);
          }
        }
        
        // If server returns 409 Conflict (plan has active subscriptions)
        if (res.status === 409) {
          throw new Error(data.message || "Cannot delete this plan because it has active subscribers");
        }
        
        // For other error responses
        throw new Error(data.message || "An error occurred while deleting the plan");
      } catch (error: any) {
        // Catch and rethrow to ensure consistent error format
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error("An unexpected error occurred");
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Plan deleted",
        description: "Subscription plan has been deleted successfully."
      });
      setIsDeleteDialogOpen(false);
      setSelectedPlan(null);
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
    },
    onError: (error: Error) => {
      setIsDeleteDialogOpen(false); // Close the dialog even on error
      toast({
        title: "Error deleting plan",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Filter plans based on search query and platform filter
  const filteredPlans = plans.filter((plan: Plan) => {
    const matchesSearch = searchQuery
      ? plan.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        plan.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
      
    const matchesPlatform = platformFilter === 'all' || plan.platform === platformFilter;
    
    return matchesSearch && matchesPlatform;
  });
  
  // Add a feature to the list
  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };
  
  // Remove a feature from the list
  const removeFeature = (feature: string) => {
    setFeatures(features.filter(f => f !== feature));
  };
  
  // Submit plan form
  const onSubmit: SubmitHandler<PlanFormValues> = (data) => {
    if (selectedPlan) {
      updatePlanMutation.mutate({ ...data, id: selectedPlan.id });
    } else {
      createPlanMutation.mutate(data);
    }
  };
  
  // Handle edit plan button click
  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    // Update features state with the plan features
    if (plan.features && Array.isArray(plan.features)) {
      setFeatures(plan.features);
    }
    
    // Explicitly cast numeric fields to numbers for the form
    form.reset({
      name: plan.name,
      price: Number(plan.price),
      platform: plan.platform,
      description: plan.description,
      viewerCount: Number(plan.viewerCount),
      chatCount: Number(plan.chatCount),
      followerCount: Number(plan.followerCount),
      isPopular: Boolean(plan.isPopular),
      geographicTargeting: Boolean(plan.geographicTargeting),
      isVisible: Boolean(plan.isVisible),
      features: Array.isArray(plan.features) ? plan.features : []
    });
    setIsEditPlanDialogOpen(true);
  };
  
  // Handle delete plan button click
  const handleDeletePlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete plan
  const confirmDeletePlan = () => {
    if (selectedPlan) {
      deletePlanMutation.mutate(selectedPlan.id);
    }
  };

  // Check if loading
  if (plansLoading || platformsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <AdminHeader
        title="Services & Plans"
        description="Manage subscription plans and available services"
        actions={
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            
            <Dialog open={isAddPlanDialogOpen} onOpenChange={setIsAddPlanDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create New Subscription Plan</DialogTitle>
                  <DialogDescription>
                    Add a new subscription plan to your platform.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plan Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 100 Live Viewers" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (USD)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="e.g. 75" {...field} />
                            </FormControl>
                            <FormDescription>Monthly price in USD</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="viewerCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Viewer Count</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="e.g. 100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="chatCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chat Count</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="e.g. 100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="followerCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Follower Count</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="e.g. 250" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="platform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Platform</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {platforms.map((platform) => (
                                  <SelectItem key={platform.slug} value={platform.slug}>
                                    {platform.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="stripePriceId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stripe Price ID</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. price_1234567890" {...field} />
                            </FormControl>
                            <FormDescription>Optional Stripe price ID</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe the subscription plan"
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="isPopular"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                            <div className="space-y-0.5">
                              <FormLabel>Mark as Popular</FormLabel>
                              <FormDescription>
                                Highlight this plan as a popular choice
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="geographicTargeting"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                            <div className="space-y-0.5">
                              <FormLabel>Geographic Targeting</FormLabel>
                              <FormDescription>
                                Allow users to target specific geographic regions
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name="features"
                          render={() => (
                            <FormItem>
                              <FormLabel>Features</FormLabel>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="Add a feature"
                                    value={newFeature}
                                    onChange={(e) => setNewFeature(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addFeature();
                                      }
                                    }}
                                  />
                                  <Button type="button" onClick={addFeature}>Add</Button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <FormField
                                        control={form.control}
                                        name="features"
                                        render={({ field }) => (
                                          <FormItem className="flex items-center space-x-2 w-full">
                                            <FormControl>
                                              <div className="flex items-center justify-between border rounded-md p-2 w-full">
                                                <span>{feature}</span>
                                                <div className="flex items-center">
                                                  <input
                                                    type="checkbox"
                                                    className="mr-2"
                                                    checked={field.value.includes(feature)}
                                                    onChange={(e) => {
                                                      if (e.target.checked) {
                                                        field.onChange([...field.value, feature]);
                                                      } else {
                                                        field.onChange(field.value.filter(f => f !== feature));
                                                      }
                                                    }}
                                                  />
                                                  <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => setFeatures(features.filter((_, i) => i !== index))}
                                                  >
                                                    <X className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddPlanDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createPlanMutation.isPending}>
                        {createPlanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Plan
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      
      <div className="px-4 md:px-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <Tabs value={currentTab} onValueChange={setCurrentTab}>
                  <TabsList>
                    <TabsTrigger value="plans">
                      <Package className="mr-2 h-4 w-4" />
                      Subscription Plans
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="flex items-center gap-2 max-w-md w-full">
                <Input
                  placeholder="Search plans..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
                
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="max-w-[180px]">
                    <SelectValue placeholder="All Platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.slug} value={platform.slug}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="plans">
              <TabsContent value="plans" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Viewers</TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground mb-2" />
                            <h3 className="text-lg font-medium">No plans found</h3>
                            <p className="text-sm text-muted-foreground">
                              {searchQuery || platformFilter !== 'all'
                                ? "Try adjusting your search or filter criteria"
                                : "Add a new subscription plan to get started"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPlans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {plan.name}
                              {plan.isPopular && (
                                <Badge variant="secondary">Popular</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {platforms.find(p => p.slug === plan.platform)?.name || plan.platform}
                          </TableCell>
                          <TableCell>${plan.price}/mo</TableCell>
                          <TableCell>{plan.viewerCount}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {plan.features.slice(0, 2).map((feature, idx) => (
                                <Badge key={idx} variant="outline" className="whitespace-nowrap">
                                  {feature}
                                </Badge>
                              ))}
                              {plan.features.length > 2 && (
                                <Badge variant="outline">+{plan.features.length - 2} more</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={plan.isVisible ? "default" : "secondary"} className={plan.isVisible ? "bg-green-500 hover:bg-green-600" : ""}>
                              {plan.isVisible ? "Visible" : "Hidden"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditPlan(plan)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeletePlan(plan)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Plan Dialog */}
      <Dialog open={isEditPlanDialogOpen} onOpenChange={setIsEditPlanDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>
              Make changes to the subscription plan. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter plan name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="29.99" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {platforms.map((platform) => (
                            <SelectItem key={platform.slug} value={platform.slug}>
                              {platform.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter plan description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="viewerCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Viewers</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="100" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="chatCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chat Count</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="followerCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Followers</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="200" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="isPopular"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0 space-x-2">
                      <FormLabel>Popular Plan</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="geographicTargeting"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0 space-x-2">
                      <FormLabel>Geo Targeting</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isVisible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0 space-x-2">
                      <FormLabel>Visible</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Features</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a feature"
                  />
                  <Button type="button" onClick={addFeature} variant="outline">
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {features.map((feature, i) => (
                    <Badge key={i} variant="outline" className="flex items-center gap-1">
                      {feature}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => removeFeature(feature)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setIsEditPlanDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePlanMutation.isPending}>
                  {updatePlanMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the 
              subscription plan and remove all associated data.
            </AlertDialogDescription>
            <div className="mt-3">
              <div className="font-medium text-amber-600">
                Note: Plans with active subscribers cannot be deleted. You must
                either migrate subscribers to a different plan or cancel their 
                subscriptions first.
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletePlan}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletePlanMutation.isPending}
            >
              {deletePlanMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminServices;