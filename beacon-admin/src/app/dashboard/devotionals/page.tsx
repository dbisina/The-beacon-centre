'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Calendar, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  BookOpen,
  Filter,
  Download,
  Upload,
  Heart,
  Star,
  Clock,
  CheckCircle,
  Users,
  TrendingUp,
  Archive,
  Globe,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { devotionalsApi } from '@/lib/api';
import { Devotional } from '@/lib/types';

// Helper function for date formatting
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatFullDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

function PageHeader() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-8 text-white mb-8">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Devotionals</h1>
                <p className="text-lg opacity-90 mt-1">
                  Share daily inspiration with your community
                </p>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <Button variant="secondary" size="sm" className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="secondary" size="sm" className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button asChild className="bg-white text-purple-600 hover:bg-white/90">
              <Link href="/dashboard/devotionals/new">
                <Plus className="mr-2 h-4 w-4" />
                New Devotional
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <Heart className="h-32 w-32" />
      </div>
      <div className="absolute bottom-4 left-4 opacity-10">
        <Star className="h-24 w-24" />
      </div>
    </div>
  );
}

interface StatsProps {
  data: any;
  devotionals: Devotional[];
}

function StatsSection({ data, devotionals }: StatsProps) {
  const totalViews = devotionals?.reduce((sum, d) => sum + (d.viewCount || 0), 0) || 0;
  
  const stats = [
    {
      label: "Total Devotionals",
      value: data?.total || 0,
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
      description: "All time content"
    },
    {
      label: "This Month",
      value: 12, // You can calculate this from your data
      icon: Calendar,
      color: "from-green-500 to-green-600", 
      description: "Recently published"
    },
    {
      label: "Total Views",
      value: totalViews > 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews,
      icon: Eye,
      color: "from-purple-500 to-purple-600",
      description: "Community engagement"
    },
    {
      label: "Scheduled",
      value: 7, // You can calculate this from your data
      icon: Clock,
      color: "from-orange-500 to-orange-600",
      description: "Upcoming content"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-1">{stat.label}</div>
              <div className="text-sm text-gray-500">{stat.description}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface SearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

function SearchAndFilters({ searchTerm, setSearchTerm }: SearchAndFiltersProps) {
  return (
   <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
  {/* Left: Filters */}
  <div className="flex flex-wrap items-center gap-2">
    {/* All */}
    <Button
      variant="outline"
      className="h-9 px-4 text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-teal-600 transition-colors"
    >
      All
    </Button>

    {/* Published */}
    <Button
      variant="outline"
      className="h-9 px-4 text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-teal-600 transition-colors"
    >
      Published
    </Button>

    {/* Drafts */}
    <Button
      variant="outline"
      className="h-9 px-4 text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-teal-600 transition-colors"
    >
      Drafts
    </Button>

    {/* Scheduled */}
    <Button
      variant="outline"
      className="h-9 px-4 text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-teal-600 transition-colors"
    >
      Scheduled
    </Button>

    {/* Date Range */}
    <select
      className="h-9 px-3 text-sm border border-gray-200 rounded-md bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
    >
      <option value="today">Today</option>
      <option value="week">This Week</option>
      <option value="month">This Month</option>
      <option value="custom">Custom Range</option>
    </select>
  </div>

  {/* Right: Search */}
  <div className="relative w-full sm:w-auto sm:min-w-[250px]">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
    <Input
      type="text"
      placeholder="Search..."
      className="pl-10 pr-4 w-full h-9 text-sm rounded-md border border-gray-200 shadow-sm focus:ring-teal-500 focus:border-teal-500"
    />
  </div>
</div>


  );
}

interface DevotionalCardProps {
  devotional: Devotional;
  onDelete: (id: number) => void;
}

function DevotionalCard({ devotional, onDelete }: DevotionalCardProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const getCategoryColor = (verseRef: string) => {
    // Simple color assignment based on book
    if (verseRef.includes('Psalm')) return 'bg-blue-100 text-blue-700';
    if (verseRef.includes('Proverbs')) return 'bg-green-100 text-green-700';
    if (verseRef.includes('John')) return 'bg-purple-100 text-purple-700';
    if (verseRef.includes('Matthew')) return 'bg-pink-100 text-pink-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <>
      <div className="group bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
        {/* Card Header */}
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                {devotional.title}
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(devotional.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  3 min read
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getCategoryColor(devotional.verseReference)}>
                {devotional.verseReference}
              </Badge>
              <DropdownMenu>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/devotionals/${devotional.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/devotionals/${devotional.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setDeleteId(devotional.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-600">{devotional.verseReference}</span>
            </div>
            <p className="text-gray-600 line-clamp-3 leading-relaxed">
              {devotional.content.substring(0, 150)}...
            </p>
          </div>

          {/* Stats and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Eye className="h-4 w-4" />
                <span>{devotional.viewCount?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Heart className="h-4 w-4" />
                <span>127</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Share2 className="h-4 w-4" />
                <span>23</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {devotional.isActive ? (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Published
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  <Archive className="mr-1 h-3 w-3" />
                  Draft
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Card Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-purple-600">
                <Link href={`/dashboard/devotionals/${devotional.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-purple-600">
                <Link href={`/dashboard/devotionals/${devotional.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setDeleteId(devotional.id)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the devotional.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface DevotionalsGridProps {
  devotionals: Devotional[];
  isLoading: boolean;
  onDelete: (id: number) => void;
  data: any;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

function DevotionalsGrid({ devotionals, isLoading, onDelete, data, currentPage, setCurrentPage }: DevotionalsGridProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (devotionals.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-6 bg-gray-100 rounded-full">
            <BookOpen className="h-12 w-12 text-gray-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No devotionals found</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first devotional</p>
            <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-indigo-600">
              <Link href="/dashboard/devotionals/new">
                <Plus className="mr-2 h-5 w-5" />
                Create First Devotional
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Devotionals</h2>
          <p className="text-gray-600 mt-1">Manage and organize your spiritual content</p>
        </div>
        <div className="text-sm text-gray-500">
          Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, data?.total || 0)} of {data?.total || 0} devotionals
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {devotionals.map((devotional) => (
          <DevotionalCard key={devotional.id} devotional={devotional} onDelete={onDelete} />
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center pt-8 gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded-xl"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="rounded-xl"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default function DevotionalsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch devotionals with tanstack react query
  const { data, isLoading } = useQuery({
    queryKey: ['devotionals', { page: currentPage, search: searchTerm, limit: 20 }],
    queryFn: () => devotionalsApi.getAll({
      page: currentPage,
      search: searchTerm,
      limit: 20,
      sortBy: 'date',
      sortOrder: 'desc'
    }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => devotionalsApi.delete(id),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Devotional deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['devotionals'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete devotional',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const devotionals = data?.devotionals || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader />
        <StatsSection data={data} devotionals={devotionals} />
        <SearchAndFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <DevotionalsGrid 
          devotionals={devotionals}
          isLoading={isLoading}
          onDelete={handleDelete}
          data={data}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </div>
  );
}