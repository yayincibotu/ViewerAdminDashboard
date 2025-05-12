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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Filter, Plus, Edit, Trash2, BookOpen, Tag, CheckCircle2, X, Box, Package, Loader2 } from 'lucide-react';

// Schema for creating/editing subscription plan
const planFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  price: z.string().transform(val => parseInt(val)),
  viewerCount: z.string().transform(val => parseInt(val)),
  chatCount: z.string().transform(val => parseInt(val)),
  followerCount: z.string().transform(val => parseInt(val)),
  description: z.string().min(5, "Description must be at least 5 characters"),
  stripePriceId: z.string().optional(),
  platform: z.string(),
  isPopular: z.boolean().default(false),
  geographicTargeting: z.boolean().default(false),
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
      price: "0",
      viewerCount: "0",
      chatCount: "0",
      followerCount: "0",
      description: "",
      stripePriceId: "",
      platform: "twitch",
      isPopular: false,
      geographicTargeting: false,
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
  
  // Submit plan form
  const onSubmit = (data: PlanFormValues) => {
    createPlanMutation.mutate(data);
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
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
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
    </AdminLayout>
  );
};

export default AdminServices;