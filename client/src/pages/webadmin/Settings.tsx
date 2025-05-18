import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle, Save, Trash2, Plus, CheckCircle, Info, ShieldAlert, MailCheck, Zap, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/dashboard/AdminLayout';
import AdminHeader from '@/components/dashboard/AdminHeader';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { SystemConfig, EmailTemplate, IpRestriction } from '@shared/schema';

// Individual configuration item component
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
  const isBooleanField = config.key.startsWith('is_') || 
    ['enabled', 'disabled', 'active', 'maintenance_mode', 'allow_registrations'].some(
      suffix => config.key.includes(suffix)
    );
  
  if (isBooleanField) {
    return (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">{config.name}</h4>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
          <Switch 
            checked={value === 'true'} 
            onCheckedChange={(checked) => {
              const newValue = checked ? 'true' : 'false';
              setValue(newValue);
              onSave(config.id, newValue);
            }} 
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label>{config.name}</Label>
        {isEditing && (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setValue(config.value);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        )}
      </div>
      {isEditing ? (
        isMultiline ? (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={5}
            className={`w-full ${config.type === 'code' ? 'font-mono text-sm' : ''}`}
            style={{ wordBreak: "break-word", minHeight: "120px" }}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type={config.type === 'number' ? 'number' : 'text'}
            className={`w-full ${config.type === 'number' ? 'font-mono' : ''}`}
            style={{ wordBreak: "break-word" }}
          />
        )
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className="p-2 border rounded-md hover:bg-accent cursor-pointer min-h-[40px] overflow-hidden"
        >
          {isMultiline ? (
            <pre className="whitespace-pre-wrap text-sm break-words overflow-hidden">{value || <span className="text-muted-foreground italic">No value set</span>}</pre>
          ) : (
            <span className="break-words overflow-hidden">{value || <span className="text-muted-foreground italic">No value set</span>}</span>
          )}
        </div>
      )}
      {config.description && !isEditing && (
        <p className="text-xs text-muted-foreground">{config.description}</p>
      )}
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [showNewIpRestrictionDialog, setShowNewIpRestrictionDialog] = useState(false);
  const [newEmailTemplate, setNewEmailTemplate] = useState<Partial<EmailTemplate>>({
    name: '',
    key: '',
    type: 'notification',
    subject: '',
    content: '',
  });
  const [newIpRestriction, setNewIpRestriction] = useState<Partial<IpRestriction>>({
    type: 'blacklist',
    ipAddress: '',
    comment: '',
  });
  
  // Fetch system configurations
  const {
    data: systemConfigs = [],
    isLoading,
    refetch
  } = useQuery<SystemConfig[]>({
    queryKey: ['/api/admin/system-configs'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/system-configs');
      return res.json();
    }
  });
  
  // Fetch email templates
  const {
    data: emailTemplates = [],
    isLoading: isEmailTemplatesLoading,
    refetch: refetchEmailTemplates
  } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/admin/email-templates'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/email-templates');
      return res.json();
    }
  });
  
  // Fetch IP restrictions
  const {
    data: ipRestrictions = [],
    isLoading: isIpRestrictionsLoading,
    refetch: refetchIpRestrictions
  } = useQuery<IpRestriction[]>({
    queryKey: ['/api/admin/ip-restrictions'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/ip-restrictions');
      return res.json();
    }
  });
  
  // Update system config mutation
  const updateSystemConfigMutation = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/system-configs/${id}`, { value });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Configuration updated successfully',
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update configuration',
        variant: 'destructive',
      });
    }
  });
  
  // Add/Update email template mutation
  const saveEmailTemplateMutation = useMutation({
    mutationFn: async (template: Partial<EmailTemplate>) => {
      if (template.id) {
        // Update existing template
        const res = await apiRequest('PATCH', `/api/admin/email-templates/${template.id}`, template);
        return res.json();
      } else {
        // Create new template
        const res = await apiRequest('POST', '/api/admin/email-templates', template);
        return res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Email template saved successfully',
      });
      refetchEmailTemplates();
      setShowNewTemplateDialog(false);
      setNewEmailTemplate({
        name: '',
        key: '',
        type: 'notification',
        subject: '',
        content: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save email template',
        variant: 'destructive',
      });
    }
  });
  
  // Delete email template mutation
  const deleteEmailTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/email-templates/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Email template deleted successfully',
      });
      refetchEmailTemplates();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete email template',
        variant: 'destructive',
      });
    }
  });
  
  // Add IP restriction mutation
  const addIpRestrictionMutation = useMutation({
    mutationFn: async (restriction: Partial<IpRestriction>) => {
      const res = await apiRequest('POST', '/api/admin/ip-restrictions', restriction);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'IP restriction added successfully',
      });
      refetchIpRestrictions();
      setShowNewIpRestrictionDialog(false);
      setNewIpRestriction({
        type: 'blacklist',
        ipAddress: '',
        comment: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add IP restriction',
        variant: 'destructive',
      });
    }
  });
  
  // Delete IP restriction mutation
  const deleteIpRestrictionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/ip-restrictions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'IP restriction deleted successfully',
      });
      refetchIpRestrictions();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete IP restriction',
        variant: 'destructive',
      });
    }
  });
  
  // Handle saving a config value
  const handleSaveConfig = (id: number, value: string) => {
    updateSystemConfigMutation.mutate({ id, value });
  };
  
  // Handle saving an email template
  const handleSaveEmailTemplate = (id: number, template: Partial<EmailTemplate>) => {
    saveEmailTemplateMutation.mutate({ ...template, id });
  };
  
  // Handle deleting an email template
  const handleDeleteEmailTemplate = (id: number) => {
    deleteEmailTemplateMutation.mutate(id);
  };
  
  // Handle adding an IP restriction
  const handleAddIpRestriction = () => {
    if (!newIpRestriction.ipAddress) {
      toast({
        title: 'Error',
        description: 'IP address is required',
        variant: 'destructive',
      });
      return;
    }
    addIpRestrictionMutation.mutate(newIpRestriction);
  };
  
  // Handle deleting an IP restriction
  const handleDeleteIpRestriction = (id: number) => {
    deleteIpRestrictionMutation.mutate(id);
  };
  
  // Generate a template key from name
  const generateTemplateKey = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  };
  
  // Sync Stripe Button component
  const SyncStripeButton: React.FC = () => {
    const { toast } = useToast();
    
    const syncMutation = useMutation({
      mutationFn: async () => {
        const res = await apiRequest('POST', '/api/admin/sync-stripe-plans');
        return res.json();
      },
      onSuccess: (data) => {
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message,
          });
          
          // Refresh subscription plans data
          queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
        } else {
          toast({
            title: 'Error',
            description: data.message,
            variant: 'destructive',
          });
        }
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to sync plans with Stripe',
          variant: 'destructive',
        });
      }
    });
    
    return (
      <Button 
        variant="default" 
        onClick={() => syncMutation.mutate()}
        disabled={syncMutation.isPending}
        className="gap-2"
      >
        {syncMutation.isPending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Sync Plans with Stripe
      </Button>
    );
  };

  // Update key when name changes
  useEffect(() => {
    if (newEmailTemplate.name && !newEmailTemplate.id) {
      setNewEmailTemplate(prev => ({
        ...prev,
        key: generateTemplateKey(prev.name || '')
      }));
    }
  }, [newEmailTemplate.name]);
  
  return (
    <AdminLayout>
      <AdminHeader 
        title="System Settings"
        description="Configure all aspects of your website and services"
        actions={
          <Button 
            variant="outline" 
            onClick={() => {
              refetch();
              refetchEmailTemplates();
              refetchIpRestrictions();
            }}
            className="flex items-center gap-2"
            disabled={isLoading || isEmailTemplatesLoading || isIpRestrictionsLoading}
          >
            <CheckCircle size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh All Settings
          </Button>
        }
      />
      <div className="p-6">
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Info size={16} />
              General
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Zap size={16} />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="mail" className="flex items-center gap-2">
              <MailCheck size={16} />
              Email Settings
            </TabsTrigger>
            <TabsTrigger value="email-templates" className="flex items-center gap-2">
              <MailCheck size={16} />
              Email Templates
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <ShieldAlert size={16} />
              Security
            </TabsTrigger>
            <TabsTrigger value="ip-restrictions" className="flex items-center gap-2">
              <ShieldAlert size={16} />
              IP Restrictions
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Zap size={16} />
              Integrations
            </TabsTrigger>
          </TabsList>
          
          {/* General settings tab */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Website Settings</CardTitle>
                  <CardDescription>Configure your website name, details and branding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {systemConfigs
                      .filter(config => config.category === 'general' && ['site_name', 'site_description', 'site_url'].includes(config.key))
                      .map(config => (
                        <ConfigItem 
                          key={config.id} 
                          config={config} 
                          onSave={handleSaveConfig}
                        />
                      ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {systemConfigs
                      .filter(config => config.category === 'general' && ['maintenance_mode', 'allow_registrations'].includes(config.key))
                      .map(config => (
                        <ConfigItem 
                          key={config.id} 
                          config={config} 
                          onSave={handleSaveConfig}
                        />
                      ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 gap-6">
                    {systemConfigs
                      .filter(config => config.category === 'general' && ['tos_content', 'privacy_policy_content'].includes(config.key))
                      .map(config => (
                        <ConfigItem 
                          key={config.id} 
                          config={config} 
                          onSave={handleSaveConfig}
                        />
                      ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Set your company details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {systemConfigs
                      .filter(config => config.category === 'general' && ['company_name', 'company_address', 'contact_email', 'contact_phone'].includes(config.key))
                      .map(config => (
                        <ConfigItem 
                          key={config.id} 
                          config={config} 
                          onSave={handleSaveConfig}
                        />
                      ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Social Media</CardTitle>
                  <CardDescription>Configure your social media profiles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {systemConfigs
                      .filter(config => config.category === 'general' && ['facebook_url', 'twitter_url', 'instagram_url', 'youtube_url', 'discord_url'].includes(config.key))
                      .map(config => (
                        <ConfigItem 
                          key={config.id} 
                          config={config} 
                          onSave={handleSaveConfig}
                        />
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* API Keys settings tab */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Keys</CardTitle>
                <CardDescription>API keys for third-party services and platforms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {systemConfigs
                    .filter(config => config.category === 'api')
                    .map(config => (
                      <ConfigItem 
                        key={config.id} 
                        config={config} 
                        onSave={handleSaveConfig}
                      />
                    ))}
                </div>
                
                <Separator className="my-6" />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Perplexity AI Integration</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use Perplexity AI for advanced SEO content generation. Automatically create optimized product descriptions, meta tags, and more.
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    {/* Perplexity API Key */}
                    <div className="w-full p-4 border rounded-md bg-secondary/10">
                      {systemConfigs
                        .filter(config => config.key === 'perplexity_api_key')
                        .map(config => (
                          <ConfigItem 
                            key={config.id} 
                            config={config} 
                            onSave={handleSaveConfig}
                          />
                        ))}
                    </div>
                    
                    {/* Test Perplexity API*/}
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={async () => {
                        try {
                          const res = await apiRequest('GET', '/api/perplexity/test');
                          const data = await res.json();
                          
                          if (data.success) {
                            toast({
                              title: 'Success',
                              description: 'Perplexity API connection successful!',
                            });
                          } else {
                            toast({
                              title: 'Error',
                              description: data.message || 'Failed to connect to Perplexity API',
                              variant: 'destructive',
                            });
                          }
                        } catch (error: any) {
                          toast({
                            title: 'Error',
                            description: error.message || 'Failed to test Perplexity API connection',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      <RefreshCw size={16} />
                      Test Perplexity API Connection
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Twitch Integration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {systemConfigs
                      .filter(config => config.category === 'twitch')
                      .map(config => (
                        <ConfigItem 
                          key={config.id} 
                          config={config} 
                          onSave={handleSaveConfig}
                        />
                      ))}
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Stripe Integration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {systemConfigs
                      .filter(config => config.category === 'stripe')
                      .map(config => (
                        <ConfigItem 
                          key={config.id} 
                          config={config} 
                          onSave={handleSaveConfig}
                        />
                      ))}
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">CoinPayments.net Integration</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Accept cryptocurrency payments through CoinPayments.net - supporting Bitcoin, Ethereum, Litecoin, and more.
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    {/* Enable/Disable CoinPayments */}
                    <div className="w-full p-4 border rounded-md bg-secondary/10">
                      {systemConfigs
                        .filter(config => config.key === 'coinpayments_enabled')
                        .map(config => (
                          <ConfigItem 
                            key={config.id} 
                            config={config} 
                            onSave={handleSaveConfig}
                          />
                        ))}
                    </div>
                    
                    {/* Accepted Cryptocurrencies */}
                    <div className="w-full p-4 border rounded-md bg-secondary/10">
                      {systemConfigs
                        .filter(config => config.key === 'coinpayments_accepted_coins')
                        .map(config => (
                          <ConfigItem 
                            key={config.id} 
                            config={config} 
                            onSave={handleSaveConfig}
                          />
                        ))}
                    </div>
                  </div>
                  
                  <h4 className="text-md font-medium mb-4">API Credentials</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {systemConfigs
                      .filter(config => config.category === 'crypto' && ['coinpayments_public_key', 'coinpayments_private_key', 'coinpayments_merchant_id', 'coinpayments_ipn_secret'].includes(config.key))
                      .map(config => (
                        <ConfigItem 
                          key={config.id} 
                          config={config} 
                          onSave={handleSaveConfig}
                        />
                      ))}
                  </div>
                  
                  <h4 className="text-md font-medium mt-6 mb-4">Additional Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {systemConfigs
                      .filter(config => config.category === 'crypto' && ['coinpayments_debug_email'].includes(config.key))
                      .map(config => (
                        <ConfigItem 
                          key={config.id} 
                          config={config} 
                          onSave={handleSaveConfig}
                        />
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Email Settings tab */}
          <TabsContent value="mail" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Service Configuration</CardTitle>
                <CardDescription>Configure your email service provider settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label>Email Provider</Label>
                    <Select 
                      defaultValue={
                        systemConfigs.find(c => c.key === 'mail_provider')?.value || 'mailjet'
                      }
                      onValueChange={(value) => {
                        const config = systemConfigs.find(c => c.key === 'mail_provider');
                        if (config) {
                          handleSaveConfig(config.id, value);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mailjet">Mailjet</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="smtp">Custom SMTP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {systemConfigs
                    .filter(config => config.category === 'mail')
                    .map(config => (
                      <ConfigItem 
                        key={config.id} 
                        config={config} 
                        onSave={handleSaveConfig}
                      />
                    ))}
                </div>
                
                <Separator className="my-6" />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Email Sending Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {systemConfigs
                      .filter(config => config.category === 'mail_options')
                      .map(config => (
                        <ConfigItem 
                          key={config.id} 
                          config={config} 
                          onSave={handleSaveConfig}
                        />
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Email Templates tab */}
          <TabsContent value="email-templates" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Email Templates</CardTitle>
                    <CardDescription>Manage email templates for user notifications and system messages</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewTemplateDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isEmailTemplatesLoading ? (
                  <div className="flex justify-center p-8">
                    <LoaderCircle className="animate-spin h-8 w-8 text-primary" />
                  </div>
                ) : emailTemplates.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {emailTemplates.map(template => (
                      <div key={template.id} className="border rounded-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-semibold">{template.name}</h3>
                            <p className="text-muted-foreground mt-1">
                              {template.description || <span className="italic">No description provided</span>}
                            </p>
                          </div>
                          <Badge variant="outline">{template.type}</Badge>
                        </div>
                        
                        <Separator />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label>Subject</Label>
                            <Input 
                              value={template.subject} 
                              onChange={(e) => {
                                const updatedTemplate = { ...template, subject: e.target.value };
                                handleSaveEmailTemplate(template.id, updatedTemplate);
                              }}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Template Key</Label>
                            <Input 
                              value={template.key} 
                              readOnly 
                              className="mt-2 bg-muted"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Content</Label>
                          <Textarea 
                            value={template.content} 
                            onChange={(e) => {
                              const updatedTemplate = { ...template, content: e.target.value };
                              handleSaveEmailTemplate(template.id, updatedTemplate);
                            }}
                            className="mt-2 min-h-[200px]"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Available variables: {"{username}"}, {"{verification_link}"}, {"{site_name}"}
                          </p>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 size={16} className="mr-2" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the email template "{template.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteEmailTemplate(template.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          <Button 
                            onClick={() => handleSaveEmailTemplate(template.id, template)} 
                            size="sm"
                          >
                            <Save size={16} className="mr-2" />
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-muted-foreground mb-4">No email templates found.</p>
                    <Button onClick={() => setShowNewTemplateDialog(true)}>
                      Add Your First Template
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Security settings tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security options for your application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {systemConfigs
                    .filter(config => config.category === 'security')
                    .map(config => (
                      <ConfigItem 
                        key={config.id} 
                        config={config} 
                        onSave={handleSaveConfig}
                      />
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* IP Restrictions tab */}
          <TabsContent value="ip-restrictions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>IP Restrictions</CardTitle>
                    <CardDescription>Manage IP address whitelists and blacklists</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewIpRestrictionDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Restriction
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isIpRestrictionsLoading ? (
                  <div className="flex justify-center p-8">
                    <LoaderCircle className="animate-spin h-8 w-8 text-primary" />
                  </div>
                ) : ipRestrictions.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <Card className="shadow-none border-2 border-destructive/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Badge variant="destructive">Blacklist</Badge>
                            Blocked IP Addresses
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {ipRestrictions
                              .filter(r => r.type === 'blacklist')
                              .map(restriction => (
                                <div 
                                  key={restriction.id} 
                                  className="flex items-center justify-between p-3 border rounded-md bg-card"
                                >
                                  <div>
                                    <p className="font-mono">{restriction.ipAddress}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {restriction.comment || <span className="italic">No comment</span>}
                                    </p>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDeleteIpRestriction(restriction.id)}
                                  >
                                    <Trash2 size={16} className="text-destructive" />
                                  </Button>
                                </div>
                              ))}
                            
                            {ipRestrictions.filter(r => r.type === 'blacklist').length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-2">
                                No IP addresses blacklisted
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="shadow-none border-2 border-primary/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Badge variant="default">Whitelist</Badge>
                            Allowed IP Addresses
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {ipRestrictions
                              .filter(r => r.type === 'whitelist')
                              .map(restriction => (
                                <div 
                                  key={restriction.id} 
                                  className="flex items-center justify-between p-3 border rounded-md bg-card"
                                >
                                  <div>
                                    <p className="font-mono">{restriction.ipAddress}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {restriction.comment || <span className="italic">No comment</span>}
                                    </p>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDeleteIpRestriction(restriction.id)}
                                  >
                                    <Trash2 size={16} className="text-destructive" />
                                  </Button>
                                </div>
                              ))}
                            
                            {ipRestrictions.filter(r => r.type === 'whitelist').length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-2">
                                No IP addresses whitelisted
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-md">
                      <p className="text-sm">
                        <strong>Note:</strong> When whitelist mode is active, only IPs in the whitelist will be allowed access.
                        When blacklist mode is active, IPs in the blacklist will be blocked from accessing the site.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-muted-foreground mb-4">No IP restrictions found.</p>
                    <Button onClick={() => setShowNewIpRestrictionDialog(true)}>
                      Add Your First Restriction
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Integrations tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Stripe Integration</CardTitle>
                  <CardDescription>Manage Stripe payment integration and synchronize subscription plans</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {systemConfigs
                      .filter(config => config.category === 'stripe' && ['stripe_api_key', 'stripe_webhook_secret'].includes(config.key))
                      .map(config => (
                        <ConfigItem 
                          key={config.id} 
                          config={config} 
                          onSave={handleSaveConfig}
                        />
                      ))}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Synchronize Plans with Stripe</h3>
                    <p className="text-muted-foreground mb-4">
                      This will create or update Stripe products and prices based on your subscription plans.
                      Make sure your Stripe API key is configured correctly before synchronizing.
                    </p>
                    <SyncStripeButton />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>CoinPayments Integration</CardTitle>
                  <CardDescription>Manage cryptocurrency payment settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {systemConfigs
                      .filter(config => config.category === 'coinpayments' && ['coinpayments_api_key', 'coinpayments_secret_key', 'coinpayments_merchant_id', 'accepted_coins'].includes(config.key))
                      .map(config => (
                        <ConfigItem 
                          key={config.id} 
                          config={config} 
                          onSave={handleSaveConfig}
                        />
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* New Email Template Dialog */}
      <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add New Email Template</DialogTitle>
            <DialogDescription>
              Create a new email template for system notifications.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-name" className="text-right">
                Name
              </Label>
              <Input
                id="template-name"
                value={newEmailTemplate.name}
                onChange={(e) => setNewEmailTemplate({ ...newEmailTemplate, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-key" className="text-right">
                Key
              </Label>
              <Input
                id="template-key"
                value={newEmailTemplate.key}
                onChange={(e) => setNewEmailTemplate({ ...newEmailTemplate, key: e.target.value })}
                className="col-span-3"
                disabled={!!newEmailTemplate.name}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-type" className="text-right">
                Type
              </Label>
              <Select
                value={newEmailTemplate.type}
                onValueChange={(value) => setNewEmailTemplate({ ...newEmailTemplate, type: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select template type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="verification">Verification</SelectItem>
                  <SelectItem value="password_reset">Password Reset</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-subject" className="text-right">
                Subject
              </Label>
              <Input
                id="template-subject"
                value={newEmailTemplate.subject}
                onChange={(e) => setNewEmailTemplate({ ...newEmailTemplate, subject: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <Label htmlFor="template-content" className="text-right">
                Content
              </Label>
              <Textarea
                id="template-content"
                value={newEmailTemplate.content}
                onChange={(e) => setNewEmailTemplate({ ...newEmailTemplate, content: e.target.value })}
                className="col-span-3"
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTemplateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => saveEmailTemplateMutation.mutate(newEmailTemplate)}
              disabled={saveEmailTemplateMutation.isPending || !newEmailTemplate.name || !newEmailTemplate.subject}
            >
              {saveEmailTemplateMutation.isPending && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New IP Restriction Dialog */}
      <Dialog open={showNewIpRestrictionDialog} onOpenChange={setShowNewIpRestrictionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add IP Restriction</DialogTitle>
            <DialogDescription>
              Add an IP address to the whitelist or blacklist.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="restriction-type" className="text-right">
                Type
              </Label>
              <Select
                value={newIpRestriction.type}
                onValueChange={(value) => setNewIpRestriction({ ...newIpRestriction, type: value as 'blacklist' | 'whitelist' })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select restriction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blacklist">Blacklist (Block)</SelectItem>
                  <SelectItem value="whitelist">Whitelist (Allow)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ip-address" className="text-right">
                IP Address
              </Label>
              <Input
                id="ip-address"
                value={newIpRestriction.ipAddress}
                onChange={(e) => setNewIpRestriction({ ...newIpRestriction, ipAddress: e.target.value })}
                placeholder="e.g. 192.168.1.1"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="restriction-comment" className="text-right">
                Comment
              </Label>
              <Input
                id="restriction-comment"
                value={newIpRestriction.comment || ''}
                onChange={(e) => setNewIpRestriction({ ...newIpRestriction, comment: e.target.value })}
                placeholder="Optional"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewIpRestrictionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddIpRestriction}
              disabled={addIpRestrictionMutation.isPending || !newIpRestriction.ipAddress}
            >
              {addIpRestrictionMutation.isPending && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Restriction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default SettingsPage;