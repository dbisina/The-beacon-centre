'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Headphones, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Star,
  StarOff,
  Play,
  Pause,
  Download,
  Upload,
  Filter,
  Volume2,
  Clock,
  Calendar,
  Music,
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
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { audioSermonsApi, categoriesApi } from '@/lib/api';
import { AudioSermon } from '@/lib/types';

// Enhanced Audio player component
interface AudioPlayerProps {
  src: string;
  title: string;
}

function AudioPlayer({ src, title }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audio] = useState(() => {
    if (typeof window !== 'undefined') {
      const audioElement = new Audio(src);
      audioElement.preload = 'metadata';
      return audioElement;
    }
    return null;
  });

  React.useEffect(() => {
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audio]);

  const togglePlay = () => {
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center space-x-3 bg-purple-50 rounded-xl p-4 border border-purple-100">
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlay}
        className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-500 hover:bg-purple-600 text-white"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-gray-900">{title}</p>
        <div className="flex items-center space-x-2 mt-2">
          <Progress value={progressPercentage} className="flex-1 h-2 bg-purple-100" />
          <span className="text-xs text-gray-600 flex-shrink-0 font-medium">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 p-8 text-white mb-8">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Headphones className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Audio Sermons</h1>
                <p className="text-lg opacity-90 mt-1">
                  Manage audio sermon files and organize your content
                </p>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 hover:bg-white/30 transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
            <Button asChild className="bg-white text-purple-600 hover:bg-white/90">
              <Link href="/dashboard/audio-sermons/new">
                <Upload className="mr-2 h-4 w-4" />
                Upload Audio
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <Volume2 className="h-32 w-32" />
      </div>
      <div className="absolute bottom-4 left-4 opacity-10">
        <Music className="h-24 w-24" />
      </div>
    </div>
  );
}

interface StatsProps {
  data: any;
  sermons: AudioSermon[];
}

