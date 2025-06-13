// components/Forms/VideoSermonForm.tsx - Create/Edit video sermon form

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Save, Eye, X, ExternalLink, Play } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { VideoSermon, CreateVideoSermonForm, Category } from '@/lib/types';
import { categoriesApi } from '@/lib/api';

const videoSermonSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  speaker: z.string().min(1, 'Speaker is required').max(255, 'Speaker must be less than 255 characters'),
  youtubeId: z.string().min(1, 'YouTube ID is required').regex(/^[a-zA-Z0-9_-]{11}$/, 'Invalid YouTube ID format'),
  description: z.string().optional(),
  duration: z.string().optional(),
  categoryId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  sermonDate: z.string().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

type VideoSermonFormData = z.infer<typeof videoSermonSchema>;

interface VideoSermonFormProps {
  sermon?: VideoSermon;
  onSubmit: (data: CreateVideoSermonForm) => Promise<void>;
  isLoading?: boolean;
}

// Extract YouTube ID from URL
const extractYouTubeId = (url: string): string => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : url;
};

export default function VideoSermonForm({ sermon, onSubmit, isLoading = false }: VideoSermonFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    sermon?.sermonDate ? new Date(sermon.sermonDate) : undefined
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [youtubePreview, setYoutubePreview] = useState<{
    id: string;
    title?: string;
    thumbnail?: string;
  } | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    reset,
  } = useForm<VideoSermonFormData>({
    resolver: zodResolver(videoSermonSchema),
    defaultValues: {
      title: sermon?.title || '',
      speaker: sermon?.speaker || '',
      youtubeId: sermon?.youtubeId || '',
      description: sermon?.description || '',
      duration: sermon?.duration || '',
      categoryId: sermon?.categoryId?.toString() || '',
      sermonDate: sermon?.sermonDate ? format(new Date(sermon.sermonDate), 'yyyy-MM-dd') : '',
      thumbnailUrl: sermon?.thumbnailUrl || '',
      isFeatured: sermon?.isFeatured ?? false,
      isActive: sermon?.isActive ?? true,
      tags: sermon?.tags || [],
    },
  });

  const watchedFields = watch();
  const currentTags = watchedFields.tags || [];

  // Watch YouTube ID and update preview
  useEffect(() => {
    const youtubeId = watchedFields.youtubeId;
    if (youtubeId && youtubeId.length === 11) {
      setYoutubePreview({
        id: youtubeId,
        thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
      });
    } else {
      setYoutubePreview(null);
    }
  }, [watchedFields.youtubeId]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setValue('sermonDate', date ? format(date, 'yyyy-MM-dd') : '', { shouldDirty: true });
  };

  const handleYouTubeUrlChange = (value: string) => {
    const extractedId = extractYouTubeId(value);
    setValue('youtubeId', extractedId, { shouldDirty: true });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !currentTags.includes(tagInput.trim())) {
      setValue('tags', [...currentTags, tagInput.trim()], { shouldDirty: true });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove), { shouldDirty: true });
  };

  const handleFormSubmit = async (data: VideoSermonFormData) => {
    try {
      const submitData: CreateVideoSermonForm = {
        ...data,
        categoryId: data.categoryId || undefined,
        sermonDate: data.sermonDate || undefined,
        thumbnailUrl: data.thumbnailUrl || undefined,
        tags: data.tags || [],
      };
      
      await onSubmit(submitData);
      toast({
        title: 'Success',
        description: `Video sermon ${sermon ? 'updated' : 'created'} successfully`,
      });
      if (!sermon) {
        reset();
        setSelectedDate(undefined);
        setYoutubePreview(null);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || `Failed to ${sermon ? 'update' : 'create'} video sermon`,
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  // Preview component
  const VideoSermonPreview = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Video Player */}
      {youtubePreview && (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
          <iframe
            src={`https://www.youtube.com/embed/${youtubePreview.id}`}
            title={watchedFields.title || 'Video Sermon'}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      )}

      {/* Sermon Details */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {watchedFields.title || 'Video Sermon Title'}
            </h1>
            <p className="text-lg text-gray-600">
              Speaker: {watchedFields.speaker || 'Speaker Name'}
            </p>
            {selectedDate && (
              <p className="text-sm text-gray-500">
                {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {watchedFields.isFeatured && (
              <Badge variant="secondary">Featured</Badge>
            )}
            <Badge variant={watchedFields.isActive ? 'default' : 'secondary'}>
              {watchedFields.isActive ? 'Published' : 'Draft'}
            </Badge>
          </div>
        </div>

        {watchedFields.description && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <div className="prose prose-sm max-w-none text-gray-700">
              {watchedFields.description.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-2">{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {currentTags.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {currentTags.map((tag, index) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-4 pt-4 border-t">
          {watchedFields.duration && (
            <span className="text-sm text-gray-600">Duration: {watchedFields.duration}</span>
          )}
          <a
            href={`https://www.youtube.com/watch?v=${watchedFields.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-red-600 hover:text-red-700"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="text-sm">Watch on YouTube</span>
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {sermon ? 'Edit Video Sermon' : 'Add New Video Sermon'}
          </h1>
          <p className="mt-2 text-gray-600">
            {sermon ? 'Update your video sermon details' : 'Add a YouTube video sermon to your collection'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>

      {previewMode ? (
        <VideoSermonPreview />
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* YouTube Information */}
              <Card>
                <CardHeader>
                  <CardTitle>YouTube Video</CardTitle>
                  <CardDescription>
                    Provide the YouTube video URL or ID
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="youtubeUrl">YouTube URL or Video ID</Label>
                    <Input
                      id="youtubeUrl"
                      placeholder="https://www.youtube.com/watch?v=VIDEO_ID or VIDEO_ID"
                      onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtubeId">YouTube ID (auto-extracted)</Label>
                    <Input
                      id="youtubeId"
                      placeholder="11-character YouTube video ID"
                      {...register('youtubeId')}
                      readOnly
                    />
                    {errors.youtubeId && (
                      <p className="text-sm text-red-600">{errors.youtubeId.message}</p>
                    )}
                  </div>

                  {/* YouTube Preview */}
                  {youtubePreview && (
                    <div className="mt-4">
                      <Label>Preview</Label>
                      <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden bg-gray-100 mt-2">
                        <img
                          src={youtubePreview.thumbnail}
                          alt="YouTube thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Sermon Details</CardTitle>
                  <CardDescription>
                    Add the sermon title, speaker, and description
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
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter sermon description..."
                      rows={6}
                      {...register('description')}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                  <CardDescription>
                    Optional details to organize your content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        placeholder="e.g., 45:30"
                        {...register('duration')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Sermon Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !selectedDate && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {currentTags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer">
                          {tag}
                          <X 
                            className="ml-1 h-3 w-3 hover:text-red-600" 
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add a tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddTag}>
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Category and Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Organization</CardTitle>
                  <CardDescription>
                    Categorize and organize your content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={watchedFields.categoryId?.toString() || ''}
                      onValueChange={(value) => setValue('categoryId', value, { shouldDirty: true })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No category</SelectItem>
                        {categories?.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Featured</Label>
                      <p className="text-sm text-gray-600">
                        Show this sermon prominently
                      </p>
                    </div>
                    <Switch
                      checked={watchedFields.isFeatured}
                      onCheckedChange={(checked) => setValue('isFeatured', checked, { shouldDirty: true })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Published</Label>
                      <p className="text-sm text-gray-600">
                        Make this sermon visible to users
                      </p>
                    </div>
                    <Switch
                      checked={watchedFields.isActive}
                      onCheckedChange={(checked) => setValue('isActive', checked, { shouldDirty: true })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isLoading ? 'Saving...' : sermon ? 'Update Video Sermon' : 'Add Video Sermon'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              {sermon && (
                <Card>
                  <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Views</span>
                      <span className="font-medium">{sermon.viewCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Created</span>
                      <span className="font-medium text-sm">
                        {format(new Date(sermon.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Updated</span>
                      <span className="font-medium text-sm">
                        {format(new Date(sermon.updatedAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}