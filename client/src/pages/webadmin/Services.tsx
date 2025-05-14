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
import { Search, Download, Filter, Plus, Edit, Trash2, BookOpen, Tag, CheckCircle2, X, Box, Package, Loader2, AlertTriangle, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Schema for creating/editing subscription plan
const planFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  price: z.coerce.number().min(0, "Monthly price must be a positive number"),
  dailyPrice: z.coerce.number().min(0, "Daily price must be a positive number").optional(),
  weeklyPrice: z.coerce.number().min(0, "Weekly price must be a positive number").optional(),
  annualPrice: z.coerce.number().min(0, "Annual price must be a positive number").optional(),
  billingCycle: z.enum(["daily", "weekly", "monthly", "annual"]).default("monthly"),
  viewerCount: z.coerce.number().min(0, "Viewer count must be a positive number"),
  chatCount: z.coerce.number().min(0, "Chat count must be a positive number"),
  followerCount: z.coerce.number().min(0, "Follower count must be a positive number"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  stripePriceId: z.string().optional(),
  stripeDailyPriceId: z.string().optional(),
  stripeWeeklyPriceId: z.string().optional(), 
  stripeAnnualPriceId: z.string().optional(),
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
  dailyPrice?: number;
  weeklyPrice?: number;
  annualPrice?: number;
  billingCycle: string;
  platform: string;
  description: string;
  viewerCount: number;
  chatCount: number;
  followerCount: number;
  features: string[];
  isPopular: boolean;
  geographicTargeting: boolean;
  stripePriceId?: string;
  stripeDailyPriceId?: string;
  stripeWeeklyPriceId?: string;
  stripeAnnualPriceId?: string;
  stripeProductId?: string;
  isVisible: boolean;
  sortOrder?: number;
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

// Sortable Table Row component
interface SortableRowProps {
  id: number;
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
}

const SortableTableRow: React.FC<SortableRowProps> = ({ id, plan, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as 'relative',
  };
  
  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-accent/30' : ''}>
      <TableCell className="w-12">
        <div className="flex items-center justify-center cursor-grab" {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {plan.name}
          {plan.isPopular && (
            <Badge variant="secondary">Popular</Badge>
          )}
        </div>
      </TableCell>
      <TableCell>{plan.platform}</TableCell>
      <TableCell>{plan.billingCycle === 'monthly' ? 'Aylık' : 
                  plan.billingCycle === 'annual' ? 'Yıllık' : 
                  plan.billingCycle === 'weekly' ? 'Haftalık' : 'Günlük'}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          {plan.price > 0 && <span>Aylık: {plan.price} TL</span>}
          {plan.dailyPrice && plan.dailyPrice > 0 && <span>Günlük: {plan.dailyPrice} TL</span>}
          {plan.weeklyPrice && plan.weeklyPrice > 0 && <span>Haftalık: {plan.weeklyPrice} TL</span>}
          {plan.annualPrice && plan.annualPrice > 0 && <span>Yıllık: {plan.annualPrice} TL</span>}
        </div>
      </TableCell>
      <TableCell>{plan.viewerCount}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {plan.features.slice(0, 2).map((feature, i) => (
            <Badge key={i} variant="outline" className="whitespace-nowrap">
              {feature}
            </Badge>
          ))}
          {plan.features.length > 2 && (
            <Badge variant="outline">+{plan.features.length - 2}</Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={plan.isVisible ? "outline" : "destructive"} className={plan.isVisible ? "bg-green-100 text-green-800" : ""}>
          {plan.isVisible ? "Aktif" : "Gizli"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(plan)}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(plan)}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const AdminServices: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = useState<boolean>(false);
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [sortMode, setSortMode] = useState<boolean>(false);
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
  const { data: plans = [], isLoading: plansLoading, refetch } = useQuery<Plan[]>({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const response = await fetch('/api/subscription-plans');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }
      return response.json();
    }
  });
  
  // Set up drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // State for sortable plans
  const [sortablePlans, setSortablePlans] = useState<Plan[]>([]);
  
  // Initialize sortable plans when plans data changes
  useEffect(() => {
    if (plans.length > 0) {
      // Create a copy with sortOrder property assigned if missing
      const orderedPlans = plans.map((plan, index) => ({
        ...plan,
        sortOrder: plan.sortOrder !== undefined ? plan.sortOrder : index,
      }));
      
      // Sort by sortOrder
      const sorted = [...orderedPlans].sort((a, b) => 
        (a.sortOrder || 0) - (b.sortOrder || 0)
      );
      
      setSortablePlans(sorted);
    }
  }, [plans]);
  
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
      dailyPrice: 0,
      weeklyPrice: 0,
      annualPrice: 0,
      billingCycle: "monthly",
      viewerCount: 0,
      chatCount: 0,
      followerCount: 0,
      description: "",
      stripePriceId: "",
      stripeDailyPriceId: "",
      stripeWeeklyPriceId: "",
      stripeAnnualPriceId: "",
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
  
  // Reorder plans mutation
  const reorderPlansMutation = useMutation({
    mutationFn: async (planOrders: { id: number, sortOrder: number }[]) => {
      const res = await apiRequest("PATCH", "/api/admin/subscription-plans/reorder", { planOrders });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sıralama güncellendi",
        description: "Plan sıralaması başarıyla güncellendi."
      });
      setSortMode(false);
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Sıralama hatası",
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
            throw new Error("Bu planı silemezsiniz çünkü aktif aboneleri var. Lütfen önce aboneleri başka bir plana taşıyın veya aboneliklerini iptal edin.");
          } else {
            throw new Error(`Sunucu hatası: ${res.status}`);
          }
        }
        
        // If server returns 409 Conflict (plan has active subscriptions)
        if (res.status === 409) {
          // Format a more specific error with subscription count if available
          if (data.activeSubscriptions) {
            throw new Error(`Bu planı silemezsiniz çünkü ${data.activeSubscriptions} aktif abonesi var. Lütfen önce aboneleri başka bir plana taşıyın veya aboneliklerini iptal edin.`);
          } else {
            throw new Error(data.message || "Bu planı silemezsiniz çünkü aktif aboneleri var. Lütfen önce aboneleri başka bir plana taşıyın veya aboneliklerini iptal edin.");
          }
        }
        
        // For other error responses
        throw new Error(data.message || "Planı silerken bir hata oluştu");
      } catch (error: any) {
        // Catch and rethrow to ensure consistent error format
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error("Beklenmeyen bir hata oluştu");
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Plan silindi",
        description: "Abonelik planı başarıyla silindi."
      });
      setIsDeleteDialogOpen(false);
      setSelectedPlan(null);
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
    },
    onError: (error: Error) => {
      setIsDeleteDialogOpen(false); // Close the dialog even on error
      toast({
        title: "Plan silme hatası",
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
  
  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    // Find indices in the current array
    const oldIndex = sortablePlans.findIndex(p => p.id === active.id);
    const newIndex = sortablePlans.findIndex(p => p.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    
    // Create new array with updated positions
    const newSortablePlans = [...sortablePlans];
    const [movedItem] = newSortablePlans.splice(oldIndex, 1);
    newSortablePlans.splice(newIndex, 0, movedItem);
    
    // Update sort orders
    const withNewSortOrders = newSortablePlans.map((plan, index) => ({
      ...plan,
      sortOrder: index
    }));
    
    setSortablePlans(withNewSortOrders);
    
    // Not saving to server immediately (only on button click)
    // This allows for multiple drag-drop operations before saving
  };
  
  // Add a feature to the list
  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature]);
      setNewFeature('');
    }
  };
  
  // Remove a feature from the list
  const removeFeature = (index: number) => {
    setFeatures(features.filter((f, i) => i !== index));
  };
  
  // Handle form submission
  const onSubmit = (data: PlanFormValues) => {
    if (selectedPlan) {
      updatePlanMutation.mutate({ ...data, id: selectedPlan.id });
    } else {
      createPlanMutation.mutate(data);
    }
  };
  
  // Open edit plan dialog
  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setFeatures(plan.features);
    
    // Reset form with plan data
    form.reset({
      name: plan.name,
      price: plan.price,
      dailyPrice: plan.dailyPrice || 0,
      weeklyPrice: plan.weeklyPrice || 0,
      annualPrice: plan.annualPrice || 0,
      billingCycle: plan.billingCycle as any,
      viewerCount: plan.viewerCount,
      chatCount: plan.chatCount,
      followerCount: plan.followerCount,
      description: plan.description,
      stripePriceId: plan.stripePriceId || '',
      stripeDailyPriceId: plan.stripeDailyPriceId || '',
      stripeWeeklyPriceId: plan.stripeWeeklyPriceId || '',
      stripeAnnualPriceId: plan.stripeAnnualPriceId || '',
      platform: plan.platform,
      isPopular: plan.isPopular,
      geographicTargeting: plan.geographicTargeting,
      isVisible: plan.isVisible,
      features: plan.features
    });
    
    setIsEditPlanDialogOpen(true);
  };
  
  // Open delete plan dialog
  const handleDeletePlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsDeleteDialogOpen(true);
  };
  
  // Loading indicator
  if (plansLoading || platformsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminHeader
        title="Subscription Plans & Services"
        description="Manage subscription plans for different platforms."
      />

      <div className="grid gap-6">
        <Tabs defaultValue={currentTab} onValueChange={setCurrentTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              {currentTab === 'plans' && (
                sortMode ? (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        // Create the array of plan orders for the API
                        const planOrders = sortablePlans.map((plan, index) => ({
                          id: plan.id,
                          sortOrder: index
                        }));
                        
                        // Submit to the API
                        reorderPlansMutation.mutate(planOrders);
                      }}
                      variant="outline"
                      disabled={reorderPlansMutation.isPending}
                    >
                      {reorderPlansMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Sıralamayı Kaydet
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setSortMode(true)} 
                    variant="outline"
                  >
                    <ArrowUp className="mr-2 h-4 w-4" />
                    Sıralama Düzenle
                  </Button>
                )
              )}
              
              {sortMode ? (
                <Button 
                  onClick={() => setSortMode(false)} 
                  variant="outline"
                >
                  <X className="mr-2 h-4 w-4" />
                  İptal
                </Button>
              ) : (
                <Button onClick={() => setIsAddPlanDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Plan
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Subscription Plans</CardTitle>
                <CardDescription>
                  Create and manage subscription plans for your services.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative w-full sm:w-1/2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search plans..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select
                    value={platformFilter}
                    onValueChange={setPlatformFilter}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All platforms</SelectItem>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.id} value={platform.slug}>
                          {platform.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {sortMode && <TableHead className="w-12"></TableHead>}
                        <TableHead>Name</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Billing Cycle</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Viewers</TableHead>
                        <TableHead>Features</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortMode ? (
                        <DndContext 
                          sensors={sensors} 
                          collisionDetection={closestCenter} 
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext 
                            items={sortablePlans.map(plan => plan.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {sortablePlans.map((plan) => (
                              <SortableTableRow 
                                key={plan.id}
                                id={plan.id}
                                plan={plan}
                                onEdit={handleEditPlan}
                                onDelete={(plan) => {
                                  setSelectedPlan(plan);
                                  setIsDeleteDialogOpen(true);
                                }}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
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
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {plan.billingCycle === 'daily' ? 'Günlük' : 
                                plan.billingCycle === 'weekly' ? 'Haftalık' : 
                                plan.billingCycle === 'monthly' ? 'Aylık' : 
                                plan.billingCycle === 'annual' ? 'Yıllık' : 'Aylık'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                {plan.price > 0 && <span>Aylık: {plan.price} TL</span>}
                                {plan.dailyPrice && plan.dailyPrice > 0 && <span>Günlük: {plan.dailyPrice} TL</span>}
                                {plan.weeklyPrice && plan.weeklyPrice > 0 && <span>Haftalık: {plan.weeklyPrice} TL</span>}
                                {plan.annualPrice && plan.annualPrice > 0 && <span>Yıllık: {plan.annualPrice} TL</span>}
                              </div>
                            </TableCell>
                            <TableCell>{plan.viewerCount}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {plan.features.slice(0, 2).map((feature, i) => (
                                  <Badge key={i} variant="outline" className="whitespace-nowrap">
                                    {feature}
                                  </Badge>
                                ))}
                                {plan.features.length > 2 && (
                                  <Badge variant="outline">+{plan.features.length - 2}</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={plan.isVisible ? "outline" : "destructive"} className={plan.isVisible ? "bg-green-100 text-green-800" : ""}>
                                {plan.isVisible ? "Aktif" : "Gizli"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditPlan(plan)}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePlan(plan)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      {filteredPlans.length === 0 && !sortMode && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <Package className="h-10 w-10 mb-2" />
                              <h3 className="font-medium">No plans found</h3>
                              <p className="text-sm mb-4">
                                {searchQuery || platformFilter !== 'all'
                                  ? "Try adjusting your search or filter."
                                  : "Start by adding a new subscription plan."}
                              </p>
                              {!sortMode && (
                                <Button onClick={() => setIsAddPlanDialogOpen(true)}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add New Plan
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Feature Library</CardTitle>
                <CardDescription>
                  Create and manage features that can be added to subscription plans.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Add new feature..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addFeature();
                      }
                    }}
                  />
                  <Button onClick={addFeature} type="button">
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>

                <div className="grid gap-3 mt-6">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-3 border rounded-md"
                    >
                      <span>{feature}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                  {features.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-muted-foreground py-10">
                      <Tag className="h-10 w-10 mb-2" />
                      <h3 className="font-medium">No features found</h3>
                      <p className="text-sm mb-4">
                        Start by adding features for your subscription plans.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Plan Dialog */}
      <Dialog
        open={isAddPlanDialogOpen || isEditPlanDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsAddPlanDialogOpen(false);
            setIsEditPlanDialogOpen(false);
            setSelectedPlan(null);
            form.reset();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditPlanDialogOpen ? "Edit Subscription Plan" : "Add Subscription Plan"}
            </DialogTitle>
            <DialogDescription>
              {isEditPlanDialogOpen
                ? "Update the details of this subscription plan."
                : "Fill in the details to create a new subscription plan."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Basic Plan" {...field} />
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {platforms.map((platform) => (
                            <SelectItem key={platform.id} value={platform.slug}>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="billingCycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Billing Cycle</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing cycle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Günlük (Daily)</SelectItem>
                          <SelectItem value="weekly">Haftalık (Weekly)</SelectItem>
                          <SelectItem value="monthly">Aylık (Monthly)</SelectItem>
                          <SelectItem value="annual">Yıllık (Annual)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This is the default billing cycle shown to customers.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Price (TL)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dailyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Price (TL)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weeklyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weekly Price (TL)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="annualPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Price (TL)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="stripePriceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stripe Monthly Price ID</FormLabel>
                        <FormControl>
                          <Input placeholder="price_..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Stripe Price ID for the monthly billing cycle
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stripeDailyPriceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stripe Daily Price ID</FormLabel>
                        <FormControl>
                          <Input placeholder="price_..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Stripe Price ID for the daily billing cycle
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stripeWeeklyPriceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stripe Weekly Price ID</FormLabel>
                        <FormControl>
                          <Input placeholder="price_..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Stripe Price ID for the weekly billing cycle
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stripeAnnualPriceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stripe Annual Price ID</FormLabel>
                        <FormControl>
                          <Input placeholder="price_..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Stripe Price ID for the annual billing cycle
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="viewerCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Viewer Count</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
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
                        <Input type="number" placeholder="0" {...field} />
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
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
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
                      <Textarea
                        placeholder="Enter plan description..."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="features"
                render={() => (
                  <FormItem>
                    <FormLabel>Features</FormLabel>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add new feature..."
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addFeature();
                            }
                          }}
                        />
                        <Button onClick={addFeature} type="button">
                          <Plus className="mr-2 h-4 w-4" />
                          Add
                        </Button>
                      </div>

                      <div className="grid gap-3 mt-2">
                        {features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between px-4 py-3 border rounded-md"
                          >
                            <span>{feature}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFeature(index)}
                              type="button"
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        ))}
                        {features.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground">
                            No features added yet
                          </div>
                        )}
                      </div>
                      <input
                        type="hidden"
                        {...form.register("features")}
                        value={JSON.stringify(features)}
                      />
                    </div>
                    <FormDescription>
                      Features will be shown to customers on the pricing page.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="isPopular"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Popular Plan</FormLabel>
                        <FormDescription>
                          Highlight this plan on the pricing page
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Geographic Targeting
                        </FormLabel>
                        <FormDescription>
                          Enable country-based targeting
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
                  name="isVisible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Visible</FormLabel>
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
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                >
                  {(createPlanMutation.isPending || updatePlanMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditPlanDialogOpen ? "Update Plan" : "Create Plan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the &quot;{selectedPlan?.name}&quot; plan
              and all its data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedPlan) {
                  deletePlanMutation.mutate(selectedPlan.id);
                }
              }}
              disabled={deletePlanMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePlanMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminServices;