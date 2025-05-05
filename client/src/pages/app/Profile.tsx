import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import UserSidebar from '@/components/dashboard/UserSidebar';
import Header from '@/components/dashboard/Header';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { 
  UserCircle, 
  Lock, 
  Bell, 
  Shield, 
  Settings, 
  Mail, 
  Github, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Upload, 
  Loader2, 
  Check
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Form states
  const [profile, setProfile] = useState({
    fullName: user?.username || '',
    displayName: user?.username || '',
    email: user?.email || '',
    bio: 'Professional Twitch streamer with a passion for gaming and entertainment.',
    location: 'San Francisco, CA',
    website: 'https://twitch.tv/example',
    twitterHandle: '@example',
    discordUsername: 'example#1234',
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
    sessionTimeout: '30',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    browser: true,
    payments: true,
    updates: true,
    marketing: false,
  });

  // Simulated profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 1500);
      });
    },
    onSuccess: () => {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Simulated security settings update mutation
  const updateSecurityMutation = useMutation({
    mutationFn: async (securityData) => {
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 1500);
      });
    },
    onSuccess: () => {
      toast({
        title: 'Security settings updated',
        description: 'Your security preferences have been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Simulated notifications update mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (notificationsData) => {
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 1500);
      });
    },
    onSuccess: () => {
      toast({
        title: 'Notification preferences updated',
        description: 'Your notification preferences have been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle profile form submission
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profile);
  };

  // Handle security form submission
  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSecurityMutation.mutate(securitySettings);
  };

  // Handle notifications form submission
  const handleNotificationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotificationsMutation.mutate(notifications);
  };

  // Handle profile image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      <UserSidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header />
        <div className="container mx-auto py-6 px-4">
          <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile information and manage your account settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit}>
                    <div className="space-y-6">
                      {/* Profile Picture */}
                      <div className="flex flex-col items-center md:flex-row md:items-start gap-6 pb-6 border-b">
                        <div className="flex flex-col items-center gap-4">
                          <Avatar className="h-24 w-24">
                            <AvatarImage src={profileImage || undefined} />
                            <AvatarFallback className="text-lg">
                              {user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-center">
                            <Label
                              htmlFor="picture"
                              className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 rounded-md py-2 px-4 text-sm font-medium flex items-center gap-2"
                            >
                              <Upload className="h-4 w-4" />
                              Upload new image
                            </Label>
                            <Input
                              id="picture"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageChange}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              JPG, GIF or PNG. Max size of 2MB
                            </p>
                          </div>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="fullName">Full Name</Label>
                              <Input
                                id="fullName"
                                value={profile.fullName}
                                onChange={(e) =>
                                  setProfile({ ...profile, fullName: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="displayName">Display Name</Label>
                              <Input
                                id="displayName"
                                value={profile.displayName}
                                onChange={(e) =>
                                  setProfile({ ...profile, displayName: e.target.value })
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={profile.email}
                              onChange={(e) =>
                                setProfile({ ...profile, email: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                              id="bio"
                              value={profile.bio}
                              onChange={(e) =>
                                setProfile({ ...profile, bio: e.target.value })
                              }
                              rows={4}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-lg">Additional Information</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={profile.location}
                              onChange={(e) =>
                                setProfile({ ...profile, location: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                              id="website"
                              value={profile.website}
                              onChange={(e) =>
                                setProfile({ ...profile, website: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Social Links */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-lg">Social Links</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="twitter"
                              className="flex items-center gap-2"
                            >
                              <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                              Twitter
                            </Label>
                            <Input
                              id="twitter"
                              value={profile.twitterHandle}
                              onChange={(e) =>
                                setProfile({
                                  ...profile,
                                  twitterHandle: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="discord"
                              className="flex items-center gap-2"
                            >
                              <svg
                                className="h-4 w-4 text-[#5865F2]"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.39-.444.885-.608 1.28a18.566 18.566 0 0 0-5.487 0 12.217 12.217 0 0 0-.617-1.28.077.077 0 0 0-.079-.036A19.457 19.457 0 0 0 3.677 4.492a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 19.626 19.626 0 0 0 5.919 2.98.078.078 0 0 0 .084-.026 13.458 13.458 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.006 13.006 0 0 1-1.872-.883.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.289a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.198.372.29a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.882a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.521 19.521 0 0 0 5.92-2.98.076.076 0 0 0 .032-.053 19.014 19.014 0 0 0-.6-13.442.069.069 0 0 0-.032-.028l.031-.002z"/>
                              </svg>
                              Discord
                            </Label>
                            <Input
                              id="discord"
                              value={profile.discordUsername}
                              onChange={(e) =>
                                setProfile({
                                  ...profile,
                                  discordUsername: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : updateProfileMutation.isSuccess ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Saved
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your security settings and protect your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSecuritySubmit}>
                    <div className="space-y-6">
                      {/* Change Password */}
                      <div className="space-y-4 pb-6 border-b">
                        <h3 className="font-medium text-lg">Change Password</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input id="currentPassword" type="password" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input id="newPassword" type="password" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input id="confirmPassword" type="password" />
                          </div>
                          <Button type="button" variant="outline">
                            Change Password
                          </Button>
                        </div>
                      </div>

                      {/* Two-Factor Authentication */}
                      <div className="space-y-4 pb-6 border-b">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-lg">Two-Factor Authentication</h3>
                            <p className="text-sm text-gray-500">
                              Add an extra layer of security to your account
                            </p>
                          </div>
                          <Switch
                            checked={securitySettings.twoFactorEnabled}
                            onCheckedChange={(checked) =>
                              setSecuritySettings({
                                ...securitySettings,
                                twoFactorEnabled: checked,
                              })
                            }
                          />
                        </div>
                        {securitySettings.twoFactorEnabled && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-md">
                            <h4 className="font-medium">
                              Two-factor authentication is enabled
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              We'll ask for a code in addition to your password when you log in.
                            </p>
                            <div className="mt-4">
                              <Button variant="outline" size="sm">
                                Configure 2FA
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Login Notifications */}
                      <div className="space-y-4 pb-6 border-b">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-lg">Login Notifications</h3>
                            <p className="text-sm text-gray-500">
                              We'll let you know when someone logs into your account
                            </p>
                          </div>
                          <Switch
                            checked={securitySettings.loginNotifications}
                            onCheckedChange={(checked) =>
                              setSecuritySettings({
                                ...securitySettings,
                                loginNotifications: checked,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* Session Timeout */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-lg">Session Timeout</h3>
                        <p className="text-sm text-gray-500">
                          Set how long you can be inactive before being automatically signed out
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            type="button"
                            variant={
                              securitySettings.sessionTimeout === "15"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              setSecuritySettings({
                                ...securitySettings,
                                sessionTimeout: "15",
                              })
                            }
                          >
                            15 minutes
                          </Button>
                          <Button
                            type="button"
                            variant={
                              securitySettings.sessionTimeout === "30"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              setSecuritySettings({
                                ...securitySettings,
                                sessionTimeout: "30",
                              })
                            }
                          >
                            30 minutes
                          </Button>
                          <Button
                            type="button"
                            variant={
                              securitySettings.sessionTimeout === "60"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              setSecuritySettings({
                                ...securitySettings,
                                sessionTimeout: "60",
                              })
                            }
                          >
                            1 hour
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button
                        type="submit"
                        disabled={updateSecurityMutation.isPending}
                      >
                        {updateSecurityMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : updateSecurityMutation.isSuccess ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Saved
                          </>
                        ) : (
                          "Save Security Settings"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Manage how and when you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleNotificationsSubmit} className="space-y-8">
                    {/* Email Notifications */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Email Notifications</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="email-notifications">All Email Notifications</Label>
                            <p className="text-sm text-gray-500">
                              Receive emails for all notifications
                            </p>
                          </div>
                          <Switch
                            id="email-notifications"
                            checked={notifications.email}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, email: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Browser Notifications */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Browser Notifications</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="browser-notifications">
                              Push Notifications
                            </Label>
                            <p className="text-sm text-gray-500">
                              Receive push notifications in your browser
                            </p>
                          </div>
                          <Switch
                            id="browser-notifications"
                            checked={notifications.browser}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, browser: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* SMS Notifications */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">SMS Notifications</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="sms-notifications">
                              Text Message Notifications
                            </Label>
                            <p className="text-sm text-gray-500">
                              Receive notifications via SMS
                            </p>
                          </div>
                          <Switch
                            id="sms-notifications"
                            checked={notifications.sms}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, sms: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notification Categories */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Notification Categories</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="payment-notifications">Payment Updates</Label>
                            <p className="text-sm text-gray-500">
                              Get notified about payments and billing
                            </p>
                          </div>
                          <Switch
                            id="payment-notifications"
                            checked={notifications.payments}
                            onCheckedChange={(checked) =>
                              setNotifications({
                                ...notifications,
                                payments: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="product-notifications">
                              Product Updates
                            </Label>
                            <p className="text-sm text-gray-500">
                              Get notified about new features and improvements
                            </p>
                          </div>
                          <Switch
                            id="product-notifications"
                            checked={notifications.updates}
                            onCheckedChange={(checked) =>
                              setNotifications({
                                ...notifications,
                                updates: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="marketing-notifications">
                              Marketing Communications
                            </Label>
                            <p className="text-sm text-gray-500">
                              Receive emails about new products, offers, and promotions
                            </p>
                          </div>
                          <Switch
                            id="marketing-notifications"
                            checked={notifications.marketing}
                            onCheckedChange={(checked) =>
                              setNotifications({
                                ...notifications,
                                marketing: checked,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={updateNotificationsMutation.isPending}
                      >
                        {updateNotificationsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : updateNotificationsMutation.isSuccess ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Saved
                          </>
                        ) : (
                          "Save Notification Preferences"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;