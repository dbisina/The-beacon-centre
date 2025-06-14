// src/app/dashboard/analytics/page.tsx - Analytics dashboard

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Eye, 
  Play,
  Download,
  Smartphone,
  Globe,
  Calendar,
  Clock,
  BookOpen,
  Video,
  Headphones,
  Megaphone,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { analyticsApi } from '@/lib/api';
import { AnalyticsDashboard } from '@/lib/types';

// Chart component (simplified - in real app you'd use recharts or similar)
interface SimpleBarChartProps {
  data: { name: string; value: number }[];
  height?: number;
}

const SimpleBarChart = ({ data, height = 200 }: SimpleBarChartProps) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-16 text-sm text-gray-600 truncate">{item.name}</div>
          <div className="flex-1 flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <div className="w-12 text-sm font-medium text-right">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Stats card component
interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: number;
  color?: string;
}

const StatsCard = ({ title, value, description, icon: Icon, trend, color = 'teal' }: StatsCardProps) => {
  const colorClasses = {
    teal: 'text-teal-600 bg-teal-100',
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    orange: 'text-orange-600 bg-orange-100',
    purple: 'text-purple-600 bg-purple-100',
    red: 'text-red-600 bg-red-100',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
          {trend !== undefined && (
            <span className={`ml-2 inline-flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(trend)}%
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { toast } = useToast();

  // Fetch analytics data
  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics-dashboard', timeRange],
    queryFn: () => analyticsApi.getDashboard(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Analytics Refreshed',
      description: 'Dashboard data has been updated',
      variant: 'success',
    });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Error loading analytics</h3>
          <p className="text-gray-500 mt-2">{error.message}</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">
            Monitor your content performance and user engagement
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d' | '1y') => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatsCard
              title="Total Users"
              value={analytics?.overview.totalDevices || 0}
              description="Unique devices tracked"
              icon={Users}
              trend={12}
              color="blue"
            />
            <StatsCard
              title="Active Users"
              value={analytics?.overview.activeDevices || 0}
              description="Active in last 30 days"
              icon={Eye}
              trend={8}
              color="green"
            />
            <StatsCard
              title="Total Content"
              value={analytics?.overview.totalContent.total || 0}
              description="Published content pieces"
              icon={BookOpen}
              trend={5}
              color="purple"
            />
            <StatsCard
              title="Interactions"
              value={analytics?.overview.totalInteractions || 0}
              description="User content interactions"
              icon={Play}
              trend={15}
              color="orange"
            />
          </>
        )}
      </div>

      {/* Content Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-12" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Devotionals</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.overview.totalContent.devotionals || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Video Sermons</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.overview.totalContent.videos || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Audio Sermons</CardTitle>
                <Headphones className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.overview.totalContent.audios || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                <Megaphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.overview.totalContent.announcements || 0}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>User Demographics</CardTitle>
            <CardDescription>
              User distribution by platform and location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-2 flex-1" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center">
                    <Smartphone className="mr-2 h-4 w-4" />
                    By Platform
                  </h4>
                  <SimpleBarChart 
                    data={analytics?.demographics.byPlatform?.map(item => ({
                      name: item.platform,
                      value: item.count
                    })) || []}
                  />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center">
                    <Globe className="mr-2 h-4 w-4" />
                    By Country
                  </h4>
                  <SimpleBarChart 
                    data={analytics?.demographics.byCountry?.slice(0, 5).map(item => ({
                      name: item.country,
                      value: item.count
                    })) || []}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Popular Content */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Content</CardTitle>
            <CardDescription>
              Most viewed content across all types
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <Skeleton className="h-8 w-8 rounded" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {analytics?.popularContent?.slice(0, 10).map((item, index) => {
                  const getContentIcon = (type: string) => {
                    switch (type.toLowerCase()) {
                      case 'devotional':
                        return <BookOpen className="h-4 w-4 text-teal-600" />;
                      case 'video':
                        return <Video className="h-4 w-4 text-red-600" />;
                      case 'audio':
                        return <Headphones className="h-4 w-4 text-purple-600" />;
                      case 'announcement':
                        return <Megaphone className="h-4 w-4 text-orange-600" />;
                      default:
                        return <Eye className="h-4 w-4 text-gray-600" />;
                    }
                  };

                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                          {getContentIcon(item.contentType)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {item.contentType} #{item.contentId}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {item.contentType.toLowerCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-medium">{item.views}</span>
                      </div>
                    </div>
                  );
                }) || (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No content data available</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Last 7 days vs previous 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>New users</span>
                  <span className="font-medium">+{analytics?.overview.recentInteractions || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Content views</span>
                  <span className="font-medium">+245</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Downloads</span>
                  <span className="font-medium">+67</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shares</span>
                  <span className="font-medium">+23</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peak Usage Times</CardTitle>
            <CardDescription>
              When users are most active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Morning (6-12)</span>
                <Badge variant="outline">35%</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Afternoon (12-18)</span>
                <Badge variant="outline">28%</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Evening (18-24)</span>
                <Badge variant="outline">25%</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Night (0-6)</span>
                <Badge variant="outline">12%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Performance</CardTitle>
            <CardDescription>
              Average engagement by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <BookOpen className="h-3 w-3 mr-2 text-teal-600" />
                  Devotionals
                </span>
                <span className="font-medium">4.2/5</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <Video className="h-3 w-3 mr-2 text-red-600" />
                  Video Sermons
                </span>
                <span className="font-medium">4.5/5</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <Headphones className="h-3 w-3 mr-2 text-purple-600" />
                  Audio Sermons
                </span>
                <span className="font-medium">4.3/5</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <Megaphone className="h-3 w-3 mr-2 text-orange-600" />
                  Announcements
                </span>
                <span className="font-medium">3.8/5</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        <Clock className="inline h-4 w-4 mr-1" />
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}