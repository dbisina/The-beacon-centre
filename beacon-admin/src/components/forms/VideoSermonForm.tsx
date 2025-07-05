// src/components/forms/VideoSermonForm.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Save, Eye, Loader2, Youtube, Star, StarOff, Link2, AlertCircle, CheckCircle, Clock, ExternalLink, Play, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { videoSermonsApi, categoriesApi } from '@/lib/api';
import { VideoSermon } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getYouTubeAPI, youtubeUtils, YouTubeVideoInfo } from '@/lib/youtube';

// Form validation schema with real YouTube validation
const videoSermonSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  speaker: z.string().min(1, 'Speaker is required').max(255, 'Speaker name must be less than 255 characters'),
  youtubeUrl: z.string().min(1, 'YouTube URL is required').refine((url) => {
    return YouTubeUtils.extractVideoId(url) !== null;
  }, 'Please enter a valid YouTube URL'),
  description: z.string().optional(),
  category: z.string().optional(),
  sermonDate: z.date().optional(),
  isFeatured: z.boolean().default(false),
});

type VideoSermonFormData = z.infer<typeof videoSermonSchema>;

interface VideoSermonFormProps {
  sermon?: VideoSermon;
}

// YouTube video preview component
interface YouTubePreviewProps {
  videoInfo: YouTubeVideoInfo;
  onAutoFill: () => void;
}

