import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AdminSidebar from '@/components/dashboard/AdminSidebar';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Filter, Plus, Edit, Trash2, CheckCircle2, X, Package, AlertTriangle, Sparkles, Tag, Calendar, Users } from 'lucide-react';
import { SubscriptionPlan } from '@shared/schema';

// Schema for creating/editing subscription plan
const planFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  price: z.coerce.number().int().min(0),
  annualPrice: z.coerce.number().int().min(0).optional(),
  billingCycle: z.enum(["monthly", "annual", "both"]).default("monthly"),
  viewerCount: z.coerce.number().int().min(0),
  chatCount: z.coerce.number().int().min(0),
  followerCount: z.coerce.number().int().min(0),
  stripePriceId: z.string().optional(),
  stripeAnnualPriceId: z.string().optional(),
  stripeProductId: z.string().optional(),
  platform: z.string(),
  isPopular: z.boolean().default(false),
  geographicTargeting: z.boolean().default(false),
  prioritySupport: z.boolean().default(false),
  analyticsAccess: z.boolean().default(false),
  promoCode: z.string().optional(),
  discountPercentage: z.coerce.number().int().min(0).max(100).optional(),
  isVisible: z.boolean().default(true),
  isComingSoon: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
  features: z.array(z.string()).min(1, "At least one feature is required")
});

type PlanFormValues = z.infer<typeof planFormSchema>;

