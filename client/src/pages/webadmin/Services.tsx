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
import { Search, Download, Filter, Plus, Edit, Trash2, BookOpen, Tag, CheckCircle2, X, Box, Package } from 'lucide-react';

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
  const { data: plans = [] } = useQuery({
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
  const filteredPlans = plans.filter((plan: any) => {
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
  
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Services & Plans</h1>
              <p className="text-gray-500">Manage subscription plans and available services</p>
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
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                              <FormControl>
                                                <input
                                                  type="checkbox"
                                                  checked={field.value?.includes(feature)}
                                                  onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    const updatedFeatures = checked
                                                      ? [...field.value, feature]
                                                      : field.value?.filter(
                                                          (value) => value !== feature
                                                        );
                                                    field.onChange(updatedFeatures);
                                                  }}
                                                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                                                />
                                              </FormControl>
                                              <FormLabel className="text-sm font-normal cursor-pointer">
                                                {feature}
                                              </FormLabel>
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
                        <Button variant="outline" type="button" onClick={() => setIsAddPlanDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createPlanMutation.isPending}>
                          {createPlanMutation.isPending ? "Saving..." : "Save Plan"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="plans" className="flex items-center">
                <Package className="mr-2 h-4 w-4" /> Subscription Plans
              </TabsTrigger>
              <TabsTrigger value="platforms" className="flex items-center">
                <Box className="mr-2 h-4 w-4" /> Platforms
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center">
                <Tag className="mr-2 h-4 w-4" /> Individual Services
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="plans">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Plans</CardTitle>
                  <CardDescription>
                    Manage all subscription plans offered to users
                  </CardDescription>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search plans..."
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
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Platform:</span>
                      </div>
                      
                      <Select value={platformFilter} onValueChange={setPlatformFilter}>
                        <SelectTrigger className="w-[150px]">
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
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Viewers</TableHead>
                        <TableHead>Popular</TableHead>
                        <TableHead>Geo Targeting</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlans.map((plan: any) => (
                        <TableRow key={plan.id}>
                          <TableCell>
                            <div className="font-medium">{plan.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-[200px]">
                              {plan.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {plan.platform}
                            </Badge>
                          </TableCell>
                          <TableCell>${plan.price}/month</TableCell>
                          <TableCell>{plan.viewerCount}</TableCell>
                          <TableCell>
                            {plan.isPopular ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300" />
                            )}
                          </TableCell>
                          <TableCell>
                            {plan.geographicTargeting ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredPlans.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No subscription plans found matching your filters.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="platforms">
              <Card>
                <CardHeader>
                  <CardTitle>Platforms</CardTitle>
                  <CardDescription>
                    Manage supported platforms for services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Platform</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Icon</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {platforms.map((platform: any) => (
                        <TableRow key={platform.id}>
                          <TableCell>
                            <div className="font-medium capitalize">{platform.name}</div>
                            <div className="text-xs text-gray-500">{platform.slug}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600 max-w-[300px] truncate">
                              {platform.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`${platform.bgColor} p-2 rounded text-white inline-flex items-center justify-center w-8 h-8`}>
                              <i className={platform.iconClass}></i>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">3 Services</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Platform
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="services">
              <Card>
                <CardHeader>
                  <CardTitle>Individual Services</CardTitle>
                  <CardDescription>
                    Manage individual services that can be purchased separately
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Individual Services Yet</h3>
                    <p className="text-gray-500 mb-4">
                      You haven't added any individual services. Add your first service to offer one-time purchases.
                    </p>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Service
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminServices;
