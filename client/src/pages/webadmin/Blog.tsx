import React, { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/dashboard/AdminLayout';
import { BlogPost, BlogCategory } from '@shared/schema';
import { Loader2, Plus, Trash2, Pencil, Eye, EyeOff } from 'lucide-react';

const Blog: React.FC = () => {
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    categoryId: '',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    coverImage: '',
    status: 'draft' as 'draft' | 'published'
  });
  
  // Fetch blog posts
  const { data: posts, isLoading: isLoadingPosts, isError: isErrorPosts, error: errorPosts } = useQuery<BlogPost[]>({
    queryKey: ['/api/admin/blog-posts'],
  });
  
  // Fetch categories for dropdown
  const { data: categories } = useQuery<BlogCategory[]>({
    queryKey: ['/api/admin/blog-categories'],
  });
  
  // Create post mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/admin/blog-posts', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Blog post created successfully',
      });
      setIsEditModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog-posts'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create blog post',
        variant: 'destructive',
      });
    }
  });
  
  // Update post mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest('PUT', `/api/admin/blog-posts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Blog post updated successfully',
      });
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog-posts'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update blog post',
        variant: 'destructive',
      });
    }
  });
  
  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/blog-posts/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully',
      });
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog-posts'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete blog post',
        variant: 'destructive',
      });
    }
  });
  
  // Publish post mutation
  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/admin/blog-posts/${id}/publish`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Blog post published successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog-posts'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish blog post',
        variant: 'destructive',
      });
    }
  });
  
  // Unpublish post mutation
  const unpublishMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/admin/blog-posts/${id}/unpublish`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Blog post unpublished successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog-posts'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unpublish blog post',
        variant: 'destructive',
      });
    }
  });
  
  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  
  // Handle select input changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  
  // Reset form state
  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      categoryId: '',
      tags: '',
      metaTitle: '',
      metaDescription: '',
      coverImage: '',
      status: 'draft'
    });
    setCurrentPost(null);
  };
  
  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setIsEditModalOpen(true);
  };
  
  // Open edit modal
  const openEditModal = (post: BlogPost) => {
    setCurrentPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      categoryId: post.categoryId ? post.categoryId.toString() : '',
      tags: post.tags || '',
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      coverImage: post.coverimage || '',
      status: post.status as 'draft' | 'published'
    });
    setIsEditModalOpen(true);
  };
  
  // Open delete confirmation modal
  const openDeleteModal = (post: BlogPost) => {
    setCurrentPost(post);
    setIsDeleteModalOpen(true);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create payload (convert categoryId to number)
    const payload = {
      ...formData,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null
    };
    
    if (currentPost) {
      // Update existing post
      updateMutation.mutate({ id: currentPost.id, data: payload });
    } else {
      // Create new post
      createMutation.mutate(payload);
    }
  };
  
  // Handle delete confirmation
  const handleDelete = () => {
    if (currentPost) {
      deleteMutation.mutate(currentPost.id);
    }
  };
  
  // Handle publish/unpublish
  const togglePublishStatus = (post: BlogPost) => {
    if (post.status === 'published') {
      unpublishMutation.mutate(post.id);
    } else {
      publishMutation.mutate(post.id);
    }
  };
  
  // Generate slug from title
  const generateSlug = () => {
    if (!formData.title) return;
    
    const slug = formData.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
    
    setFormData(prev => ({ ...prev, slug }));
  };
  
  // Generate slug when title changes
  useEffect(() => {
    if (formData.title && !formData.slug && !currentPost) {
      generateSlug();
    }
  }, [formData.title]);
  
  // Loading state
  if (isLoadingPosts) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  
  // Error state
  if (isErrorPosts) {
    return (
      <AdminLayout>
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>Error loading blog posts: {(errorPosts as Error)?.message || 'Unknown error'}</p>
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
            <h1 className="text-3xl font-bold">Blog Management</h1>
            <p className="text-muted-foreground">Create and manage blog posts</p>
          </div>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Blog Post
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Blog Posts</CardTitle>
            <CardDescription>
              View and manage all blog posts. Published posts are visible on the blog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts && posts.length > 0 ? (
                  posts.map((post) => {
                    const category = categories?.find(c => c.id === post.categoryId);
                    return (
                      <TableRow key={post.id}>
                        <TableCell>{post.id}</TableCell>
                        <TableCell className="font-medium max-w-xs truncate">{post.title}</TableCell>
                        <TableCell>{category?.name || 'Uncategorized'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            post.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {post.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {post.publishedAt 
                            ? new Date(post.publishedAt).toLocaleDateString() 
                            : new Date(post.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePublishStatus(post)}
                              title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                            >
                              {post.status === 'published' ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(post)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteModal(post)}
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
                      No blog posts found. Click the "New Blog Post" button to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Edit/Create Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentPost ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
              <DialogDescription>
                {currentPost ? 'Update the blog post details' : 'Fill in the details to create a new blog post'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="content" className="mt-4">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
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
                      <div className="flex gap-2">
                        <Input
                          id="slug"
                          name="slug"
                          value={formData.slug}
                          onChange={handleInputChange}
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateSlug}
                          className="shrink-0"
                        >
                          Generate
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        The slug is used in the URL and must be unique.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        name="excerpt"
                        value={formData.excerpt}
                        onChange={handleInputChange}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        A short summary that appears in blog listings. Optional.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        rows={12}
                        required
                        className="min-h-64"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        You can use HTML in the content.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="settings" className="space-y-4 py-4">
                  <div className="grid gap-4">
                    <div>
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
                    <div>
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="comma, separated, tags"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Separate tags with commas
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="coverImage">Cover Image URL</Label>
                      <Input
                        id="coverImage"
                        name="coverImage"
                        value={formData.coverImage}
                        onChange={handleInputChange}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleSelectChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only published posts will be visible on the blog
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
                        SEO title for the post. Leave blank to use the main title.
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
                        SEO description. Recommended length is 150-160 characters.
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
                  {currentPost ? 'Save Changes' : 'Create Post'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Blog Post</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the blog post.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>
                Are you sure you want to delete the blog post "{currentPost?.title}"?
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

export default Blog;