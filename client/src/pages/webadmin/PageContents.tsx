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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/dashboard/AdminLayout';
import { PageContent } from '@shared/schema';
import { Loader2, Plus, Trash2, Pencil } from 'lucide-react';

const AdminPageContents: React.FC = () => {
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPageContent, setCurrentPageContent] = useState<PageContent | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    isActive: true,
    position: 0
  });
  
  // Fetch page contents
  const { data: pageContents, isLoading, isError, error } = useQuery<PageContent[]>({
    queryKey: ['/api/admin/page-contents'],
  });
  
  // Create page content mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest('POST', '/api/admin/page-contents', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Page content created successfully',
      });
      setIsEditModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-contents'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create page content',
        variant: 'destructive',
      });
    }
  });
  
  // Update page content mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const res = await apiRequest('PUT', `/api/admin/page-contents/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Page content updated successfully',
      });
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-contents'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update page content',
        variant: 'destructive',
      });
    }
  });
  
  // Delete page content mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/page-contents/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Page content deleted successfully',
      });
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-contents'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete page content',
        variant: 'destructive',
      });
    }
  });
  
  // Handle input change for form fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
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
      slug: '',
      title: '',
      content: '',
      metaTitle: '',
      metaDescription: '',
      isActive: true,
      position: 0
    });
    setCurrentPageContent(null);
  };
  
  // Open edit modal for creating a new page content
  const openCreateModal = () => {
    resetForm();
    setIsEditModalOpen(true);
  };
  
  // Open edit modal for editing an existing page content
  const openEditModal = (pageContent: PageContent) => {
    setCurrentPageContent(pageContent);
    setFormData({
      slug: pageContent.slug,
      title: pageContent.title,
      content: pageContent.content,
      metaTitle: pageContent.metaTitle || '',
      metaDescription: pageContent.metaDescription || '',
      isActive: pageContent.isActive,
      position: pageContent.position
    });
    setIsEditModalOpen(true);
  };
  
  // Open delete confirmation modal
  const openDeleteModal = (pageContent: PageContent) => {
    setCurrentPageContent(pageContent);
    setIsDeleteModalOpen(true);
  };
  
  // Handle form submission for creating or updating page content
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert position to number
    const payload = {
      ...formData,
      position: Number(formData.position)
    };
    
    if (currentPageContent) {
      // Update existing page content
      updateMutation.mutate({ id: currentPageContent.id, data: payload });
    } else {
      // Create new page content
      createMutation.mutate(payload);
    }
  };
  
  // Handle delete confirmation
  const handleDelete = () => {
    if (currentPageContent) {
      deleteMutation.mutate(currentPageContent.id);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <AdminLayout>
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>Error loading page contents: {(error as Error)?.message || 'Unknown error'}</p>
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
            <h1 className="text-3xl font-bold">Page Content Management</h1>
            <p className="text-muted-foreground">
              Manage website page content for homepage and other static pages
            </p>
          </div>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Page Content
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Page Contents</CardTitle>
            <CardDescription>
              Below is a list of all page content sections on the website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageContents && pageContents.length > 0 ? (
                  pageContents.map((pageContent) => (
                    <TableRow key={pageContent.id}>
                      <TableCell>{pageContent.id}</TableCell>
                      <TableCell className="font-medium">{pageContent.title}</TableCell>
                      <TableCell>{pageContent.slug}</TableCell>
                      <TableCell>{pageContent.position}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${pageContent.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {pageContent.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(pageContent)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteModal(pageContent)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No page contents found. Click the "Add Page Content" button to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Edit/Create Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{currentPageContent ? 'Edit Page Content' : 'Create New Page Content'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="content" className="mt-4">
                <TabsList>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-4 py-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        The slug is used in the URL and must be unique. Use only lowercase letters, numbers, and hyphens.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        rows={10}
                        required
                        className="h-64"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        You can use HTML tags in the content. The content will be displayed as is on the website.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="seo" className="space-y-4 py-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="metaTitle">Meta Title</Label>
                      <Input
                        id="metaTitle"
                        name="metaTitle"
                        value={formData.metaTitle}
                        onChange={handleInputChange}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional. SEO meta title for the page. Defaults to the regular title if not specified.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Textarea
                        id="metaDescription"
                        name="metaDescription"
                        value={formData.metaDescription}
                        onChange={handleInputChange}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional. SEO meta description for the page. Recommended length is 150-160 characters.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="settings" className="space-y-4 py-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="position">Display Position</Label>
                      <Input
                        id="position"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        type="number"
                        min="0"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        The position determines the order in which the content appears. Lower numbers appear first.
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
                        Only active content is visible on the website.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="mt-6">
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
                  {currentPageContent ? 'Save Changes' : 'Create Page Content'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Page Content</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                Are you sure you want to delete the page content "{currentPageContent?.title}"?
                This action cannot be undone.
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

export default AdminPageContents;