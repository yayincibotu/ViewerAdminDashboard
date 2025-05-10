import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
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
import {
  Badge
} from "@/components/ui/badge";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/dashboard/AdminLayout';
import { ContactMessage } from '@shared/schema';
import { Loader2, Trash2, Eye, CheckCircle2, MailOpen } from 'lucide-react';

const ContactMessages: React.FC = () => {
  const { toast } = useToast();
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<ContactMessage | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  
  // Fetch contact messages
  const { data: messages, isLoading, isError, error } = useQuery<ContactMessage[]>({
    queryKey: ['/api/admin/contact-messages', filterStatus],
    queryFn: async () => {
      const url = filterStatus 
        ? `/api/admin/contact-messages?status=${filterStatus}`
        : '/api/admin/contact-messages';
      const res = await apiRequest('GET', url);
      return res.json();
    }
  });
  
  // Update message status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest('POST', `/api/admin/contact-messages/${id}/update-status`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Message status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contact-messages'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update message status',
        variant: 'destructive',
      });
    }
  });
  
  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/contact-messages/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Message deleted successfully',
      });
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contact-messages'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete message',
        variant: 'destructive',
      });
    }
  });
  
  // Handle view message
  const viewMessage = (message: ContactMessage) => {
    setCurrentMessage(message);
    setIsViewModalOpen(true);
    
    // If the message is unread, mark it as read
    if (message.status === 'unread') {
      updateStatusMutation.mutate({ id: message.id, status: 'read' });
    }
  };
  
  // Open delete confirmation modal
  const openDeleteModal = (message: ContactMessage) => {
    setCurrentMessage(message);
    setIsDeleteModalOpen(true);
  };
  
  // Handle mark as replied
  const markAsReplied = (message: ContactMessage) => {
    updateStatusMutation.mutate({ id: message.id, status: 'replied' });
  };
  
  // Handle delete confirmation
  const handleDelete = () => {
    if (currentMessage) {
      deleteMutation.mutate(currentMessage.id);
    }
  };
  
  // Handle status filter change
  const handleFilterChange = (value: string) => {
    setFilterStatus(value === 'all' ? null : value);
  };
  
  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return <Badge variant="destructive">Unread</Badge>;
      case 'read':
        return <Badge variant="secondary">Read</Badge>;
      case 'replied':
        return <Badge variant="default">Replied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
            <p>Error loading contact messages: {(error as Error)?.message || 'Unknown error'}</p>
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
            <h1 className="text-3xl font-bold">Contact Messages</h1>
            <p className="text-muted-foreground">Manage messages submitted through the contact form</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Select
              value={filterStatus || 'all'}
              onValueChange={handleFilterChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Contact Messages</CardTitle>
            <CardDescription>
              Messages sent through the website contact form. Click on a message to view its details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages && messages.length > 0 ? (
                  messages.map((message) => (
                    <TableRow key={message.id} className={message.status === 'unread' ? 'bg-slate-50' : ''}>
                      <TableCell>{message.id}</TableCell>
                      <TableCell className="font-medium">{message.name}</TableCell>
                      <TableCell>{message.email}</TableCell>
                      <TableCell className="max-w-xs truncate">{message.subject}</TableCell>
                      <TableCell>{formatDate(message.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(message.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewMessage(message)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {message.status !== 'replied' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsReplied(message)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteModal(message)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No contact messages found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* View Message Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Contact Message</DialogTitle>
              <DialogDescription>
                Message from {currentMessage?.name} ({currentMessage?.email})
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{currentMessage?.subject}</h3>
                  <p className="text-sm text-muted-foreground">
                    Received: {currentMessage && formatDate(currentMessage.createdAt)}
                  </p>
                </div>
                <div>{currentMessage && getStatusBadge(currentMessage.status)}</div>
              </div>
              
              <div className="border rounded-md p-4 bg-slate-50 mb-4">
                <p className="whitespace-pre-wrap">{currentMessage?.message}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Phone:</p>
                  <p>{currentMessage?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">IP Address:</p>
                  <p>{currentMessage?.ipAddress || 'Not recorded'}</p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
              
              {currentMessage?.status !== 'replied' && (
                <Button
                  onClick={() => {
                    if (currentMessage) {
                      markAsReplied(currentMessage);
                      setIsViewModalOpen(false);
                    }
                  }}
                >
                  <MailOpen className="mr-2 h-4 w-4" />
                  Mark as Replied
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Message</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the message.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>
                Are you sure you want to delete the message from "{currentMessage?.name}"?
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

export default ContactMessages;