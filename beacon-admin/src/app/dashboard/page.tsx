// app/dashboard/page.tsx - Main dashboard overview

'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
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
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsApi, devotionalsApi, videoSermonsApi, audioSermonsApi, announcementsApi } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/Layout/DashboardLayout';

// Quick stats card component
interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: number;
  color?: string;
}

function StatsCard({ title, value, description, icon: Icon, trend, color = 'teal' }: StatsCardProps) {
  const colorClasses = {
    teal: 'text-teal-600 bg-teal-100',
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    orange: 'text-orange-600 bg-orange-100',
    purple: 'text-purple-600 bg-purple-100',
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
          {trend && (
            <span className={`ml-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

// Quick actions component
function QuickActions() {
  const actions = [
    {
      title: 'Add Devotional',
      description: 'Create today\'s devotional',
      href: '/dashboard/devotionals/new',
      icon: BookOpen,
      color: 'bg-teal-600 hover:bg-teal-700',
    },
    {
      title: 'Upload Audio',
      description: 'Add new audio sermon',
      href: '/dashboard/audio-sermons/new',
      icon: Headphones,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Add Video',
      description: 'Link YouTube sermon',
      href: '/dashboard/video-sermons/new',
      icon: Video,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'New Announcement',
      description: 'Post announcement',
      href: '/dashboard/announcements/new',
      icon: Megaphone,
      color: 'bg-orange-600 hover:bg-orange-700',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Frequently used actions to manage your content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Button
                variant="outline"
                className={`w-full h-auto p-4 flex flex-col items-center space-y-2 hover:scale-105 transition-transform`}
              >
                <div className={`p-3 rounded-lg ${action.color} text-white`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Recent activity component
function RecentActivity() {
  const { data: recentDevotionals } = useQuery({
    queryKey: ['devotionals', { page: 1, limit: 3, sortBy: 'createdAt', sortOrder: 'desc' }],
    queryFn: () => devotionalsApi.getAll({ page: 1, limit: 3, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  const { data: recentVideos } = useQuery({
    queryKey: ['video-sermons', { page: 1, limit: 3, sortBy: 'createdAt', sortOrder: 'desc' }],
    queryFn: () => videoSermonsApi.getAll({ page: 1, limit: 3, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest content additions and updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentDevotionals?.devotionals?.slice(0, 2).map((devotional: any) => (
          <div key={devotional.id} className="flex items-center space-x-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <BookOpen className="h-4 w-4 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{devotional.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(devotional.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Badge variant="secondary">Devotional</Badge>
          </div>
        ))}

        {recentVideos?.sermons?.slice(0, 2).map((video: any) => (
          <div key={video.id} className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Video className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{video.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(video.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Badge variant="secondary">Video</Badge>
          </div>
        ))}

        <div className="pt-2">
          <Link href="/dashboard/analytics">
            <Button variant="outline" size="sm" className="w-full">
              <BarChart3 className="mr-2 h-4 w-4" />
              View All Activity
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Content calendar component
function ContentCalendar() {
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Calendar</CardTitle>
        <CardDescription>
          Upcoming week's devotionals and content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dates.map((date, index) => (
            <div key={date.toISOString()} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-center">
                  <div className="text-sm font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="text-lg font-bold">{date.getDate()}</div>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {index === 0 ? 'Today\'s Devotional' : `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Devotional`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {index === 0 ? 'Published' : 'Scheduled'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {index === 0 ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">Ready</Badge>
                ) : index <= 2 ? (
                  <Badge variant="secondary">Scheduled</Badge>
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
                {index > 0 && (
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="pt-4">
          <Link href="/dashboard/devotionals">
            <Button variant="outline" size="sm" className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              Manage Calendar
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.getDashboard(),
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Welcome back! Here's what's happening with your content.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="px-3 py-1">
                <Clock className="mr-1 h-3 w-3" />
                Last updated: {new Date().toLocaleTimeString()}
              </Badge>
              <Button asChild>
                <Link href="/dashboard/devotionals/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Quick Add
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {analyticsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
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
                  title="Total Content"
                  value={analytics?.overview?.totalContent?.total || 0}
                  description="Published items"
                  icon={BookOpen}
                  color="teal"
                />
                <StatsCard
                  title="Active Users"
                  value={analytics?.overview?.activeDevices || 0}
                  description="Last 30 days"
                  icon={Users}
                  color="blue"
                />
                <StatsCard
                  title="Total Views"
                  value={analytics?.overview?.totalInteractions || 0}
                  description="All content"
                  icon={Eye}
                  color="green"
                />
                <StatsCard
                  title="This Month"
                  value={analytics?.overview?.recentInteractions || 0}
                  description="Recent activity"
                  icon={TrendingUp}
                  color="purple"
                />
              </>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <QuickActions />
            <RecentActivity />
            <ContentCalendar />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}