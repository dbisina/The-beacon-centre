// beacon-admin/src/components/forms/YouTubeVideoForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  ExternalLink, 
  Play, 
  Calendar, 
  Eye, 
  Clock, 
  User,
  AlertCircle,
  CheckCircle,
  Link as LinkIcon,
  Wand2,
} from 'lucide-react';
import { getYouTubeAPI, YouTubeVideoInfo, YouTubeAPIError, youtubeUtils } from '@/lib/youtube';
import { categoriesApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

// Form validation schema
const videoSermonSchema = z.object({
  youtubeUrl: z.string().min(1, 'YouTube URL is required'),
  youtubeId: z.string().min(11, 'Valid YouTube video ID is required'),
  title: z.string().min(1, 'Title is required'),
  speaker: z.string().min(1, 'Speaker is required'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  sermonDate: z.string().optional(),
  isFeatured: z.boolean().default(false),
  tags: z.string().optional(),
});

type VideoSermonFormData = z.infer<typeof videoSermonSchema>;

interface YouTubeVideoFormProps {
  onSubmit: (data: VideoSermonFormData & { videoInfo?: YouTubeVideoInfo }) => Promise<void>;
  initialData?: Partial<VideoSermonFormData>;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

interface VideoPreviewProps {
  videoInfo: YouTubeVideoInfo;
  isLoading?: boolean;
}

function VideoPreview({ videoInfo, isLoading }: VideoPreviewProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Play className="h-5 w-5 text-red-500" />
          Video Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Thumbnail */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
          <img
            src={videoInfo.thumbnails.high || videoInfo.thumbnails.medium}
            alt={videoInfo.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Play className="h-12 w-12 text-white drop-shadow-lg" />
          </div>
          {videoInfo.duration && (
            <Badge variant="secondary" className="absolute bottom-2 right-2 bg-black/70 text-white">
              {videoInfo.duration}
            </Badge>
          )}
        </div>

        {/* Video metadata */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2">{videoInfo.title}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <User className="h-4 w-4" />
              {videoInfo.channelTitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(videoInfo.publishedAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {videoInfo.viewCount.toLocaleString()} views
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {videoInfo.duration}
            </div>
          </div>

          {videoInfo.description && (
            <div>
              <p className="text-sm text-gray-700 line-clamp-3">
                {videoInfo.description}
              </p>
            </div>
          )}

          {videoInfo.tags && videoInfo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {videoInfo.tags.slice(0, 5).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {videoInfo.tags.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{videoInfo.tags.length - 5} more
                </Badge>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex items-center gap-1"
            >
              <a 
                href={youtubeUtils.getWatchUrl(videoInfo.id)} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3" />
                Watch on YouTube
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function YouTubeVideoForm({ 
  onSubmit, 
  initialData, 
  isLoading: submitLoading = false,
  mode = 'create' 
}: YouTubeVideoFormProps) {
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const form = useForm<VideoSermonFormData>({
    resolver: zodResolver(videoSermonSchema),
    defaultValues: {
      youtubeUrl: '',
      youtubeId: '',
      title: '',
      speaker: '',
      description: '',
      categoryId: '',
      sermonDate: '',
      isFeatured: false,
      tags: '',
      ...initialData,
    },
  });

  const watchedUrl = form.watch('youtubeUrl');

  // Auto-analyze when URL changes
  useEffect(() => {
    const analyzeVideo = async () => {
      if (!watchedUrl || !youtubeUtils.isConfigured()) return;

      const videoId = getYouTubeAPI().constructor.extractVideoId(watchedUrl);
      if (!videoId) {
        setAnalysisError('Invalid YouTube URL format');
        setVideoInfo(null);
        return;
      }

      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        const youtube = getYouTubeAPI();
        const info = await youtube.getVideoInfoFromUrl(watchedUrl);
        
        setVideoInfo(info);
        setHasAnalyzed(true);
        
        // Auto-populate form fields
        form.setValue('youtubeId', info.id);
        if (!form.getValues('title') || mode === 'create') {
          form.setValue('title', info.title);
        }
        if (!form.getValues('description') || mode === 'create') {
          form.setValue('description', info.description.slice(0, 500)); // Truncate long descriptions
        }
        if (info.tags && (!form.getValues('tags') || mode === 'create')) {
          form.setValue('tags', info.tags.slice(0, 10).join(', '));
        }

      } catch (error) {
        if (error instanceof YouTubeAPIError) {
          setAnalysisError(error.message);
        } else {
          setAnalysisError('Failed to analyze video. Please try again.');
        }
        setVideoInfo(null);
      } finally {
        setIsAnalyzing(false);
      }
    };

    const timeoutId = setTimeout(analyzeVideo, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [watchedUrl, form, mode]);

  const handleSubmit = async (data: VideoSermonFormData) => {
    try {
      await onSubmit({ 
        ...data, 
        ...(videoInfo && { videoInfo }) 
      });
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const manualAnalyze = async () => {
    const url = form.getValues('youtubeUrl');
    if (!url) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const youtube = getYouTubeAPI();
      const info = await youtube.getVideoInfoFromUrl(url);
      
      setVideoInfo(info);
      setHasAnalyzed(true);
      
      // Force update fields
      form.setValue('youtubeId', info.id);
      form.setValue('title', info.title);
      form.setValue('description', info.description.slice(0, 500));
      if (info.tags) {
        form.setValue('tags', info.tags.slice(0, 10).join(', '));
      }

    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        setAnalysisError(error.message);
      } else {
        setAnalysisError('Failed to analyze video. Please try again.');
      }
      setVideoInfo(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Section */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              YouTube Video Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* YouTube URL Field */}
                <FormField
                  control={form.control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        YouTube URL
                        {youtubeUtils.isConfigured() ? (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Auto-analyze enabled
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            API not configured
                          </Badge>
                        )}
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="https://www.youtube.com/watch?v=..."
                            {...field}
                            className="flex-1"
                          />
                        </FormControl>
                        {youtubeUtils.isConfigured() && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={manualAnalyze}
                            disabled={isAnalyzing || !field.value}
                            className="px-3"
                          >
                            {isAnalyzing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Wand2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      <FormDescription>
                        Paste a YouTube video URL to automatically fetch video details
                      </FormDescription>
                      {analysisError && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          {analysisError}
                        </div>
                      )}
                      {isAnalyzing && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing video...
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Auto-populated fields */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter sermon title"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="speaker"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Speaker *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter speaker name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter sermon description"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category: any) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sermonDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sermon Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter tags separated by commas"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Separate multiple tags with commas (e.g., faith, worship, prayer)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Featured Video</FormLabel>
                          <FormDescription>
                            Featured videos appear prominently in the mobile app
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={submitLoading || !form.getValues('youtubeId')}
                    className="flex-1"
                  >
                    {submitLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {mode === 'create' ? 'Adding Video...' : 'Updating Video...'}
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        {mode === 'create' ? 'Add Video Sermon' : 'Update Video Sermon'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      <div className="space-y-6">
        {videoInfo ? (
          <VideoPreview videoInfo={videoInfo} isLoading={isAnalyzing} />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Play className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Video Selected
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                {youtubeUtils.isConfigured() 
                  ? "Paste a YouTube URL to see video preview and auto-fill details"
                  : "YouTube API is not configured. Please add your API key to enable automatic video analysis."
                }
              </p>
              {!youtubeUtils.isConfigured() && (
                <Badge variant="outline" className="mt-2">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  API Configuration Required
                </Badge>
              )}
            </CardContent>
          </Card>
        )}

        {hasAnalyzed && videoInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Analysis Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Video ID:</span>
                <code className="bg-gray-100 px-1 rounded">{videoInfo.id}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span>{videoInfo.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Views:</span>
                <span>{videoInfo.viewCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Channel:</span>
                <span className="truncate ml-2">{videoInfo.channelTitle}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}