const YouTubePreview = ({ videoInfo, onAutoFill }: YouTubePreviewProps) => {
  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-start space-x-4">
        <div className="relative">
          <img 
            src={YouTubeUtils.getBestThumbnail(videoInfo.thumbnails, 'medium')}
            alt={videoInfo.title}
            className="w-32 h-24 object-cover rounded"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded">
            <Play className="h-6 w-6 text-white" />
          </div>
          <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
            {videoInfo.duration}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{videoInfo.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{videoInfo.channelTitle}</p>
          
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{YouTubeUtils.formatViewCount(videoInfo.viewCount)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{YouTubeUtils.formatPublishDate(videoInfo.publishedAt)}</span>
            </div>
          </div>

          {videoInfo.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {videoInfo.description.substring(0, 120)}...
            </p>
          )}

          <div className="flex items-center space-x-2 mt-3">
            <Button size="sm" onClick={onAutoFill}>
              Auto Fill Form
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open(YouTubeUtils.getWatchUrl(videoInfo.id), '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Watch
            </Button>
          </div>
        </div>
      </div>

      {/* Video status indicators */}
      <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
        {videoInfo.isLiveBroadcast && (
          <Badge variant="destructive">Live Broadcast</Badge>
        )}
        {videoInfo.isEmbeddable && (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Embeddable
          </Badge>
        )}
        {videoInfo.tags && videoInfo.tags.length > 0 && (
          <Badge variant="secondary">
            {videoInfo.tags.length} tags
          </Badge>
        )}
      </div>
    </div>
  );
};

export function VideoSermonForm({ sermon }: VideoSermonFormProps) {
  const [youtubeInfo, setYoutubeInfo] = useState<YouTubeVideoInfo | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [urlCheckDebounce, setUrlCheckDebounce] = useState<NodeJS.Timeout | null>(null);
  
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getVideoInfo, isLoading: youtubeLoading, error: youtubeError, clearError } = useYouTubeAPI();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    trigger,
  } = useForm<VideoSermonFormData>({
    resolver: zodResolver(videoSermonSchema),
    defaultValues: sermon ? {
      title: sermon.title,
      speaker: sermon.speaker,
      youtubeUrl: `https://youtube.com/watch?v=${sermon.youtubeId}`,
      description: sermon.description || '',
      category: sermon.category || 'none',
      sermonDate: sermon.sermonDate ? new Date(sermon.sermonDate) : undefined,
      isFeatured: sermon.isFeatured,
    } : {
      title: '',
      speaker: '',
      youtubeUrl: '',
      description: '',
      category: 'none',
      sermonDate: undefined,
      isFeatured: false,
    },
  });

  const watchedValues = watch();
  const watchedUrl = watch('youtubeUrl');

  // Fetch categories
  const { data: categories, error: categoriesError, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
    onError: (error) => {
      console.error('Failed to fetch categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    },
  });

  // Debug categories data
  console.log('Categories data:', categories);
  console.log('Categories type:', typeof categories);
  console.log('Is categories array?', Array.isArray(categories));

  // Auto-fetch YouTube info when URL changes
  useEffect(() => {
    // Clear any existing debounce
    if (urlCheckDebounce) {
      clearTimeout(urlCheckDebounce);
    }

    // Clear previous error
    clearError();
    
    if (!watchedUrl || watchedUrl === `https://youtube.com/watch?v=${sermon?.youtubeId}`) {
      return;
    }

    const videoId = YouTubeUtils.extractVideoId(watchedUrl);
    if (!videoId) {
      setYoutubeInfo(null);
      return;
    }

    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      try {
        const videoInfo = await getVideoInfo(watchedUrl);
        if (videoInfo) {
          setYoutubeInfo(videoInfo);
        }
      } catch (error) {
        console.error('YouTube API error:', error);
        setYoutubeInfo(null);
      }
    }, 1000);

    setUrlCheckDebounce(timeoutId);

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [watchedUrl, getVideoInfo, clearError, sermon?.youtubeId]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: videoSermonsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['video-sermons']);
      toast({
        title: 'Success',
        description: 'Video sermon created successfully',
        variant: 'success',
      });
      router.push('/dashboard/video-sermons');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<VideoSermon> }) => 
      videoSermonsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['video-sermons']);
      queryClient.invalidateQueries(['video-sermon', sermon?.id]);
      toast({
        title: 'Success',
        description: 'Video sermon updated successfully',
        variant: 'success',
      });
      router.push('/dashboard/video-sermons');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  const onSubmit = (data: VideoSermonFormData) => {
    const youtubeId = YouTubeUtils.extractVideoId(data.youtubeUrl);
    if (!youtubeId) {
      toast({
        title: 'Error',
        description: 'Invalid YouTube URL',
        variant: 'destructive',
      });
      return;
    }

    const formattedData = {
      title: data.title,
      speaker: data.speaker,
      youtubeId,
      description: data.description || undefined,
      category: data.category === 'none' ? undefined : data.category,
      sermonDate: data.sermonDate ? format(data.sermonDate, 'yyyy-MM-dd') : undefined,
      isFeatured: data.isFeatured,
      thumbnailUrl: youtubeInfo ? YouTubeUtils.getBestThumbnail(youtubeInfo.thumbnails, 'large') : undefined,
      duration: youtubeInfo?.duration,
    };

    if (sermon) {
      updateMutation.mutate({ id: sermon.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setValue('sermonDate', date);
    trigger('sermonDate');
  };

  const handleAutoFillFromYoutube = () => {
    if (youtubeInfo) {
      // Only auto-fill if fields are empty to avoid overwriting user input
      if (!watchedValues.title) {
        setValue('title', youtubeInfo.title);
      }
      if (!watchedValues.speaker) {
        setValue('speaker', youtubeInfo.channelTitle);
      }
      if (!watchedValues.description) {
        setValue('description', youtubeInfo.description);
      }
      
      trigger(['title', 'speaker', 'description']);
      
      toast({
        title: 'Form Updated',
        description: 'Video information has been filled from YouTube',
        variant: 'success',
      });
    }
  };

  if (isPreviewMode) {
    const videoId = YouTubeUtils.extractVideoId(watchedValues.youtubeUrl);
    
    return (
      <div className="space-y-6">
        {/* Preview Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Preview</h2>
          <Button variant="outline" onClick={() => setIsPreviewMode(false)}>
            <Eye className="mr-2 h-4 w-4" />
            Back to Edit
          </Button>
        </div>

        {/* Preview Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-0">
              {videoId && (
                <div className="aspect-video">
                  <iframe
                    src={YouTubeUtils.getEmbedUrl(videoId, { 
                      modestbranding: true, 
                      rel: false 
                    })}
                    className="w-full h-full rounded-t-lg"
                    allowFullScreen
                    title={watchedValues.title}
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {watchedValues.isFeatured && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {watchedValues.category && (
                      <Badge variant="outline">{watchedValues.category}</Badge>
                    )}
                  </div>
                  {youtubeInfo && (
                    <div className="text-sm text-gray-500">
                      {youtubeInfo.duration} • {YouTubeUtils.formatViewCount(youtubeInfo.viewCount)}
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-semibold mb-2">{watchedValues.title}</h3>
                <p className="text-gray-600 mb-2">Speaker: {watchedValues.speaker}</p>
                
                {watchedValues.sermonDate && (
                  <p className="text-sm text-gray-500 mb-4">
                    Sermon Date: {format(watchedValues.sermonDate, 'MMMM d, yyyy')}
                  </p>
                )}

                {watchedValues.description && (
                  <div className="prose max-w-none">
                    {watchedValues.description.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-2 text-gray-700">{paragraph}</p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Video Info */}
          {youtubeInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Video Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Channel</Label>
                  <p className="text-sm text-gray-600">{youtubeInfo.channelTitle}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Published</Label>
                  <p className="text-sm text-gray-600">{YouTubeUtils.formatPublishDate(youtubeInfo.publishedAt)}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <p className="text-sm text-gray-600">{youtubeInfo.duration}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Views</Label>
                  <p className="text-sm text-gray-600">{YouTubeUtils.formatViewCount(youtubeInfo.viewCount)}</p>
                </div>

                {youtubeInfo.tags && youtubeInfo.tags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {youtubeInfo.tags.slice(0, 5).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {youtubeInfo.tags.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{youtubeInfo.tags.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* YouTube URL */}
          <Card>
            <CardHeader>
              <CardTitle>YouTube Video</CardTitle>
              <CardDescription>
                Enter the YouTube URL to automatically fetch video information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtubeUrl">YouTube URL</Label>
                <div className="flex space-x-2">
                  <Input
                    id="youtubeUrl"
                    placeholder="https://youtube.com/watch?v=..."
                    {...register('youtubeUrl')}
                    className="flex-1"
                  />
                  {youtubeLoading && (
                    <div className="flex items-center px-3">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                {errors.youtubeUrl && (
                  <p className="text-sm text-red-600">{errors.youtubeUrl.message}</p>
                )}
                {youtubeError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{youtubeError}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* YouTube Preview */}
              {youtubeInfo && !youtubeLoading && (
                <YouTubePreview 
                  videoInfo={youtubeInfo} 
                  onAutoFill={handleAutoFillFromYoutube}
                />
              )}
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Sermon Details</CardTitle>
              <CardDescription>
                Enter the sermon title, speaker, and other details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter sermon title..."
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="speaker">Speaker</Label>
                <Input
                  id="speaker"
                  placeholder="Enter speaker name..."
                  {...register('speaker')}
                />
                {errors.speaker && (
                  <p className="text-sm text-red-600">{errors.speaker.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={watchedValues.category} onValueChange={(value) => setValue('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select a category (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {Array.isArray(categories) && categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                    {categoriesError && (
                      <SelectItem value="error" disabled>
                        Error loading categories
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sermonDate">Sermon Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !watchedValues.sermonDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watchedValues.sermonDate ? format(watchedValues.sermonDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={watchedValues.sermonDate}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter sermon description..."
                  rows={4}
                  {...register('description')}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {sermon ? 'Update Video' : 'Save Video'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPreviewMode(true)}
                className="w-full"
                disabled={!watchedValues.title || !watchedValues.youtubeUrl}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="featured">Featured Video</Label>
                  <p className="text-sm text-gray-600">
                    Show this video prominently in the app
                  </p>
                </div>
                <Switch
                  id="featured"
                  checked={watchedValues.isFeatured}
                  onCheckedChange={(checked) => setValue('isFeatured', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Video Stats */}
          {youtubeInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Video Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{youtubeInfo.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span>Views:</span>
                  <span className="font-medium">{YouTubeUtils.formatViewCount(youtubeInfo.viewCount)}</span>
                </div>
                {youtubeInfo.likeCount && (
                  <div className="flex justify-between">
                    <span>Likes:</span>
                    <span className="font-medium">{youtubeInfo.likeCount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Published:</span>
                  <span className="font-medium">{YouTubeUtils.formatPublishDate(youtubeInfo.publishedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Embeddable:</span>
                  <span className={`font-medium ${youtubeInfo.isEmbeddable ? 'text-green-600' : 'text-red-600'}`}>
                    {youtubeInfo.isEmbeddable ? 'Yes' : 'No'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          {watchedValues.youtubeUrl && YouTubeUtils.extractVideoId(watchedValues.youtubeUrl) && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(watchedValues.youtubeUrl, '_blank')}
                >
                  <Youtube className="mr-2 h-4 w-4" />
                  Watch on YouTube
                </Button>
                
                {youtubeInfo && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`https://youtube.com/channel/${youtubeInfo.channelId}`, '_blank')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    View Channel
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>• Paste any YouTube URL format to auto-extract video info</p>
              <p>• Use descriptive titles that clearly identify the sermon topic</p>
              <p>• Add categories to help users find relevant content</p>
              <p>• Featured videos appear prominently in the mobile app</p>
              <p>• Auto-fill saves time but you can edit any field manually</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}