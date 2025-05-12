import React, { useState } from 'react';
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
      features: features
    }
  });
  
  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: PlanFormValues) => {
      const res = await apiRequest("POST", "/api/admin/subscription-plans", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan created",
        description: "The subscription plan has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      setIsAddPlanDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating plan",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (data: PlanFormValues & { id: number }) => {
      const { id, ...rest } = data;
      const res = await apiRequest("PUT", `/api/admin/subscription-plans/${id}`, rest);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan updated",
        description: "The subscription plan has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      setIsEditPlanDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating plan",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Toggle plan visibility mutation
  const togglePlanVisibilityMutation = useMutation({
    mutationFn: async (data: { id: number, isVisible: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/subscription-plans/${data.id}/visibility`, { isVisible: data.isVisible });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating visibility",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Filtered plans based on search and platform filter
  const filteredPlans = plans ? plans.filter((plan: any) => {
    const matchesSearch = searchQuery
      ? plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchQuery.toLowerCase())
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
    
    form.setValue("name", plan.name);
    form.setValue("description", plan.description);
    form.setValue("price", Number(plan.price));
    form.setValue("annualPrice", plan.annualPrice ? Number(plan.annualPrice) : undefined);
    form.setValue("billingCycle", plan.billingCycle || "monthly");
    form.setValue("viewerCount", Number(plan.viewerCount));
    form.setValue("chatCount", Number(plan.chatCount));
    form.setValue("followerCount", Number(plan.followerCount));
    form.setValue("stripePriceId", plan.stripePriceId || "");
    form.setValue("stripeAnnualPriceId", plan.stripeAnnualPriceId || "");
    form.setValue("stripeProductId", plan.stripeProductId || "");
    form.setValue("platform", plan.platform);
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
    <AdminLayout>
      <AdminHeader
        title="Subscription Plans"
        description="Manage subscription plans, pricing, and features"
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
                      <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="pricing">Pricing & Promo</TabsTrigger>
                        <TabsTrigger value="features">Features</TabsTrigger>
                      </TabsList>
                      
                      {/* Basic Info Tab */}
                      <TabsContent value="basic" className="space-y-6">
                        {/* Form fields for basic info */}
                      </TabsContent>
                      
                      {/* Pricing Tab */}
                      <TabsContent value="pricing" className="space-y-6">
                        {/* Form fields for pricing */}
                      </TabsContent>
                      
                      {/* Features Tab */}
                      <TabsContent value="features" className="space-y-6">
                        {/* Form fields for features */}
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
          </div>
        }
      >
        <div className="space-y-6 p-6">
          {/* Filters Card */}
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
          
          {/* Plans Table Card */}
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
                  No subscription plans found. Try adjusting your filters or create a new plan.
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
                          <div className="flex flex-col">
                            <span>{plan.name}</span>
                            {plan.isPopular && (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 mt-1 inline-flex w-fit">
                                Popular
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPlatformColor(plan.platform)}>
                            {plan.platform}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatPrice(plan.price)}/mo</TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {plan.features && plan.features.length > 0 ? plan.features.join(', ') : 'No features'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
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
          
          {/* Edit Plan Dialog */}
          <Dialog open={isEditPlanDialogOpen} onOpenChange={setIsEditPlanDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Subscription Plan</DialogTitle>
                <DialogDescription>
                  Update the details of this subscription plan.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onUpdateSubmit)} className="space-y-6">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="pricing">Pricing & Promo</TabsTrigger>
                      <TabsTrigger value="features">Features</TabsTrigger>
                    </TabsList>
                    
                    {/* Tabs content similar to Add Plan dialog */}
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
      </AdminHeader>
    </AdminLayout>
  );
};

export default AdminPlans;