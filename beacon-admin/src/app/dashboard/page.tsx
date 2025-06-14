// app/dashboard/page.tsx - Main dashboard overview

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { 
  BookOpen, 
  Video, 
  Headphones, 
  Megaphone, 
  Users, 
  TrendingUp,
  Plus,
  Calendar,
  Clock,
  Eye,
  Download,
  BarChart3,
  Play,
  Star,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Activity,
  Globe,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { analyticsApi, devotionalsApi, videoSermonsApi, audioSermonsApi, announcementsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatDateTime, getInitials } from '@/lib/utils';

// Quick stats card component
interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: number;
  color?: string;
  href?: string;
}

function StatsCard({ title, value, description, icon: Icon, trend, color = 'teal', href }: StatsCardProps) {
  const colorClasses = {
    teal: 'text-teal-600 bg-teal-100',
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    orange: 'text-orange-600 bg-orange-100',
    purple: 'text-purple-600 bg-purple-100',
    red: 'text-red-600 bg-red-100',
  };

  const content = (
    <>
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
          {trend && (
            <span className={`ml-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </p>
      </CardContent>
    </>
  );

  if (href) {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <Link href={href}>
          {content}
        </Link>
      </Card>
    );
  }

  return <Card>{content}</Card>;
}

// Recent activity component
function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: 'devotional',
      action: 'created',
      title: 'Faith in Times of Uncertainty',
      time: '2 hours ago',
      icon: BookOpen,
      color: 'text-teal-600',
    },
    {
      id: 2,
      type: 'video',
      action: 'published',
      title: 'Sunday Service - The Power of Prayer',
      time: '5 hours ago',
      icon: Video,
      color: 'text-red-600',
    },
    {
      id: 3,
      type: 'announcement',
      action: 'updated',
      title: 'Youth Conference 2024',
      time: '1 day ago',
      icon: Megaphone,
      color: 'text-orange-600',
    },
    {
      id: 4,
      type: 'audio',
      action: 'uploaded',
      title: 'Midweek Bible Study',
      time: '2 days ago',
      icon: Headphones,
      color: 'text-purple-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest content updates and changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3">
              <div className={`p-2 rounded-full bg-gray-100 ${activity.color}`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-500">
                  {activity.action} • {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Link href="/dashboard/analytics">
            <Button variant="ghost" size="sm" className="w-full">
              View All Activity
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Content calendar component
function ContentCalendar() {
  const { data: devotionals } = useQuery({
    queryKey: ['recent-devotionals'],
    queryFn: () => devotionalsApi.getAll(1, 7), // Get next 7 devotionals
  });

  const getDateStatus = (date: string) => {
    const devotionalDate = new Date(date);
    
    if (isToday(devotionalDate)) {
      return { label: 'Today', variant: 'default' as const, urgent: true };
    } else if (isTomorrow(devotionalDate)) {
      return { label: 'Tomorrow', variant: 'secondary' as const, urgent: true };
    } else if (isYesterday(devotionalDate)) {
      return { label: 'Yesterday', variant: 'outline' as const, urgent: false };
    } else {
      return { 
        label: format(devotionalDate, 'MMM dd'), 
        variant: 'outline' as const, 
        urgent: false 
      };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Content Calendar
        </CardTitle>
        <CardDescription>
          Upcoming devotionals and content schedule
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {devotionals?.devotionals?.slice(0, 5).map((devotional, index) => {
            const status = getDateStatus(devotional.date);
            return (
              <div key={devotional.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {devotional.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(devotional.date), 'EEEE, MMMM d')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={status.variant}>
                    {status.label}
                  </Badge>
                  {status.urgent && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/devotionals/${devotional.id}/edit`}>
                        <Plus className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          }) || (
            <div className="text-center py-4 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No upcoming content</p>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Link href="/dashboard/devotionals">
            <Button variant="ghost" size="sm" className="w-full">
              Manage Calendar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick actions component
function QuickActions() {
  const actions = [
    {
      title: 'New Devotional',
      description: 'Create daily devotional',
      href: '/dashboard/devotionals/new',
      icon: BookOpen,
      color: 'bg-teal-500 hover:bg-teal-600',
    },
    {
      title: 'Add Video',
      description: 'Upload sermon video',
      href: '/dashboard/video-sermons/new',
      icon: Video,
      color: 'bg-red-500 hover:bg-red-600',
    },
    {
      title: 'Upload Audio',
      description: 'Add audio sermon',
      href: '/dashboard/audio-sermons/new',
      icon: Headphones,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'New Announcement',
      description: 'Create announcement',
      href: '/dashboard/announcements/new',
      icon: Megaphone,
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow"
              >
                <div className={`p-2 rounded-lg text-white ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// System status component
function SystemStatus() {
  const status = {
    api: 'operational',
    database: 'operational',
    storage: 'operational',
    notifications: 'degraded',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return CheckCircle;
      case 'degraded':
        return AlertCircle;
      case 'down':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-5 w-5" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(status).map(([service, serviceStatus]) => {
            const StatusIcon = getStatusIcon(serviceStatus);
            return (
              <div key={service} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">
                  {service.replace(/([A-Z])/g, ' $1')}
                </span>
                <div className="flex items-center space-x-2">
                  <div className={`p-1 rounded-full ${getStatusColor(serviceStatus)}`}>
                    <StatusIcon className="h-3 w-3" />
                  </div>
                  <span className="text-xs text-gray-500 capitalize">
                    {serviceStatus}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { admin } = useAuth();

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.getDashboard(),
  });

  // Fetch recent content stats
  const { data: recentDevotionals } = useQuery({
    queryKey: ['recent-devotionals-count'],
    queryFn: () => devotionalsApi.getAll(1, 1),
  });

  const { data: recentVideos } = useQuery({
    queryKey: ['recent-videos-count'],
    queryFn: () => videoSermonsApi.getAll(1, 1),
  });

  const { data: recentAudio } = useQuery({
    queryKey: ['recent-audio-count'],
    queryFn: () => audioSermonsApi.getAll(1, 1),
  });

  const { data: recentAnnouncements } = useQuery({
    queryKey: ['recent-announcements-count'],
    queryFn: () => announcementsApi.getAll(1, 1),
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {admin?.name?.split(' ')[0] || 'Admin'}! 👋
          </h1>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your content today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {format(new Date(), 'EEEE')}
            </p>
            <p className="text-sm text-gray-500">
              {format(new Date(), 'MMMM d, yyyy')}
            </p>
          </div>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-teal-100 text-teal-700">
              {admin?.name ? getInitials(admin.name) : 'AD'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsLoading ? (
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
              description="Unique app users"
              icon={Users}
              trend={12}
              color="blue"
              href="/dashboard/analytics"
            />
            <StatsCard
              title="Total Content"
              value={analytics?.overview.totalContent.total || 0}
              description="Published content pieces"
              icon={BookOpen}
              trend={5}
              color="green"
            />
            <StatsCard
              title="This Month Views"
              value="12.4K"
              description="Content views this month"
              icon={Eye}
              trend={8}
              color="purple"
              href="/dashboard/analytics"
            />
            <StatsCard
              title="Engagement Rate"
              value="87%"
              description="User interaction rate"
              icon={TrendingUp}
              trend={3}
              color="orange"
            />
          </>
        )}
      </div>

      {/* Content Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Devotionals"
          value={recentDevotionals?.total || 0}
          description="Total devotionals"
          icon={BookOpen}
          color="teal"
          href="/dashboard/devotionals"
        />
        <StatsCard
          title="Video Sermons"
          value={recentVideos?.total || 0}
          description="Video content"
          icon={Video}
          color="red"
          href="/dashboard/video-sermons"
        />
        <StatsCard
          title="Audio Sermons"
          value={recentAudio?.total || 0}
          description="Audio content"
          icon={Headphones}
          color="purple"
          href="/dashboard/audio-sermons"
        />
        <StatsCard
          title="Announcements"
          value={recentAnnouncements?.total || 0}
          description="Active announcements"
          icon={Megaphone}
          color="orange"
          href="/dashboard/announcements"
        />
      </div>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Calendar - Takes up more space */}
        <div className="lg:col-span-2">
          <ContentCalendar />
        </div>
        
        {/* Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <RecentActivity />
        
        {/* System Status */}
        <SystemStatus />
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Performance Insights
          </CardTitle>
          <CardDescription>
            Key metrics and recommendations for your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">94%</div>
              <p className="text-sm text-gray-600">Content Completion Rate</p>
              <p className="text-xs text-gray-500 mt-1">
                Users finishing devotionals
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">4.8/5</div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-xs text-gray-500 mt-1">
                User satisfaction score
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">68%</div>
              <p className="text-sm text-gray-600">Return Rate</p>
              <p className="text-xs text-gray-500 mt-1">
                Users coming back weekly
              </p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">💡 Recommendation</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Your video sermons have 23% higher engagement than audio. Consider creating more video content.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/video-sermons/new">
                  Create Video
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}