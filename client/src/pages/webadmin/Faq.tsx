import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/dashboard/AdminLayout';
import { Faq as FaqType, FaqCategory } from '@shared/schema';
import { Loader2, Plus, Trash2, Pencil, Power } from 'lucide-react';

const Faq: React.FC = () => {
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentFaq, setCurrentFaq] = useState<FaqType | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    categoryId: '',
    position: 0,
    isActive: true
  });
  
  // Fetch FAQ items
  const { data: faqs, isLoading: isLoadingFaqs, isError: isErrorFaqs, error: errorFaqs } = useQuery<FaqType[]>({
    queryKey: ['/api/admin/faqs'],
  });
  
  // Fetch categories for dropdown
  const { data: categories } = useQuery<FaqCategory[]>({
    queryKey: ['/api/admin/faq-categories'],
  });
  
  // Create FAQ mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/admin/faqs', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'FAQ created successfully',
      });
      setIsEditModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faqs'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create FAQ',
        variant: 'destructive',
      });
    }
  });
  
  // Update FAQ mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest('PUT', `/api/admin/faqs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'FAQ updated successfully',
      });
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faqs'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update FAQ',
        variant: 'destructive',
      });
    }
  });
  
  // Delete FAQ mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/faqs/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'FAQ deleted successfully',
      });
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faqs'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete FAQ',
        variant: 'destructive',
      });
    }
  });
  
  // Toggle FAQ status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest('POST', `/api/admin/faqs/${id}/toggle-status`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'FAQ status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faqs'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update FAQ status',
        variant: 'destructive',
      });
    }
  });
  
  // Handle input change for text inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === 'position' ? parseInt(value) || 0 : value,
    }));
  };
  
  // Handle select input changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  
  // Handle switch toggle for isActive
  const handleSwitchChange = (checked: boolean) => {
    setFormData((prevData) => ({
      ...prevData,
      isActive: checked,
    }));
  };
  
  // Reset form state
  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      categoryId: '',
      position: 0,
      isActive: true
    });
    setCurrentFaq(null);
  };
  
  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setIsEditModalOpen(true);
  };
  
  // Open edit modal
  const openEditModal = (faq: FaqType) => {
    setCurrentFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      categoryId: faq.categoryId ? faq.categoryId.toString() : '',
      position: faq.position,
      isActive: faq.isActive
    });
    setIsEditModalOpen(true);
  };
  
  // Open delete confirmation modal
  const openDeleteModal = (faq: FaqType) => {
    setCurrentFaq(faq);
    setIsDeleteModalOpen(true);
  };
  
  // Toggle FAQ active status
  const toggleFaqStatus = (faq: FaqType) => {
    toggleStatusMutation.mutate({
      id: faq.id,
      isActive: !faq.isActive
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create payload (convert categoryId to number if provided)
    const payload = {
      ...formData,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null
    };
    
    if (currentFaq) {
      // Update existing FAQ
      updateMutation.mutate({ id: currentFaq.id, data: payload });
    } else {
      // Create new FAQ
      createMutation.mutate(payload);
    }
  };
  
  // Handle delete confirmation
  const handleDelete = () => {
    if (currentFaq) {
      deleteMutation.mutate(currentFaq.id);
    }
  };
  
  // Loading state
  if (isLoadingFaqs) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  
  // Error state
  if (isErrorFaqs) {
    return (
      <AdminLayout>
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>Error loading FAQs: {(errorFaqs as Error)?.message || 'Unknown error'}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">FAQ Management</h1>
            <p className="text-muted-foreground">Manage frequently asked questions</p>
          </div>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add FAQ
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All FAQs</CardTitle>
            <CardDescription>
              Manage the frequently asked questions shown on the website. FAQs are grouped by category and ordered by position.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs && faqs.length > 0 ? (
                  faqs.map((faq) => {
                    const category = categories?.find(c => c.id === faq.categoryId);
                    return (
                      <TableRow key={faq.id}>
                        <TableCell>{faq.id}</TableCell>
                        <TableCell className="font-medium max-w-xs truncate">{faq.question}</TableCell>
                        <TableCell>{category?.name || 'Uncategorized'}</TableCell>
                        <TableCell>{faq.position}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            faq.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {faq.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFaqStatus(faq)}
                              title={faq.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <Power className={`h-4 w-4 ${faq.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(faq)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteModal(faq)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No FAQs found. Click the "Add FAQ" button to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Edit/Create Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{currentFaq ? 'Edit FAQ' : 'Create New FAQ'}</DialogTitle>
              <DialogDescription>
                {currentFaq ? 'Update the FAQ details' : 'Fill in the details to create a new FAQ'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="answer">Answer</Label>
                  <Textarea
                    id="answer"
                    name="answer"
                    value={formData.answer}
                    onChange={handleInputChange}
                    rows={5}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    You can use HTML in the answer for formatting.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => handleSelectChange('categoryId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Uncategorized</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="position">Display Position</Label>
                  <Input
                    id="position"
                    name="position"
                    type="number"
                    min={0}
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    FAQs with lower position values appear first within their category.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-xs text-muted-foreground ml-2">
                    Only active FAQs are visible on the website.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {currentFaq ? 'Save Changes' : 'Create FAQ'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete FAQ</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the FAQ.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>
                Are you sure you want to delete the FAQ "{currentFaq?.question}"?
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Faq;