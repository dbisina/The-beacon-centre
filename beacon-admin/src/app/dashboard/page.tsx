"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
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
  RefreshCw,
  Heart,
  Sun,
  Moon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  analyticsApi,
  devotionalsApi,
  videoSermonsApi,
  audioSermonsApi,
  announcementsApi,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";

// Enhanced welcome section
function WelcomeSection({ admin }: { admin: any }) {
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
      ? "Good afternoon"
      : "Good evening";
  const icon = currentHour < 17 ? Sun : Moon;
  const IconComponent = icon;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 p-8 text-white mb-8">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <IconComponent className="h-6 w-6 text-yellow-300" />
              <span className="text-lg font-medium opacity-90">
                {greeting}, {admin?.name?.split(" ")[0] || "Admin"}!
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-2">
              Ready to share God's devotional today?
            </h1>
            <p className="text-lg opacity-90 max-w-md">
              Your devotional community is growing. Here's what's happening with
              your content today.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-semibold">
                {format(new Date(), "EEEE")}
              </p>
              <p className="text-sm opacity-75">
                {format(new Date(), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <Heart className="h-32 w-32" />
      </div>
      <div className="absolute bottom-4 left-4 opacity-10">
        <BookOpen className="h-24 w-24" />
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
  href?: string;
}

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = "teal",
  href,
}: StatsCardProps) {
  const colorClasses = {
    teal: "from-teal-500 to-teal-600",
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    purple: "from-purple-500 to-purple-600",
    red: "from-red-500 to-red-600",
  };

  const content = (
    <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity"></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white`}
          >
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <div
              className={`text-sm font-semibold px-2 py-1 rounded-full ${
                trend > 0
                  ? "text-green-700 bg-green-100"
                  : "text-red-700 bg-red-100"
              }`}
            >
              {trend > 0 ? "+" : ""}
              {trend}%
            </div>
          )}
        </div>

        <div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
          <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