const AdminPlans: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = useState<boolean>(false);
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState<boolean>(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [features, setFeatures] = useState<string[]>([
    "Up to X Live Viewers",
    "Realistic Chatters",
    "X Chat Users in List",
    "Chat Package",
    "Realistic View Count", 
    "Unlimited Usage", 
    "Priority Support", 
    "X Followers",
    "Geographic Targeting",
    "Analytics Dashboard"
  ]);
  const [newFeature, setNewFeature] = useState<string>('');
  const { toast } = useToast();
  
  // Fetch subscription plans
  const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ['/api/subscription-plans'],
  });
  
  // Fetch platforms
  const { data: platforms = [] } = useQuery({
    queryKey: ['/api/platforms'],
  });
  
  // Set up form for subscription plan
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      annualPrice: undefined,
      billingCycle: "monthly",
      viewerCount: 0,
      chatCount: 0,
      followerCount: 0,
      stripePriceId: "",
      stripeAnnualPriceId: "",
      stripeProductId: "",
      platform: "twitch",
      isPopular: false,
      geographicTargeting: false,
      prioritySupport: false,
      analyticsAccess: false,
      promoCode: "",
      discountPercentage: undefined,
      isVisible: true,
      isComingSoon: false,
      sortOrder: 0,
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

  // Toggle plan visibility mutation
  const togglePlanVisibilityMutation = useMutation({
    mutationFn: async ({ id, isVisible }: { id: number, isVisible: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/subscription-plans/${id}/visibility`, { isVisible });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Visibility updated",
        description: "Plan visibility has been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating visibility",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Filter plans based on search query and platform filter
  const filteredPlans = Array.isArray(plans) ? plans.filter((plan: any) => {
    const matchesSearch = searchQuery
      ? plan.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (plan.description && plan.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
      
    const matchesPlatform = platformFilter === 'all' || plan.platform === platformFilter;
    
    return matchesSearch && matchesPlatform;
  }) : [];
  
  // Add a feature to the list
  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };
  
  // Submit plan form for creation
  const onSubmit = (data: PlanFormValues) => {
    createPlanMutation.mutate(data);
  };

  // Submit plan form for update
  const onUpdateSubmit = (data: PlanFormValues) => {
    if (currentPlan) {
      updatePlanMutation.mutate({ ...data, id: currentPlan.id });
    }
  };

  // Open edit dialog with current plan data
  const handleEditPlan = (plan: any) => {
    setCurrentPlan(plan);
    
    // Clear previous form data
    form.reset();
    
    // Set form values from plan data
    form.setValue("name", plan.name || "");
    form.setValue("description", plan.description || "");
    form.setValue("price", Number(plan.price) || 0);
    form.setValue("annualPrice", plan.annualPrice ? Number(plan.annualPrice) : undefined);
    form.setValue("billingCycle", plan.billingCycle || "monthly");
    form.setValue("viewerCount", Number(plan.viewerCount) || 0);
    form.setValue("chatCount", Number(plan.chatCount) || 0);
    form.setValue("followerCount", Number(plan.followerCount) || 0);
    form.setValue("stripePriceId", plan.stripePriceId || "");
    form.setValue("stripeAnnualPriceId", plan.stripeAnnualPriceId || "");
    form.setValue("stripeProductId", plan.stripeProductId || "");
    form.setValue("platform", plan.platform || "twitch");
    form.setValue("isPopular", Boolean(plan.isPopular));
    form.setValue("geographicTargeting", Boolean(plan.geographicTargeting));
    form.setValue("prioritySupport", Boolean(plan.prioritySupport));
    form.setValue("analyticsAccess", Boolean(plan.analyticsAccess));
    form.setValue("promoCode", plan.promoCode || "");
    form.setValue("discountPercentage", plan.discountPercentage ? Number(plan.discountPercentage) : undefined);
    form.setValue("isVisible", plan.isVisible !== undefined ? Boolean(plan.isVisible) : true);
    form.setValue("isComingSoon", Boolean(plan.isComingSoon));
    form.setValue("sortOrder", Number(plan.sortOrder || 0));
    form.setValue("features", plan.features || []);
    
    setIsEditPlanDialogOpen(true);
  };

  // Toggle plan visibility
  const togglePlanVisibility = (id: number, currentVisibility: boolean) => {
    togglePlanVisibilityMutation.mutate({
      id,
      isVisible: !currentVisibility
    });
  };

  // Format price display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price / 100);
  };

  // Convert platform to badge color
  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'twitch':
        return 'bg-purple-100 text-purple-800';
      case 'kick':
        return 'bg-green-100 text-green-800';
      case 'youtube':
        return 'bg-red-100 text-red-800';
      case 'instagram':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Subscription Plans</h1>
              <p className="text-gray-500">Manage subscription plans, pricing, and features</p>
            </div>
            
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Subscription Plan</DialogTitle>
                    <DialogDescription>
                      Add a new subscription plan to your platform.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="mb-4">
                          <TabsTrigger value="basic">Basic Info</TabsTrigger>
                          <TabsTrigger value="pricing">Pricing & Billing</TabsTrigger>
                          <TabsTrigger value="features">Features</TabsTrigger>
                          <TabsTrigger value="advanced">Advanced</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="basic" className="space-y-6">
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
                                      <SelectItem value="twitch">Twitch</SelectItem>
                                      <SelectItem value="kick">Kick</SelectItem>
                                      <SelectItem value="youtube">YouTube</SelectItem>
                                      <SelectItem value="instagram">Instagram</SelectItem>
                                    </SelectContent>
                                  </Select>
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
                              name="viewerCount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Viewer Count</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" placeholder="e.g. 100" {...field} />
                                  </FormControl>
                                  <FormDescription>Maximum number of viewers</FormDescription>
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
                                  <FormDescription>Maximum number of chat users</FormDescription>
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
                                  <FormDescription>Followers included in the plan</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="sortOrder"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sort Order</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" placeholder="e.g. 10" {...field} />
                                  </FormControl>
                                  <FormDescription>Order to display on frontend (lower first)</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="pricing" className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="price"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Monthly Price (USD cents)</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" placeholder="e.g. 7999 for $79.99" {...field} />
                                  </FormControl>
                                  <FormDescription>Enter price in cents (e.g. 7999 for $79.99)</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="annualPrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Annual Price (USD cents)</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" placeholder="e.g. 79999 for $799.99" {...field} />
                                  </FormControl>
                                  <FormDescription>Optional annual price in cents (leave blank for monthly only)</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="billingCycle"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Available Billing Cycles</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select billing options" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="monthly">Monthly Only</SelectItem>
                                      <SelectItem value="annual">Annual Only</SelectItem>
                                      <SelectItem value="both">Both Options</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>Which billing cycles to offer customers</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
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
                              name="promoCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Promotion Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. SUMMER25" {...field} />
                                  </FormControl>
                                  <FormDescription>Optional promo code</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="discountPercentage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Discount Percentage</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" max="100" placeholder="e.g. 25" {...field} />
                                  </FormControl>
                                  <FormDescription>Discount for promo code (0-100)</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="features" className="space-y-6">
                          <div className="grid grid-cols-1 gap-6">
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
                            
                            <FormField
                              control={form.control}
                              name="prioritySupport"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                                  <div className="space-y-0.5">
                                    <FormLabel>Priority Support</FormLabel>
                                    <FormDescription>
                                      Offer priority customer support
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
                              name="analyticsAccess"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                                  <div className="space-y-0.5">
                                    <FormLabel>Analytics Access</FormLabel>
                                    <FormDescription>
                                      Provide access to analytics dashboard
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
                              name="features"
                              render={() => (
                                <FormItem>
                                  <FormLabel>Features List</FormLabel>
                                  <FormDescription>These features will be displayed on the plan card</FormDescription>
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Input
                                        placeholder="Add a feature"
                                        value={newFeature}
                                        onChange={(e) => setNewFeature(e.target.value)}
                                      />
                                      <Button type="button" onClick={addFeature}>Add</Button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {features.map((feature, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id={`feature-${index}`}
                                            checked={form.getValues("features").includes(feature)}
                                            onChange={(e) => {
                                              const currentFeatures = form.getValues("features");
                                              if (e.target.checked) {
                                                form.setValue("features", [...currentFeatures, feature]);
                                              } else {
                                                form.setValue("features", currentFeatures.filter(f => f !== feature));
                                              }
                                            }}
                                            className="mr-1"
                                          />
                                          <label htmlFor={`feature-${index}`} className="text-sm">
                                            {feature}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="advanced" className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="stripePriceId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Stripe Price ID (Monthly)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. price_1234567890" {...field} />
                                  </FormControl>
                                  <FormDescription>Stripe price ID for monthly billing</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="stripeAnnualPriceId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Stripe Price ID (Annual)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. price_1234567890" {...field} />
                                  </FormControl>
                                  <FormDescription>Stripe price ID for annual billing</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="stripeProductId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Stripe Product ID</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. prod_1234567890" {...field} />
                                  </FormControl>
                                  <FormDescription>Stripe product ID</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="isVisible"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                                  <div className="space-y-0.5">
                                    <FormLabel>Visible to Customers</FormLabel>
                                    <FormDescription>
                                      Show this plan on the pricing page
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
                              name="isComingSoon"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                                  <div className="space-y-0.5">
                                    <FormLabel>Coming Soon</FormLabel>
                                    <FormDescription>
                                      Mark this plan as "Coming Soon"
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
                          </div>
                        </TabsContent>
                      </Tabs>
                      
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddPlanDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createPlanMutation.isPending}>
                          {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* Edit Plan Dialog */}
              <Dialog open={isEditPlanDialogOpen} onOpenChange={setIsEditPlanDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Subscription Plan</DialogTitle>
                    <DialogDescription>
                      Update subscription plan details.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onUpdateSubmit)} className="space-y-6">
                      <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="mb-4">
                          <TabsTrigger value="basic">Basic Info</TabsTrigger>
                          <TabsTrigger value="pricing">Pricing & Billing</TabsTrigger>
                          <TabsTrigger value="features">Features</TabsTrigger>
                          <TabsTrigger value="advanced">Advanced</TabsTrigger>
                        </TabsList>
                        
                        {/* Same tab content as Add Plan dialog */}
                        <TabsContent value="basic" className="space-y-6">
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
                                      <SelectItem value="twitch">Twitch</SelectItem>
                                      <SelectItem value="kick">Kick</SelectItem>
                                      <SelectItem value="youtube">YouTube</SelectItem>
                                      <SelectItem value="instagram">Instagram</SelectItem>
                                    </SelectContent>
                                  </Select>
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
                              name="viewerCount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Viewer Count</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" placeholder="e.g. 100" {...field} />
                                  </FormControl>
                                  <FormDescription>Maximum number of viewers</FormDescription>
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
                                  <FormDescription>Maximum number of chat users</FormDescription>
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
                                  <FormDescription>Followers included in the plan</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="sortOrder"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sort Order</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" placeholder="e.g. 10" {...field} />
                                  </FormControl>
                                  <FormDescription>Order to display on frontend (lower first)</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="pricing" className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="price"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Monthly Price (USD cents)</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" placeholder="e.g. 7999 for $79.99" {...field} />
                                  </FormControl>
                                  <FormDescription>Enter price in cents (e.g. 7999 for $79.99)</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="annualPrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Annual Price (USD cents)</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" placeholder="e.g. 79999 for $799.99" {...field} />
                                  </FormControl>
                                  <FormDescription>Optional annual price in cents (leave blank for monthly only)</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="billingCycle"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Available Billing Cycles</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select billing options" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="monthly">Monthly Only</SelectItem>
                                      <SelectItem value="annual">Annual Only</SelectItem>
                                      <SelectItem value="both">Both Options</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>Which billing cycles to offer customers</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
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
                              name="promoCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Promotion Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. SUMMER25" {...field} />
                                  </FormControl>
                                  <FormDescription>Optional promo code</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="discountPercentage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Discount Percentage</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" max="100" placeholder="e.g. 25" {...field} />
                                  </FormControl>
                                  <FormDescription>Discount for promo code (0-100)</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="features" className="space-y-6">
                          <div className="grid grid-cols-1 gap-6">
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
                            
                            <FormField
                              control={form.control}
                              name="prioritySupport"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                                  <div className="space-y-0.5">
                                    <FormLabel>Priority Support</FormLabel>
                                    <FormDescription>
                                      Offer priority customer support
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
                              name="analyticsAccess"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                                  <div className="space-y-0.5">
                                    <FormLabel>Analytics Access</FormLabel>
                                    <FormDescription>
                                      Provide access to analytics dashboard
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
                              name="features"
                              render={() => (
                                <FormItem>
                                  <FormLabel>Features List</FormLabel>
                                  <FormDescription>These features will be displayed on the plan card</FormDescription>
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Input
                                        placeholder="Add a feature"
                                        value={newFeature}
                                        onChange={(e) => setNewFeature(e.target.value)}
                                      />
                                      <Button type="button" onClick={addFeature}>Add</Button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {features.map((feature, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id={`feature-edit-${index}`}
                                            checked={form.getValues("features").includes(feature)}
                                            onChange={(e) => {
                                              const currentFeatures = form.getValues("features");
                                              if (e.target.checked) {
                                                form.setValue("features", [...currentFeatures, feature]);
                                              } else {
                                                form.setValue("features", currentFeatures.filter(f => f !== feature));
                                              }
                                            }}
                                            className="mr-1"
                                          />
                                          <label htmlFor={`feature-edit-${index}`} className="text-sm">
                                            {feature}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="advanced" className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="stripePriceId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Stripe Price ID (Monthly)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. price_1234567890" {...field} />
                                  </FormControl>
                                  <FormDescription>Stripe price ID for monthly billing</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="stripeAnnualPriceId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Stripe Price ID (Annual)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. price_1234567890" {...field} />
                                  </FormControl>
                                  <FormDescription>Stripe price ID for annual billing</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="stripeProductId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Stripe Product ID</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. prod_1234567890" {...field} />
                                  </FormControl>
                                  <FormDescription>Stripe product ID</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="isVisible"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                                  <div className="space-y-0.5">
                                    <FormLabel>Visible to Customers</FormLabel>
                                    <FormDescription>
                                      Show this plan on the pricing page
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
                              name="isComingSoon"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                                  <div className="space-y-0.5">
                                    <FormLabel>Coming Soon</FormLabel>
                                    <FormDescription>
                                      Mark this plan as "Coming Soon"
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
                          </div>
                        </TabsContent>
                      </Tabs>
                      
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsEditPlanDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={updatePlanMutation.isPending}>
                          {updatePlanMutation.isPending ? "Updating..." : "Update Plan"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Filters</CardTitle>
                <CardDescription>Filter the subscription plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="search"
                        placeholder="Search plans..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="platform-filter">Platform</Label>
                    <Select
                      value={platformFilter}
                      onValueChange={setPlatformFilter}
                    >
                      <SelectTrigger id="platform-filter" className="mt-1">
                        <SelectValue placeholder="Filter by platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="twitch">Twitch</SelectItem>
                        <SelectItem value="kick">Kick</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Manage all subscription plans</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPlans ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium">No plans found</h3>
                  <p className="mt-1">Try adjusting your filters or add a new plan.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlans.map((plan: any) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {plan.isPopular && (
                              <Sparkles className="h-4 w-4 text-yellow-500 mr-2" />
                            )}
                            {plan.name}
                          </div>
                          <span className="text-xs text-gray-500 block mt-1">ID: {plan.id}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPlatformColor(plan.platform)}>
                            {plan.platform.charAt(0).toUpperCase() + plan.platform.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1 text-gray-500" />
                              <span>{formatPrice(plan.price)}/mo</span>
                            </div>
                            {plan.annualPrice && (
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>{formatPrice(plan.annualPrice)}/yr</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            <span>{plan.viewerCount} viewers</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {plan.chatCount} chat users, {plan.followerCount || 0} followers
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {plan.isComingSoon ? (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                Coming Soon
                              </Badge>
                            ) : plan.isVisible ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                Hidden
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => togglePlanVisibility(plan.id, plan.isVisible)}
                              title={plan.isVisible ? "Hide Plan" : "Show Plan"}
                            >
                              {plan.isVisible ? (
                                <X className="h-4 w-4" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditPlan(plan)}
                              title="Edit Plan"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPlans;