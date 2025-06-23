'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Plus, 
  Search, 
  Video, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Star,
  StarOff,
  Play,
  Clock,
  Calendar,
  Upload,
  Filter,
  Youtube,
  PlayCircle,
  Heart,
  Share2,
  TrendingUp
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { videoSermonsApi, categoriesApi } from '@/lib/api';
import { VideoSermon } from '@/lib/types';
import { formatDate, formatDateTime } from '@/lib/utils';

function PageHeader() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 p-8 text-white mb-8">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Video className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Video Sermons</h1>
                <p className="text-lg opacity-90 mt-1">
                  Manage your YouTube sermon collection
                </p>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 hover:bg-white/30 transition-colors">
              <Upload className="h-4 w-4" />
              Bulk Import
            </button>
            <Button asChild className="bg-white text-red-600 hover:bg-white/90">
              <Link href="/dashboard/video-sermons/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Video
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <PlayCircle className="h-32 w-32" />
      </div>
      <div className="absolute bottom-4 left-4 opacity-10">
        <Star className="h-24 w-24" />
      </div>
    </div>
  );
}

interface StatsProps {
  data: any;
}

function StatsSection({ data }: StatsProps) {
  const stats = [
    {
      label: "Total Videos",
      value: data?.total || 0,
      icon: Video,
      color: "from-blue-500 to-blue-600",
      description: "All video sermons"
    },
    {
      label: "Featured",
      value: data?.sermons?.filter((s: any) => s.isFeatured).length || 0,
      icon: Star,
      color: "from-yellow-500 to-yellow-600", 
      description: "Featured videos"
    },
    {
      label: "Total Views",
      value: data?.sermons?.reduce((sum: number, s: any) => sum + (s.viewCount || 0), 0) || 0,
      icon: Eye,
      color: "from-purple-500 to-purple-600",
      description: "Across all videos"
    },
    {
      label: "This Month",
      value: 8, // You can calculate this from your data
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      description: "Added this month"
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
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: any[];
}

function SearchAndFilters({ searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, categories }: SearchAndFiltersProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search video sermons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-gray-200 focus:border-red-300 focus:ring-red-200"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Array.isArray(categories) && categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-xl">
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </Button>
        </div>
      </div>
    </div>
  );
}

interface VideoCardProps {
  sermon: VideoSermon;
  onToggleFeatured: (id: number, currentFeatured: boolean) => void;
  onDelete: (id: number) => void;
}

function VideoCard({ sermon, onToggleFeatured, onDelete }: VideoCardProps) {
  return (
    <div className="group bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
      {/* Video Thumbnail */}
      <div className="relative">
        <img
          src={sermon.thumbnailUrl || `https://img.youtube.com/vi/${sermon.youtubeId}/maxresdefault.jpg`}
          alt={sermon.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://img.youtube.com/vi/${sermon.youtubeId}/hqdefault.jpg`;
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => window.open(`https://youtube.com/watch?v=${sermon.youtubeId}`, '_blank')}
            className="bg-white/90 text-gray-900 hover:bg-white"
          >
            <Play className="mr-2 h-4 w-4" />
            Watch
          </Button>
        </div>
        
        {/* Featured Badge */}
        {sermon.isFeatured && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-yellow-500 text-yellow-900 hover:bg-yellow-600">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}
        
        {/* Duration */}
        {sermon.duration && (
          <div className="absolute bottom-3 right-3">
            <Badge variant="secondary" className="bg-black/70 text-white border-0">
              {sermon.duration}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-lg line-clamp-2 flex-1 group-hover:text-red-600 transition-colors">
            {sermon.title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2 hover:bg-gray-100 rounded-lg">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => window.open(`https://youtube.com/watch?v=${sermon.youtubeId}`, '_blank')}
              >
                <Youtube className="mr-2 h-4 w-4" />
                Watch on YouTube
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/video-sermons/${sermon.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onToggleFeatured(sermon.id, sermon.isFeatured)}
              >
                {sermon.isFeatured ? (
                  <>
                    <StarOff className="mr-2 h-4 w-4" />
                    Remove from Featured
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Add to Featured
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(sermon.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {sermon.speaker && (
          <p className="text-sm text-gray-600 mb-3 font-medium">
            Speaker: {sermon.speaker}
          </p>
        )}

        {sermon.category && (
          <div className="mb-3">
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              {sermon.category}
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{sermon.viewCount?.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>24</span>
            </div>
          </div>
          
          {sermon.sermonDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(sermon.sermonDate), 'MMM dd, yyyy')}</span>
            </div>
          )}
        </div>

        {sermon.description && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {sermon.description}
          </p>
        )}
      </div>

      {/* Card Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.open(`https://youtube.com/watch?v=${sermon.youtubeId}`, '_blank')}
              className="text-gray-600 hover:text-red-600 hover:bg-red-50"
            >
              <Play className="mr-2 h-4 w-4" />
              Watch
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-red-600 hover:bg-red-50">
              <Link href={`/dashboard/video-sermons/${sermon.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onToggleFeatured(sermon.id, sermon.isFeatured)}
            className="text-yellow-600 hover:bg-yellow-50"
          >
            {sermon.isFeatured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VideoSermonsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['video-sermons', currentPage, searchQuery, selectedCategory],
    queryFn: () => videoSermonsApi.getAll(
      currentPage, 
      10, 
      selectedCategory === 'all' ? undefined : selectedCategory
    ),
    keepPreviousData: true,
  });

  
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });


  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: number; isFeatured: boolean }) => 
      videoSermonsApi.update(id, { isFeatured }),
    onSuccess: () => {
      queryClient.invalidateQueries(['video-sermons']);
      toast({
        title: 'Success',
        description: 'Sermon updated successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: videoSermonsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['video-sermons']);
      toast({
        title: 'Success',
        description: 'Video sermon deleted successfully',
        variant: 'success',
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const handleToggleFeatured = (id: number, currentFeatured: boolean) => {
    toggleFeaturedMutation.mutate({ id, isFeatured: !currentFeatured });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <div className="p-6 bg-red-100 rounded-full w-fit mx-auto mb-6">
              <Video className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error loading video sermons</h3>
            <p className="text-gray-500 mb-6">{error.message}</p>
            <Button 
              onClick={() => queryClient.invalidateQueries(['video-sermons'])} 
              className="bg-red-600 hover:bg-red-700"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader />
        <StatsSection data={data} />
        <SearchAndFilters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={Array.isArray(categories) ? categories : []}
        />
        
        {/* Video Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Video Collection</h2>
              <p className="text-gray-600 mt-1">Manage your sermon videos and featured content</p>
            </div>
            <div className="text-sm text-gray-500">
              {data ? `${data.total} total videos` : ''}
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.sermons?.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-6 bg-red-100 rounded-full">
                  <Video className="h-12 w-12 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No video sermons found</h3>
                  <p className="text-gray-500 mb-6">Add your first YouTube sermon to get started</p>
                  <Button asChild size="lg" className="bg-gradient-to-r from-red-500 to-rose-600">
                    <Link href="/dashboard/video-sermons/new">
                      <Plus className="mr-2 h-5 w-5" />
                      Add Video Sermon
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.sermons?.map((sermon) => (
                <VideoCard
                  key={sermon.id}
                  sermon={sermon}
                  onToggleFeatured={handleToggleFeatured}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center pt-8 gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-xl"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === data.totalPages}
                className="rounded-xl"
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Video Sermon</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this video sermon? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}