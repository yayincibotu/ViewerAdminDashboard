import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle, Save, Trash2, Plus, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/dashboard/AdminLayout';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { SystemConfig, EmailTemplate, IpRestriction } from '@shared/schema';

// Tab component for different config categories
const ConfigTab: React.FC<{
  category: string;
  configs: SystemConfig[];
  isLoading: boolean;
  onSave: (id: number, value: string) => void;
}> = ({ category, configs, isLoading, onSave }) => {
  const filteredConfigs = configs.filter(config => config.category === category);
  
  const handleSave = (id: number, value: string) => {
    onSave(id, value);
  };
  
  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredConfigs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No configuration items found in this category.</div>
      ) : (
        filteredConfigs.map(config => (
          <ConfigItem 
            key={config.id} 
            config={config} 
            onSave={handleSave}
          />
        ))
      )}
    </div>
  );
};

// Individual configuration item
const ConfigItem: React.FC<{
  config: SystemConfig;
  onSave: (id: number, value: string) => void;
}> = ({ config, onSave }) => {
  const [value, setValue] = useState(config.value);
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSave = () => {
    onSave(config.id, value);
    setIsEditing(false);
  };
  
  const isMultiline = config.type === 'text' || config.value.length > 100;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{config.name}</CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          isMultiline ? (
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={5}
              className="font-mono text-sm"
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={config.type === 'number' ? 'font-mono' : ''}
            />
          )
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className="p-2 border rounded-md hover:bg-accent cursor-pointer min-h-[40px]"
          >
            {isMultiline ? (
              <pre className="whitespace-pre-wrap text-sm">{value}</pre>
            ) : (
              <span>{value}</span>
            )}
          </div>
        )}
      </CardContent>
      {isEditing && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => {
            setValue(config.value);
            setIsEditing(false);
          }}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </CardFooter>
      )}
    </Card>
  );
};

