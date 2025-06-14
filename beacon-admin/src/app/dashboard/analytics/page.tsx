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
  RefreshCw,
  Activity,
  Target,
  Zap,
  Heart
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

// Enhanced Chart component
interface SimpleBarChartProps {
  data: { name: string; value: number }[];
  height?: number;
}

const SimpleBarChart = ({ data, height = 200 }: SimpleBarChartProps) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-20 text-sm font-medium text-gray-700 truncate">{item.name}</div>
          <div className="flex-1 flex items-center space-x-3">
            <div className="flex-1 bg-gray-100 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <div className="w-16 text-sm font-bold text-right text-gray-900">{item.value.toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

function PageHeader({ timeRange, setTimeRange, handleRefresh }: any) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-700 p-8 text-white mb-8">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
                <p className="text-lg opacity-90 mt-1">
                  Monitor your content performance and user engagement
                </p>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d' | '1y') => setTimeRange(value)}>
              <SelectTrigger className="w-36 bg-white/20 backdrop-blur-sm border-white/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={handleRefresh} className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <Activity className="h-32 w-32" />
      </div>
      <div className="absolute bottom-4 left-4 opacity-10">
        <Target className="h-24 w-24" />
      </div>
    </div>
  );
}

// Enhanced stats card component
interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: number;
  color?: string;
}

const StatsCard = ({ title, value, description, icon: Icon, trend, color = 'indigo' }: StatsCardProps) => {
  const colorClasses = {
    indigo: 'from-indigo-500 to-indigo-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    teal: 'from-teal-500 to-teal-600',
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity"></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold ${
              trend > 0 
                ? 'text-green-700 bg-green-100' 
                : 'text-red-700 bg-red-100'
            }`}>
              {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        
        <div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{typeof value === 'number' ? value.toLocaleString() : value}</div>
          <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { toast } = useToast();

  // Fetch analytics data - KEEPING ALL ORIGINAL TANSTACK REACT QUERY LOGIC
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <div className="p-6 bg-red-100 rounded-full w-fit mx-auto mb-6">
              <BarChart3 className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error loading analytics</h3>
            <p className="text-gray-500 mb-6">{error.message}</p>
            <Button onClick={handleRefresh} className="bg-red-600 hover:bg-red-700">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader timeRange={timeRange} setTimeRange={setTimeRange} handleRefresh={handleRefresh} />

        {/* Overview Stats - KEEPING ALL ORIGINAL DATA LOGIC */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
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

        {/* Content Breakdown - KEEPING ALL ORIGINAL DATA */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="h-8 w-12" />
              </div>
            ))
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-600">Devotionals</div>
                  <BookOpen className="h-4 w-4 text-teal-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{analytics?.overview.totalContent.devotionals || 0}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-600">Video Sermons</div>
                  <Video className="h-4 w-4 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{analytics?.overview.totalContent.videos || 0}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-600">Audio Sermons</div>
                  <Headphones className="h-4 w-4 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{analytics?.overview.totalContent.audios || 0}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-600">Announcements</div>
                  <Megaphone className="h-4 w-4 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{analytics?.overview.totalContent.announcements || 0}</div>
              </div>
            </>
          )}
        </div>

        {/* Charts and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Demographics */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                User Demographics
              </h3>
              <p className="text-gray-600 text-sm mt-1">User distribution by platform and location</p>
            </div>
            
            <div className="p-6 space-y-8">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 flex-1" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="text-sm font-semibold mb-4 flex items-center text-gray-700">
                      <Smartphone className="mr-2 h-4 w-4 text-blue-500" />
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
                    <h4 className="text-sm font-semibold mb-4 flex items-center text-gray-700">
                      <Globe className="mr-2 h-4 w-4 text-green-500" />
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
            </div>
          </div>

          {/* Popular Content */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Popular Content
              </h3>
              <p className="text-gray-600 text-sm mt-1">Most viewed content across all types</p>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics?.popularContent?.slice(0, 10).map((item, index) => {
                    const getContentIcon = (type: string) => {
                      switch (type.toLowerCase()) {
                        case 'devotional':
                          return { icon: <BookOpen className="h-4 w-4" />, color: 'bg-teal-100 text-teal-600' };
                        case 'video':
                          return { icon: <Video className="h-4 w-4" />, color: 'bg-red-100 text-red-600' };
                        case 'audio':
                          return { icon: <Headphones className="h-4 w-4" />, color: 'bg-purple-100 text-purple-600' };
                        case 'announcement':
                          return { icon: <Megaphone className="h-4 w-4" />, color: 'bg-orange-100 text-orange-600' };
                        default:
                          return { icon: <Eye className="h-4 w-4" />, color: 'bg-gray-100 text-gray-600' };
                      }
                    };

                    const iconData = getContentIcon(item.contentType);

                    return (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${iconData.color}`}>
                            {iconData.icon}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {item.contentType} #{item.contentId}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {item.contentType.toLowerCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900">{item.views.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  }) || (
                    <div className="text-center py-12 text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No content data available</p>
                      <p className="text-sm">Start creating content to see analytics</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
              <p className="text-gray-600 text-sm mt-1">Last 7 days vs previous 7 days</p>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New users</span>
                    <span className="font-bold text-green-600">+{analytics?.overview.recentInteractions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Content views</span>
                    <span className="font-bold text-blue-600">+245</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Downloads</span>
                    <span className="font-bold text-purple-600">+67</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Shares</span>
                    <span className="font-bold text-orange-600">+23</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Peak Usage Times</h3>
              <p className="text-gray-600 text-sm mt-1">When users are most active</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Morning (6-12)</span>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">35%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Afternoon (12-18)</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">28%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Evening (18-24)</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">25%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Night (0-6)</span>
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">12%</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Content Performance</h3>
              <p className="text-gray-600 text-sm mt-1">Average engagement by type</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-sm text-gray-600">
                    <BookOpen className="h-3 w-3 mr-2 text-teal-600" />
                    Devotionals
                  </span>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span className="font-bold text-gray-900">4.2/5</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-sm text-gray-600">
                    <Video className="h-3 w-3 mr-2 text-red-600" />
                    Video Sermons
                  </span>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span className="font-bold text-gray-900">4.5/5</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-sm text-gray-600">
                    <Headphones className="h-3 w-3 mr-2 text-purple-600" />
                    Audio Sermons
                  </span>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span className="font-bold text-gray-900">4.3/5</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-sm text-gray-600">
                    <Megaphone className="h-3 w-3 mr-2 text-orange-600" />
                    Announcements
                  </span>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span className="font-bold text-gray-900">3.8/5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}