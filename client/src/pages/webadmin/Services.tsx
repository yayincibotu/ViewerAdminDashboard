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
                                          <FormItem className="flex items-center space-x-2 w-full">
                                            <FormControl>
                                              <div className="flex items-center justify-between border rounded-md p-2 w-full">
                                                <label className="text-sm cursor-pointer flex-1">{feature}</label>
                                                <Switch
                                                  checked={field.value?.includes(feature)}
                                                  onCheckedChange={(checked) => {
                                                    const values = new Set(field.value || []);
                                                    checked ? values.add(feature) : values.delete(feature);
                                                    field.onChange(Array.from(values));
                                                  }}
                                                />
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
                        {createPlanMutation.isPending ? "Saving..." : "Save Plan"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        }
      >
        <div className="space-y-8">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plans..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  {platformFilter === 'all' ? 'All Platforms' : platformFilter.charAt(0).toUpperCase() + platformFilter.slice(1)}
                </div>
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
          
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="plans" className="flex items-center">
                <Package className="mr-2 h-4 w-4" /> Subscription Plans
              </TabsTrigger>
              <TabsTrigger value="platforms" className="flex items-center">
                <Box className="mr-2 h-4 w-4" /> Platforms
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" /> Service Components
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="plans">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredPlans.length === 0 ? (
                  <div className="col-span-3 p-8 text-center">
                    <p className="text-muted-foreground">No subscription plans found</p>
                  </div>
                ) : (
                  filteredPlans.map((plan: any) => (
                    <Card key={plan.id} className={plan.isPopular ? "border-primary" : ""}>
                      {plan.isPopular && (
                        <div className="bg-primary text-primary-foreground py-1 text-center text-sm font-medium">
                          POPULAR
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription className="mt-1">{plan.description}</CardDescription>
                          </div>
                          <Badge>{plan.platform}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <span className="text-3xl font-bold">${plan.price}</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                        
                        <ul className="space-y-2">
                          {plan.features?.map((feature: string, index: number) => (
                            <li key={index} className="flex items-center">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="platforms">
              <Card>
                <CardHeader>
                  <CardTitle>Supported Platforms</CardTitle>
                  <CardDescription>Manage the streaming platforms supported by your service</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Platform Name</TableHead>
                        <TableHead>Icon</TableHead>
                        <TableHead>API Integration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {platforms.map((platform: any) => (
                        <TableRow key={platform.id}>
                          <TableCell>
                            <div className="font-medium">{platform.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <i className={platform.iconClass}></i>
                            </div>
                          </TableCell>
                          <TableCell>
                            {platform.hasApiIntegration ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Integrated
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                                <X className="h-3 w-3 mr-1" /> Not Integrated
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {platform.isActive ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="services">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">Service components are the technical building blocks that power your platform offerings.</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Service Component
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminHeader>
    </AdminLayout>
  );
};

export default AdminServices;