// Enhanced recent activity component
function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: "devotional",
      action: "created",
      title: "Faith in Times of Uncertainty",
      time: "2 hours ago",
      icon: BookOpen,
      color: "text-teal-600 bg-teal-100",
    },
    {
      id: 2,
      type: "video",
      action: "published",
      title: "Sunday Service - The Power of Prayer",
      time: "5 hours ago",
      icon: Video,
      color: "text-red-600 bg-red-100",
    },
    {
      id: 3,
      type: "announcement",
      action: "updated",
      title: "Youth Conference 2024",
      time: "1 day ago",
      icon: Megaphone,
      color: "text-orange-600 bg-orange-100",
    },
    {
      id: 4,
      type: "audio",
      action: "uploaded",
      title: "Midweek Bible Study",
      time: "2 days ago",
      icon: Headphones,
      color: "text-purple-600 bg-purple-100",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-500" />
          Recent Activity
        </h3>
        <p className="text-gray-600 text-sm mt-1">
          Latest content updates and changes
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${activity.color} flex-shrink-0`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {activity.action} devotional
                </div>
                <div className="text-sm text-gray-600 mt-1 truncate">
                  {activity.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {activity.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <Link href="/dashboard/analytics">
            <Button
              variant="ghost"
              size="sm"
              className="w-full hover:bg-purple-50"
            >
              View All Activity
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Enhanced content calendar component
function ContentCalendar() {
  const { data: devotionals } = useQuery({
    queryKey: ["recent-devotionals"],
    queryFn: () => devotionalsApi.getAll(1, 7), // Get next 7 devotionals
  });

  const getDateStatus = (date: string) => {
    const devotionalDate = new Date(date);

    if (isToday(devotionalDate)) {
      return {
        label: "Today",
        color: "bg-emerald-100 text-emerald-700",
        dot: "bg-emerald-500",
        urgent: true,
      };
    } else if (isTomorrow(devotionalDate)) {
      return {
        label: "Tomorrow",
        color: "bg-blue-100 text-blue-700",
        dot: "bg-blue-500",
        urgent: true,
      };
    } else if (isYesterday(devotionalDate)) {
      return {
        label: "Yesterday",
        color: "bg-gray-100 text-gray-700",
        dot: "bg-gray-400",
        urgent: false,
      };
    } else {
      return {
        label: format(devotionalDate, "MMM dd"),
        color: "bg-gray-100 text-gray-700",
        dot: "bg-gray-400",
        urgent: false,
      };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Content Calendar
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Upcoming devotionals and content schedule
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-indigo-600 hover:text-indigo-700"
          >
            <Link href="/dashboard/devotionals">View All</Link>
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {devotionals?.devotionals?.slice(0, 5).map((devotional, index) => {
            const status = getDateStatus(devotional.date);
            return (
              <div
                key={devotional.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-3 h-3 rounded-full ${status.dot}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {devotional.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(devotional.date), "EEEE, MMMM d")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}
                  >
                    {status.label}
                  </span>
                  {status.urgent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="p-2 h-8 w-8"
                    >
                      <Link
                        href={`/dashboard/devotionals/${devotional.id}/edit`}
                      >
                        <Plus className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          }) || (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No upcoming content</p>
              <p className="text-sm">Schedule your next devotional</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced quick actions component
function QuickActions() {
  const actions = [
    {
      title: "New Devotional",
      description: "Create daily devotional",
      href: "/dashboard/devotionals/new",
      icon: BookOpen,
      color: "from-teal-500 to-cyan-500",
      bgColor: "bg-teal-50 hover:bg-teal-100",
    },
    {
      title: "Add Video",
      description: "Upload sermon video",
      href: "/dashboard/video-sermons/new",
      icon: Video,
      color: "from-red-500 to-rose-500",
      bgColor: "bg-red-50 hover:bg-red-100",
    },
    {
      title: "Upload Audio",
      description: "Add audio sermon",
      href: "/dashboard/audio-sermons/new",
      icon: Headphones,
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-purple-50 hover:bg-purple-100",
    },
    {
      title: "New Announcement",
      description: "Create announcement",
      href: "/dashboard/announcements/new",
      icon: Megaphone,
      color: "from-orange-500 to-yellow-500",
      bgColor: "bg-orange-50 hover:bg-orange-100",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50">
        <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
        <p className="text-gray-600 text-sm mt-1">Create and manage content</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action) => (
            <Link key={action.href} href={action.href}>
              <div
                className={`p-4 rounded-xl ${action.bgColor} border border-gray-100 transition-all hover:shadow-md group cursor-pointer`}
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                >
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 text-sm">
                    {action.title}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {action.description}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Enhanced system status component
function SystemStatus() {
  const status = {
    api: "operational",
    database: "operational",
    storage: "operational",
    notifications: "degraded",
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-green-600 bg-green-100";
      case "degraded":
        return "text-yellow-600 bg-yellow-100";
      case "down":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return CheckCircle;
      case "degraded":
        return AlertCircle;
      case "down":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-500" />
          System Status
        </h3>
        <p className="text-gray-600 text-sm mt-1">Infrastructure health</p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {Object.entries(status).map(([service, serviceStatus]) => {
            const StatusIcon = getStatusIcon(serviceStatus);
            return (
              <div
                key={service}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50"
              >
                <span className="text-sm font-medium capitalize">
                  {service.replace(/([A-Z])/g, " $1")}
                </span>
                <div className="flex items-center space-x-2">
                  <div
                    className={`p-1.5 rounded-full ${getStatusColor(
                      serviceStatus
                    )}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                  </div>
                  <span className="text-xs text-gray-600 capitalize font-medium">
                    {serviceStatus}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { admin } = useAuth();

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => analyticsApi.getDashboard(),
  });

  const { data: recentDevotionals } = useQuery({
    queryKey: ["recent-devotionals-count"],
    queryFn: () => devotionalsApi.getAll(1, 1),
  });

  const { data: recentVideos } = useQuery({
    queryKey: ["recent-videos-count"],
    queryFn: () => videoSermonsApi.getAll(1, 1),
  });

  const { data: recentAudio } = useQuery({
    queryKey: ["recent-audio-count"],
    queryFn: () => audioSermonsApi.getAll(1, 1),
  });

  const { data: recentAnnouncements } = useQuery({
    queryKey: ["recent-announcements-count"],
    queryFn: () => announcementsApi.getAll(1, 1),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Welcome Header */}
        <WelcomeSection admin={admin} />

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {analyticsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-6"
              >
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

        {/* Content Overview  */}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <RecentActivity />

          {/* System Status */}
          <SystemStatus />
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Performance Insights
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Key metrics and recommendations for your content
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 rounded-xl bg-green-50">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  94%
                </div>
                <div className="text-sm font-medium text-gray-700">
                  Content Completion Rate
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Users finishing devotionals
                </div>
              </div>
              <div className="text-center p-4 rounded-xl bg-blue-50">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  4.8/5
                </div>
                <div className="text-sm font-medium text-gray-700">
                  Average Rating
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  User satisfaction score
                </div>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-50">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  68%
                </div>
                <div className="text-sm font-medium text-gray-700">
                  Return Rate
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Users coming back weekly
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Star className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      💡 Recommendation
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Your video sermons have 23% higher engagement than audio.
                      Consider creating more video content.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  asChild
                  className="ml-4 border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                >
                  <Link href="/dashboard/video-sermons/new">Create Video</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