function StatsSection({ data, sermons }: StatsProps) {
  const featuredCount = sermons?.filter(s => s.isFeatured).length || 0;
  const totalSize = sermons?.reduce((sum, s) => sum + Number(s.fileSize || 0), 0) || 0;
  const totalPlays = sermons?.reduce((sum, s) => sum + (s.playCount || 0), 0) || 0;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const stats = [
    {
      label: "Total Audio",
      value: data?.total || 0,
      icon: Headphones,
      color: "from-blue-500 to-blue-600",
      description: "Audio sermons"
    },
    {
      label: "Featured",
      value: featuredCount,
      icon: Star,
      color: "from-yellow-500 to-yellow-600", 
      description: "Featured audio"
    },
    {
      label: "Total Plays",
      value: totalPlays,
      icon: Play,
      color: "from-green-500 to-green-600",
      description: "Across all audio"
    },
    {
      label: "Storage Used",
      value: formatFileSize(totalSize),
      icon: Volume2,
      color: "from-purple-500 to-purple-600",
      description: "Total file size"
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
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search audio sermons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>
    </div>
  );
}

interface AudioCardProps {
  sermon: AudioSermon;
  onDelete: (id: number) => void;
  onToggleFeatured: (id: number) => void;
}

function AudioCard({ sermon, onDelete, onToggleFeatured }: AudioCardProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <div className="group bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Music className="h-5 w-5 text-purple-600" />
                </div>
                {sermon.isFeatured && (
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              <h3 className="font-bold text-lg line-clamp-2 group-hover:text-purple-600 transition-colors">
                {sermon.title}
              </h3>
              {sermon.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {sermon.description}
                </p>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-2 hover:bg-gray-100 rounded-lg">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/audio-sermons/${sermon.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/audio-sermons/${sermon.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onToggleFeatured(sermon.id)}>
                  {sermon.isFeatured ? (
                    <>
                      <StarOff className="mr-2 h-4 w-4" />
                      Remove from Featured
                    </>
                  ) : (
                    <>
                      <Star className="mr-2 h-4 w-4" />
                      Mark as Featured
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={sermon.audioUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setDeleteId(sermon.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Audio Player */}
        <div className="p-6">
          <AudioPlayer src={sermon.audioUrl} title={sermon.title} />
        </div>

        {/* Content Info */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Speaker</p>
              <p className="font-semibold text-gray-900">{sermon.speaker}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Duration</p>
              <p className="font-semibold text-gray-900">{sermon.duration || 'Unknown'}</p>
            </div>
          </div>

          {sermon.category && (
            <div className="mb-4">
              <Badge 
                variant="outline" 
                className="bg-purple-50 text-purple-700 border-purple-200"
                style={{ 
                  backgroundColor: sermon.category.color ? sermon.category.color + '20' : undefined,
                  borderColor: sermon.category.color || undefined 
                }}
              >
                {typeof sermon.category === 'object' ? sermon.category.name : sermon.category}
              </Badge>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Play className="h-4 w-4" />
                <span>{sermon.playCount || 0} plays</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>12</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Volume2 className="h-4 w-4" />
              <span>{sermon.fileSize ? formatFileSize(Number(sermon.fileSize)) : 'Unknown'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant={sermon.isActive ? 'default' : 'secondary'} className={sermon.isActive ? 'bg-green-100 text-green-700' : ''}>
              {sermon.isActive ? 'Published' : 'Draft'}
            </Badge>
          </div>
        </div>

        {/* Card Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-purple-600 hover:bg-purple-50">
                <Link href={`/dashboard/audio-sermons/${sermon.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-purple-600 hover:bg-purple-50">
                <Link href={`/dashboard/audio-sermons/${sermon.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onToggleFeatured(sermon.id)}
              className="text-yellow-600 hover:bg-yellow-50"
            >
              {sermon.isFeatured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
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
              This action cannot be undone. This will permanently delete the audio sermon and remove the file from storage.
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

export default function AudioSermonsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch audio sermons - KEEPING ALL ORIGINAL TANSTACK REACT QUERY LOGIC
  const { data, isLoading } = useQuery({
    queryKey: ['audio-sermons', { page: currentPage, search: searchTerm, limit: 20 }],
    queryFn: () => audioSermonsApi.getAll({
      page: currentPage,
      search: searchTerm,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }),
  });

  // Fetch categories for stats - KEEPING ORIGINAL API CALL
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  // Delete mutation - KEEPING ALL ORIGINAL LOGIC
  const deleteMutation = useMutation({
    mutationFn: (id: number) => audioSermonsApi.delete(id),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Audio sermon deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['audio-sermons'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete audio sermon',
        variant: 'destructive',
      });
    },
  });

  // Toggle featured mutation - KEEPING ALL ORIGINAL LOGIC
  const toggleFeaturedMutation = useMutation({
    mutationFn: (id: number) => audioSermonsApi.toggleFeatured(id),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Featured status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['audio-sermons'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update featured status',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleToggleFeatured = (id: number) => {
    toggleFeaturedMutation.mutate(id);
  };

  const sermons = data?.sermons || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader />
        <StatsSection data={data} sermons={sermons} />
        <SearchAndFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        
        {/* Audio Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Audio Collection</h2>
              <p className="text-gray-600 mt-1">Manage your audio sermon files and organize by categories</p>
            </div>
            <div className="text-sm text-gray-500">
              {data ? `${data.total} total audio files` : ''}
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-16 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sermons.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-6 bg-purple-100 rounded-full">
                  <Headphones className="h-12 w-12 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No audio sermons found</h3>
                  <p className="text-gray-500 mb-6">Upload your first audio sermon to get started</p>
                  <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-indigo-600">
                    <Link href="/dashboard/audio-sermons/new">
                      <Upload className="mr-2 h-5 w-5" />
                      Upload First Audio
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sermons.map((sermon) => (
                <AudioCard
                  key={sermon.id}
                  sermon={sermon}
                  onDelete={handleDelete}
                  onToggleFeatured={handleToggleFeatured}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center pt-8 gap-4">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, data?.total || 0)} of {data?.total || 0} audio sermons
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}