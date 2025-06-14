// src/app/dashboard/settings/page.tsx - Settings management

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Database, 
  Palette, 
  Globe,
  Save,
  Loader2,
  Mail,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Youtube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { YouTubeAPIStatus } from '@/components/admin/YouTubeAPIStatus';

interface AppSettings {
  appName: string;
  appDescription: string;
  supportEmail: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maxFileUploadSize: number;
  allowedFileTypes: string[];
  defaultTheme: 'light' | 'dark' | 'auto';
  featuredContentLimit: number;
  cacheTimeout: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newContentNotification: boolean;
  userActivityNotification: boolean;
  systemAlertsNotification: boolean;
  weeklyReportsNotification: boolean;
  notificationEmail: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordRequirements: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { admin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // App Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: 'The Beacon Centre',
    appDescription: 'Raising shining lights through daily devotionals and sermons',
    supportEmail: 'support@beaconcentre.org',
    privacyPolicyUrl: 'https://beaconcentre.org/privacy',
    termsOfServiceUrl: 'https://beaconcentre.org/terms',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
    maxFileUploadSize: 100,
    allowedFileTypes: ['mp3', 'wav', 'm4a', 'jpg', 'png', 'webp'],
    defaultTheme: 'light',
    featuredContentLimit: 5,
    cacheTimeout: 3600,
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    newContentNotification: true,
    userActivityNotification: false,
    systemAlertsNotification: true,
    weeklyReportsNotification: true,
    notificationEmail: admin?.email || '',
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 86400, // 24 hours
    maxLoginAttempts: 5,
    passwordRequirements: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: { type: string; settings: any }) => {
      // In real implementation, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Settings Saved',
        description: `${data.type} settings have been updated successfully`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSaveSettings = (type: string, settings: any) => {
    saveSettingsMutation.mutate({ type, settings });
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would download a file
      const data = {
        exportDate: new Date().toISOString(),
        appSettings,
        notificationSettings,
        securitySettings,
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'beacon-centre-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Complete',
        description: 'Settings have been exported successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export settings',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearCache = async () => {
    try {
      // Simulate cache clearing
      await new Promise(resolve => setTimeout(resolve, 1000));
      queryClient.clear();
      
      toast({
        title: 'Cache Cleared',
        description: 'Application cache has been cleared successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear cache',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your application settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="mr-2 h-5 w-5" />
                Application Settings
              </CardTitle>
              <CardDescription>
                Configure basic application information and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input
                    id="appName"
                    value={appSettings.appName}
                    onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={appSettings.supportEmail}
                    onChange={(e) => setAppSettings({ ...appSettings, supportEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appDescription">Application Description</Label>
                <Textarea
                  id="appDescription"
                  value={appSettings.appDescription}
                  onChange={(e) => setAppSettings({ ...appSettings, appDescription: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="privacyUrl">Privacy Policy URL</Label>
                  <Input
                    id="privacyUrl"
                    value={appSettings.privacyPolicyUrl}
                    onChange={(e) => setAppSettings({ ...appSettings, privacyPolicyUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termsUrl">Terms of Service URL</Label>
                  <Input
                    id="termsUrl"
                    value={appSettings.termsOfServiceUrl}
                    onChange={(e) => setAppSettings({ ...appSettings, termsOfServiceUrl: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Application Behavior</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-gray-600">Disable public access to the app</p>
                    </div>
                    <Switch
                      checked={appSettings.maintenanceMode}
                      onCheckedChange={(checked) => setAppSettings({ ...appSettings, maintenanceMode: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow User Registration</Label>
                      <p className="text-sm text-gray-600">Enable new user sign-ups</p>
                    </div>
                    <Switch
                      checked={appSettings.allowRegistration}
                      onCheckedChange={(checked) => setAppSettings({ ...appSettings, allowRegistration: checked })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultTheme">Default Theme</Label>
                    <Select value={appSettings.defaultTheme} onValueChange={(value: 'light' | 'dark' | 'auto') => setAppSettings({ ...appSettings, defaultTheme: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="featuredLimit">Featured Content Limit</Label>
                    <Input
                      id="featuredLimit"
                      type="number"
                      min="1"
                      max="20"
                      value={appSettings.featuredContentLimit}
                      onChange={(e) => setAppSettings({ ...appSettings, featuredContentLimit: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxUploadSize">Max Upload Size (MB)</Label>
                    <Input
                      id="maxUploadSize"
                      type="number"
                      min="1"
                      max="500"
                      value={appSettings.maxFileUploadSize}
                      onChange={(e) => setAppSettings({ ...appSettings, maxFileUploadSize: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('General', appSettings)}
                  disabled={saveSettingsMutation.isLoading}
                >
                  {saveSettingsMutation.isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save General Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="notificationEmail">Notification Email</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  value={notificationSettings.notificationEmail}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, notificationEmail: e.target.value })}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Notification Types</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-gray-600">Receive browser push notifications</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, pushNotifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Content Notifications</Label>
                      <p className="text-sm text-gray-600">Get notified when new content is published</p>
                    </div>
                    <Switch
                      checked={notificationSettings.newContentNotification}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newContentNotification: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>User Activity Notifications</Label>
                      <p className="text-sm text-gray-600">Get notified about user engagement</p>
                    </div>
                    <Switch
                      checked={notificationSettings.userActivityNotification}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, userActivityNotification: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Alerts</Label>
                      <p className="text-sm text-gray-600">Important system and security alerts</p>
                    </div>
                    <Switch
                      checked={notificationSettings.systemAlertsNotification}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, systemAlertsNotification: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-gray-600">Receive weekly analytics reports</p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyReportsNotification}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, weeklyReportsNotification: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('Notification', notificationSettings)}
                  disabled={saveSettingsMutation.isLoading}
                >
                  {saveSettingsMutation.isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Security & Privacy
              </CardTitle>
              <CardDescription>
                Configure security settings and password requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {securitySettings.twoFactorEnabled && (
                      <Badge variant="secondary">Enabled</Badge>
                    )}
                    <Switch
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorEnabled: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Session Management</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (seconds)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="3600"
                      max="604800"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-gray-500">
                      Currently: {Math.floor(securitySettings.sessionTimeout / 3600)} hours
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      min="3"
                      max="10"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Password Requirements</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minLength">Minimum Length</Label>
                    <Input
                      id="minLength"
                      type="number"
                      min="6"
                      max="32"
                      value={securitySettings.passwordRequirements.minLength}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
                        passwordRequirements: {
                          ...securitySettings.passwordRequirements,
                          minLength: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Require Uppercase Letters</Label>
                    <Switch
                      checked={securitySettings.passwordRequirements.requireUppercase}
                      onCheckedChange={(checked) => setSecuritySettings({
                        ...securitySettings,
                        passwordRequirements: {
                          ...securitySettings.passwordRequirements,
                          requireUppercase: checked
                        }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Require Numbers</Label>
                    <Switch
                      checked={securitySettings.passwordRequirements.requireNumbers}
                      onCheckedChange={(checked) => setSecuritySettings({
                        ...securitySettings,
                        passwordRequirements: {
                          ...securitySettings.passwordRequirements,
                          requireNumbers: checked
                        }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Require Special Characters</Label>
                    <Switch
                      checked={securitySettings.passwordRequirements.requireSpecialChars}
                      onCheckedChange={(checked) => setSecuritySettings({
                        ...securitySettings,
                        passwordRequirements: {
                          ...securitySettings.passwordRequirements,
                          requireSpecialChars: checked
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('Security', securitySettings)}
                  disabled={saveSettingsMutation.isLoading}
                >
                  {saveSettingsMutation.isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Advanced Configuration
              </CardTitle>
              <CardDescription>
                Advanced settings for system administration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Cache Management</h4>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Clear Application Cache</p>
                    <p className="text-sm text-gray-600">Clear all cached data to free up space</p>
                  </div>
                  <Button variant="outline" onClick={handleClearCache}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Clear Cache
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Data Management</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">Export All Data</p>
                      <Download className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Download a complete backup of all application data
                    </p>
                    <Button variant="outline" onClick={handleExportData} disabled={isExporting} className="w-full">
                      {isExporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Export Data
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">Import Data</p>
                      <Upload className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Import data from a backup file
                    </p>
                    <Button variant="outline" className="w-full">
                      <Upload className="mr-2 h-4 w-4" />
                      Import Data
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">YouTube API Testing</p>
                      <Youtube className="h-4 w-4 text-red-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Test YouTube API integration and validate configuration
                    </p>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/dashboard/settings/youtube-api">
                        <Youtube className="mr-2 h-4 w-4" />
                        Test YouTube API
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-red-600 flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Danger Zone
                </h4>
                
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-red-900">Reset All Settings</p>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </div>
                  <p className="text-sm text-red-700 mb-3">
                    This will reset all settings to their default values. This action cannot be undone.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Reset All Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Reset All Settings
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset all settings to their default values? 
              This action cannot be undone and will affect:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Application configuration</li>
                <li>Notification preferences</li>
                <li>Security settings</li>
                <li>All advanced configurations</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // Reset all settings logic here
                setShowDeleteDialog(false);
                toast({
                  title: 'Settings Reset',
                  description: 'All settings have been reset to default values',
                  variant: 'success',
                });
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Reset Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}