// Email Template Management
const EmailTemplateManager: React.FC = () => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  const {
    data: templates = [],
    isLoading,
    refetch
  } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/admin/email-templates'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/email-templates');
      return res.json();
    }
  });
  
  const updateTemplateMutation = useMutation({
    mutationFn: async (template: Partial<EmailTemplate>) => {
      if (!template.id) return null;
      const res = await apiRequest('PATCH', `/api/admin/email-templates/${template.id}`, template);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Email template updated successfully',
      });
      refetch();
      setEditMode(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update email template',
        variant: 'destructive',
      });
    }
  });
  
  const createTemplateMutation = useMutation({
    mutationFn: async (template: Omit<EmailTemplate, 'id'>) => {
      const res = await apiRequest('POST', '/api/admin/email-templates', template);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Email template created successfully',
      });
      refetch();
      setEditMode(false);
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create email template',
        variant: 'destructive',
      });
    }
  });
  
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/email-templates/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Email template deleted successfully',
      });
      refetch();
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete email template',
        variant: 'destructive',
      });
    }
  });
  
  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;
    
    if (selectedTemplate.id) {
      updateTemplateMutation.mutate(selectedTemplate);
    } else {
      createTemplateMutation.mutate(selectedTemplate as Omit<EmailTemplate, 'id'>);
    }
  };
  
  const handleNewTemplate = () => {
    setSelectedTemplate({
      name: 'New Template',
      type: 'welcome',
      subject: '',
      htmlContent: '',
      textContent: '',
      isActive: true,
      lastUpdatedBy: 1, // Assuming admin user ID is 1
      createdAt: new Date(),
      updatedAt: new Date()
    } as EmailTemplate);
    setEditMode(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Templates</h2>
        <Button onClick={handleNewTemplate} className="flex items-center gap-2">
          <Plus size={16} /> Add Template
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1 border rounded-lg p-4 space-y-4 max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No email templates found.</div>
          ) : (
            <div className="space-y-2">
              {templates.map(template => (
                <div 
                  key={template.id} 
                  className={`p-3 rounded-md cursor-pointer ${selectedTemplate?.id === template.id ? 'bg-primary text-white' : 'hover:bg-accent'}`}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setEditMode(false);
                  }}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs opacity-70">{template.type}</div>
                  <div className="flex items-center mt-1">
                    <div className={`h-2 w-2 rounded-full mr-2 ${template.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs">{template.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="col-span-1 md:col-span-3 border rounded-lg p-6">
          {!selectedTemplate ? (
            <div className="text-center py-12 text-muted-foreground">
              Select a template to view or edit its details, or create a new one.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{editMode ? 'Edit Template' : 'Template Details'}</h3>
                <div className="space-x-2">
                  {!editMode ? (
                    <>
                      <Button variant="outline" onClick={() => setEditMode(true)}>Edit</Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the email template.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => selectedTemplate.id && deleteTemplateMutation.mutate(selectedTemplate.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => {
                        setEditMode(false);
                        refetch();
                      }}>Cancel</Button>
                      <Button 
                        onClick={handleSaveTemplate}
                        disabled={updateTemplateMutation.isPending || createTemplateMutation.isPending}
                      >
                        {(updateTemplateMutation.isPending || createTemplateMutation.isPending) && (
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                {editMode ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input
                          id="template-name"
                          value={selectedTemplate.name}
                          onChange={(e) => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="template-type">Template Type</Label>
                        <Input
                          id="template-type"
                          value={selectedTemplate.type}
                          onChange={(e) => setSelectedTemplate({...selectedTemplate, type: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-subject">Subject</Label>
                      <Input
                        id="template-subject"
                        value={selectedTemplate.subject}
                        onChange={(e) => setSelectedTemplate({...selectedTemplate, subject: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-html">HTML Content</Label>
                      <Textarea
                        id="template-html"
                        rows={10}
                        className="font-mono"
                        value={selectedTemplate.htmlContent}
                        onChange={(e) => setSelectedTemplate({...selectedTemplate, htmlContent: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-text">Text Content</Label>
                      <Textarea
                        id="template-text"
                        rows={5}
                        value={selectedTemplate.textContent}
                        onChange={(e) => setSelectedTemplate({...selectedTemplate, textContent: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="template-active"
                        checked={selectedTemplate.isActive}
                        onCheckedChange={(checked) => setSelectedTemplate({...selectedTemplate, isActive: checked})}
                      />
                      <Label htmlFor="template-active">Active</Label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Template Name</Label>
                        <div className="font-medium mt-1">{selectedTemplate.name}</div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Template Type</Label>
                        <div className="font-medium mt-1">{selectedTemplate.type}</div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Status</Label>
                        <div className="flex items-center mt-1">
                          <div className={`h-2 w-2 rounded-full mr-2 ${selectedTemplate.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span>{selectedTemplate.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Last Updated</Label>
                        <div className="font-medium mt-1">
                          {new Date(selectedTemplate.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground">Subject</Label>
                      <div className="mt-1 p-2 border rounded-md">{selectedTemplate.subject}</div>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground">HTML Content</Label>
                      <div className="mt-1 p-2 border rounded-md bg-slate-50 font-mono text-sm max-h-[200px] overflow-y-auto">
                        <pre className="whitespace-pre-wrap">{selectedTemplate.htmlContent}</pre>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground">Text Content</Label>
                      <div className="mt-1 p-2 border rounded-md bg-slate-50 max-h-[100px] overflow-y-auto">
                        <pre className="whitespace-pre-wrap">{selectedTemplate.textContent}</pre>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// IP Restriction Management
const IPRestrictionManager: React.FC = () => {
  const { toast } = useToast();
  const [selectedRestriction, setSelectedRestriction] = useState<IpRestriction | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  const {
    data: restrictions = [],
    isLoading,
    refetch
  } = useQuery<IpRestriction[]>({
    queryKey: ['/api/admin/ip-restrictions'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/ip-restrictions');
      return res.json();
    }
  });
  
  const updateRestrictionMutation = useMutation({
    mutationFn: async (restriction: Partial<IpRestriction>) => {
      if (!restriction.id) return null;
      const res = await apiRequest('PATCH', `/api/admin/ip-restrictions/${restriction.id}`, restriction);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'IP restriction updated successfully',
      });
      refetch();
      setEditMode(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update IP restriction',
        variant: 'destructive',
      });
    }
  });
  
  const createRestrictionMutation = useMutation({
    mutationFn: async (restriction: Omit<IpRestriction, 'id'>) => {
      const res = await apiRequest('POST', '/api/admin/ip-restrictions', restriction);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'IP restriction created successfully',
      });
      refetch();
      setEditMode(false);
      setSelectedRestriction(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create IP restriction',
        variant: 'destructive',
      });
    }
  });
  
  const deleteRestrictionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/ip-restrictions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'IP restriction deleted successfully',
      });
      refetch();
      setSelectedRestriction(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete IP restriction',
        variant: 'destructive',
      });
    }
  });
  
  const handleSaveRestriction = () => {
    if (!selectedRestriction) return;
    
    if (selectedRestriction.id) {
      updateRestrictionMutation.mutate(selectedRestriction);
    } else {
      createRestrictionMutation.mutate(selectedRestriction as Omit<IpRestriction, 'id'>);
    }
  };
  
  const handleNewRestriction = () => {
    setSelectedRestriction({
      ipAddress: '',
      type: 'blacklist',
      reason: '',
      expiresAt: null,
      createdBy: 1, // Assuming admin user ID is 1
      createdAt: new Date(),
      updatedAt: new Date()
    } as IpRestriction);
    setEditMode(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">IP Restrictions</h2>
        <Button onClick={handleNewRestriction} className="flex items-center gap-2">
          <Plus size={16} /> Add Restriction
        </Button>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">IP Address</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-left">Expires</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center">
                  <LoaderCircle className="h-8 w-8 animate-spin text-primary mx-auto" />
                </td>
              </tr>
            ) : restrictions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No IP restrictions found.
                </td>
              </tr>
            ) : (
              restrictions.map(restriction => (
                <tr key={restriction.id} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-mono">{restriction.ipAddress}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      restriction.type === 'blacklist' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {restriction.type}
                    </span>
                  </td>
                  <td className="p-3 max-w-xs truncate">{restriction.reason}</td>
                  <td className="p-3">
                    {restriction.expiresAt 
                      ? new Date(restriction.expiresAt).toLocaleDateString() 
                      : 'Never'}
                  </td>
                  <td className="p-3">{new Date(restriction.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedRestriction(restriction);
                          setEditMode(true);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-4 w-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                          />
                        </svg>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-500 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently remove the IP restriction for {restriction.ipAddress}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteRestrictionMutation.mutate(restriction.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {editMode && selectedRestriction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              {selectedRestriction.id ? 'Edit IP Restriction' : 'Add IP Restriction'}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ip-address">IP Address</Label>
                  <Input
                    id="ip-address"
                    placeholder="192.168.1.1"
                    className="font-mono"
                    value={selectedRestriction.ipAddress}
                    onChange={(e) => setSelectedRestriction({...selectedRestriction, ipAddress: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restriction-type">Restriction Type</Label>
                  <Select 
                    value={selectedRestriction.type}
                    onValueChange={(value) => setSelectedRestriction({...selectedRestriction, type: value})}
                  >
                    <SelectTrigger id="restriction-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blacklist">Blacklist</SelectItem>
                      <SelectItem value="whitelist">Whitelist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="restriction-reason">Reason</Label>
                <Textarea
                  id="restriction-reason"
                  placeholder="Reason for restriction"
                  value={selectedRestriction.reason || ''}
                  onChange={(e) => setSelectedRestriction({...selectedRestriction, reason: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiration-date">Expiration Date (Optional)</Label>
                <Input
                  id="expiration-date"
                  type="date"
                  value={selectedRestriction.expiresAt 
                    ? new Date(selectedRestriction.expiresAt).toISOString().split('T')[0]
                    : ''
                  }
                  onChange={(e) => setSelectedRestriction({
                    ...selectedRestriction, 
                    expiresAt: e.target.value ? new Date(e.target.value) : null
                  })}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditMode(false);
                  setSelectedRestriction(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveRestriction}
                disabled={updateRestrictionMutation.isPending || createRestrictionMutation.isPending}
              >
                {(updateRestrictionMutation.isPending || createRestrictionMutation.isPending) && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Settings page component
const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  
  const { 
    data: configs = [], 
    isLoading,
    refetch 
  } = useQuery<SystemConfig[]>({
    queryKey: ['/api/admin/system-configs'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/system-configs');
      return res.json();
    }
  });
  
  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, value }: { id: number, value: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/system-configs/${id}`, { value });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'System configuration updated successfully',
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update system configuration',
        variant: 'destructive',
      });
    }
  });
  
  const handleSaveConfig = (id: number, value: string) => {
    updateConfigMutation.mutate({ id, value });
  };
  
  // Get unique categories
  const categories = [...new Set(configs.map(config => config.category))];
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">System Settings</h1>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6">
            {/* System Config tabs */}
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </TabsTrigger>
            ))}
            <TabsTrigger value="email-templates">Email Templates</TabsTrigger>
            <TabsTrigger value="ip-restrictions">IP Restrictions</TabsTrigger>
          </TabsList>
          
          {/* System Config tab contents */}
          {categories.map(category => (
            <TabsContent key={category} value={category} className="space-y-6">
              <ConfigTab 
                category={category}
                configs={configs}
                isLoading={isLoading}
                onSave={handleSaveConfig}
              />
            </TabsContent>
          ))}
          
          <TabsContent value="email-templates">
            <EmailTemplateManager />
          </TabsContent>
          
          <TabsContent value="ip-restrictions">
            <IPRestrictionManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;