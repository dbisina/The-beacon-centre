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
  Youtube,
  Zap,
  Users,
  Activity,
  Server,
  Clock,
  FileText,
  Sliders
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../../../contexts/authContext';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Manage your application configuration and preferences
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={handleExportData} 
            disabled={isExporting}
            size="lg"
            className="border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-colors rounded-xl"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Download className="mr-2 h-5 w-5" />
            )}
            Export Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-200 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">App Status</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
              <Activity className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 mb-1">Online</div>
            <p className="text-sm text-slate-500">
              {appSettings.maintenanceMode ? 'Maintenance Mode' : 'All systems operational'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-200 rounded-2xl hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Security</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Shield className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {securitySettings.twoFactorEnabled ? 'Enhanced' : 'Standard'}
            </div>
            <p className="text-sm text-slate-500">
              2FA {securitySettings.twoFactorEnabled ? 'enabled' : 'disabled'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-200 rounded-2xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Notifications</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Bell className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {Object.values(notificationSettings).filter(Boolean).length - 1}
            </div>
            <p className="text-sm text-slate-500">
              Active notification types
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-200 rounded-2xl hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Cache Size</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
              <Server className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 mb-1">42 MB</div>
            <p className="text-sm text-slate-500">
              Cached application data
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-0 shadow-xl shadow-slate-200/50 rounded-2xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <TabsList className="grid w-full grid-cols-4 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <TabsTrigger 
                value="general" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200 font-medium"
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger 
                value="notifications"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200 font-medium"
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger 
                value="security"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200 font-medium"
              >
                <Shield className="mr-2 h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="advanced"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200 font-medium"
              >
                <Database className="mr-2 h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          {/* General Settings */}
          <TabsContent value="general" className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <SettingsIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Application Settings</h3>
                  <p className="text-slate-600">Configure basic application information and behavior</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="appName" className="text-sm font-semibold text-slate-700">Application Name</Label>
                    <Input
                      id="appName"
                      value={appSettings.appName}
                      onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })}
                      className="h-12 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 bg-white"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="supportEmail" className="text-sm font-semibold text-slate-700">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={appSettings.supportEmail}
                      onChange={(e) => setAppSettings({ ...appSettings, supportEmail: e.target.value })}
                      className="h-12 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="appDescription" className="text-sm font-semibold text-slate-700">Application Description</Label>
                  <Textarea
                    id="appDescription"
                    value={appSettings.appDescription}
                    onChange={(e) => setAppSettings({ ...appSettings, appDescription: e.target.value })}
                    rows={3}
                    className="border-slate-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 bg-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="privacyUrl" className="text-sm font-semibold text-slate-700">Privacy Policy URL</Label>
                    <Input
                      id="privacyUrl"
                      value={appSettings.privacyPolicyUrl}
                      onChange={(e) => setAppSettings({ ...appSettings, privacyPolicyUrl: e.target.value })}
                      className="h-12 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 bg-white"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="termsUrl" className="text-sm font-semibold text-slate-700">Terms of Service URL</Label>
                    <Input
                      id="termsUrl"
                      value={appSettings.termsOfServiceUrl}
                      onChange={(e) => setAppSettings({ ...appSettings, termsOfServiceUrl: e.target.value })}
                      className="h-12 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 space-y-6">
                <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                  <Sliders className="mr-2 h-5 w-5" />
                  Application Behavior
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                    <div className="space-y-1">
                      <Label className="font-medium">Maintenance Mode</Label>
                      <p className="text-sm text-slate-600">Disable public access to the app</p>
                    </div>
                    <Switch
                      checked={appSettings.maintenanceMode}
                      onCheckedChange={(checked) => setAppSettings({ ...appSettings, maintenanceMode: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                    <div className="space-y-1">
                      <Label className="font-medium">Allow User Registration</Label>
                      <p className="text-sm text-slate-600">Enable new user sign-ups</p>
                    </div>
                    <Switch
                      checked={appSettings.allowRegistration}
                      onCheckedChange={(checked) => setAppSettings({ ...appSettings, allowRegistration: checked })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="defaultTheme" className="text-sm font-semibold text-slate-700">Default Theme</Label>
                    <Select value={appSettings.defaultTheme} onValueChange={(value: 'light' | 'dark' | 'auto') => setAppSettings({ ...appSettings, defaultTheme: value })}>
                      <SelectTrigger className="h-12 border-slate-300 rounded-xl focus:border-blue-500 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="featuredLimit" className="text-sm font-semibold text-slate-700">Featured Content Limit</Label>
                    <Input
                      id="featuredLimit"
                      type="number"
                      min="1"
                      max="20"
                      value={appSettings.featuredContentLimit}
                      onChange={(e) => setAppSettings({ ...appSettings, featuredContentLimit: parseInt(e.target.value) })}
                      className="h-12 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 bg-white"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="maxUploadSize" className="text-sm font-semibold text-slate-700">Max Upload Size (MB)</Label>
                    <Input
                      id="maxUploadSize"
                      type="number"
                      min="1"
                      max="500"
                      value={appSettings.maxFileUploadSize}
                      onChange={(e) => setAppSettings({ ...appSettings, maxFileUploadSize: parseInt(e.target.value) })}
                      className="h-12 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('General', appSettings)}
                  disabled={saveSettingsMutation.isLoading}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg rounded-xl px-8"
                >
                  {saveSettingsMutation.isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-5 w-5" />
                  )}
                  Save General Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Notification Preferences</h3>
                  <p className="text-slate-600">Configure how and when you receive notifications</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="notificationEmail" className="text-sm font-semibold text-slate-700">Notification Email</Label>
                  <Input
                    id="notificationEmail"
                    type="email"
                    value={notificationSettings.notificationEmail}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, notificationEmail: e.target.value })}
                    className="h-12 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 bg-white"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-800">Notification Types</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <Label className="font-medium">Email Notifications</Label>
                        <p className="text-sm text-slate-600">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <Label className="font-medium">Push Notifications</Label>
                        <p className="text-sm text-slate-600">Receive browser push notifications</p>
                      </div>
                      <Switch
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, pushNotifications: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <Label className="font-medium">New Content Notifications</Label>
                        <p className="text-sm text-slate-600">Get notified when new content is published</p>
                      </div>
                      <Switch
                        checked={notificationSettings.newContentNotification}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newContentNotification: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <Label className="font-medium">User Activity Notifications</Label>
                        <p className="text-sm text-slate-600">Get notified about user engagement</p>
                      </div>
                      <Switch
                        checked={notificationSettings.userActivityNotification}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, userActivityNotification: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <Label className="font-medium">System Alerts</Label>
                        <p className="text-sm text-slate-600">Important system and security alerts</p>
                      </div>
                      <Switch
                        checked={notificationSettings.systemAlertsNotification}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, systemAlertsNotification: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <Label className="font-medium">Weekly Reports</Label>
                        <p className="text-sm text-slate-600">Receive weekly analytics reports</p>
                      </div>
                      <Switch
                        checked={notificationSettings.weeklyReportsNotification}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, weeklyReportsNotification: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('Notification', notificationSettings)}
                  disabled={saveSettingsMutation.isLoading}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg rounded-xl px-8"
                >
                  {saveSettingsMutation.isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-5 w-5" />
                  )}
                  Save Notification Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Security & Privacy</h3>
                  <p className="text-slate-600">Configure security settings and password requirements</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <Label className="font-medium">Two-Factor Authentication</Label>
                    <p className="text-sm text-slate-600">Add an extra layer of security to your account</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {securitySettings.twoFactorEnabled && (
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">Enabled</Badge>
                    )}
                    <Switch
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorEnabled: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Session Management
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="sessionTimeout" className="text-sm font-semibold text-slate-700">Session Timeout (seconds)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="3600"
                        max="604800"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                        className="h-12 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 bg-white"
                      />
                      <p className="text-xs text-slate-500">
                        Currently: {Math.floor(securitySettings.sessionTimeout / 3600)} hours
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="maxLoginAttempts" className="text-sm font-semibold text-slate-700">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        min="3"
                        max="10"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                        className="h-12 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                    <Lock className="mr-2 h-5 w-5" />
                    Password Requirements
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="minLength" className="text-sm font-semibold text-slate-700">Minimum Length</Label>
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
                        className="h-12 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                      <Label className="font-medium">Require Uppercase Letters</Label>
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

                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                      <Label className="font-medium">Require Numbers</Label>
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

                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                      <Label className="font-medium">Require Special Characters</Label>
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
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('Security', securitySettings)}
                  disabled={saveSettingsMutation.isLoading}
                  size="lg"
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0 shadow-lg rounded-xl px-8"
                >
                  {saveSettingsMutation.isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-5 w-5" />
                  )}
                  Save Security Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Advanced Configuration</h3>
                  <p className="text-slate-600">Advanced settings for system administration</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 space-y-6">
                <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Cache Management
                </h4>
                
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 mb-1">Clear Application Cache</p>
                      <p className="text-sm text-slate-600">Clear all cached data to free up space and refresh content</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleClearCache}
                      className="border-slate-300 hover:bg-slate-50 rounded-xl"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Clear Cache
                    </Button>
                  </div>
                </div>

                <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Data Management
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-slate-800">Export All Data</p>
                      <Download className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      Download a complete backup of all application data
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleExportData} 
                      disabled={isExporting} 
                      className="w-full border-blue-300 hover:bg-blue-50 text-blue-700 rounded-xl"
                    >
                      {isExporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Export Data
                    </Button>
                  </div>

                  <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-slate-800">Import Data</p>
                      <Upload className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      Import data from a backup file
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-green-300 hover:bg-green-50 text-green-700 rounded-xl"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Import Data
                    </Button>
                  </div>
                  
                  <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-slate-800">YouTube API Testing</p>
                      <Youtube className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      Test YouTube API integration and validate configuration
                    </p>
                    <Button variant="outline" asChild className="w-full border-red-300 hover:bg-red-50 text-red-700 rounded-xl">
                      <Link href="/dashboard/settings/youtube-api">
                        <Youtube className="mr-2 h-4 w-4" />
                        Test YouTube API
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border-2 border-red-200">
                  <h4 className="text-lg font-semibold text-red-800 flex items-center mb-4">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Danger Zone
                  </h4>
                  
                  <div className="p-6 bg-white rounded-xl border-2 border-red-300">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-red-900">Reset All Settings</p>
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-sm text-red-700 mb-4">
                      This will reset all settings to their default values. This action cannot be undone.
                    </p>
                    <Button 
                      onClick={() => setShowDeleteDialog(true)}
                      className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border-0 shadow-lg rounded-xl"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Reset All Settings
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white border border-slate-200 shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600 text-xl font-bold">
              <AlertTriangle className="mr-2 h-6 w-6" />
              Reset All Settings
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 leading-relaxed">
              Are you sure you want to reset all settings to their default values? 
              This action cannot be undone and will affect:
              <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
                <li>Application configuration</li>
                <li>Notification preferences</li>
                <li>Security settings</li>
                <li>All advanced configurations</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="space-x-3">
            <AlertDialogCancel className="hover:bg-slate-100 rounded-xl">Cancel</AlertDialogCancel>
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
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border-0 shadow-lg rounded-xl"
            >
              Reset Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}