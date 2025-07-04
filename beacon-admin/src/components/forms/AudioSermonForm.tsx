// src/components/forms/AudioSermonForm.tsx - Main audio sermon form component

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Save, Loader2, Upload, FileAudio, X, Play, Pause, Star, StarOff } from 'lucide-react';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { audioSermonsApi, categoriesApi, uploadApi } from '@/lib/api';
import { AudioSermon } from '@/lib/types';
import { cn, formatFileSize, formatDuration } from '@/lib/utils';

// Form validation schema
const audioSermonSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  speaker: z.string().min(1, 'Speaker is required').max(255, 'Speaker name must be less than 255 characters'),
  description: z.string().optional(),
  category: z.string().optional(),
  sermonDate: z.date().optional(),
  isFeatured: z.boolean().default(false),
});

type AudioSermonFormData = z.infer<typeof audioSermonSchema>;

interface AudioSermonFormProps {
  sermon?: AudioSermon;
  onSuccess?: (result: any) => void;
}

interface AudioFile {
  file: File;
  url: string;
  duration?: number;
}

export function AudioSermonForm({ sermon, onSuccess }: AudioSermonFormProps) {
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [audioPreview, setAudioPreview] = useState<{
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    audio: HTMLAudioElement | null;
  }>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    audio: null,
  });

  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    trigger,
  } = useForm<AudioSermonFormData>({
    resolver: zodResolver(audioSermonSchema),
    defaultValues: sermon ? {
      title: sermon.title,
      speaker: sermon.speaker,
      description: sermon.description || '',
      category: sermon.category || 'none',
      sermonDate: sermon.sermonDate ? new Date(sermon.sermonDate) : undefined,
      isFeatured: sermon.isFeatured,
    } : {
      title: '',
      speaker: '',
      description: '',
      category: 'none',
      sermonDate: undefined,
      isFeatured: false,
    },
  });

  const watchedValues = watch();

  // Fetch categories
  const { data: categories, error: categoriesError, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  // Then, handle the error in a useEffect:
  useEffect(() => {
    if (categoriesError) {
      console.error('Failed to fetch categories:', categoriesError);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    }
  }, [categoriesError, toast]);

  // Debug categories data
  console.log('Categories data:', categories);
  console.log('Categories type:', typeof categories);
  console.log('Is categories array?', Array.isArray(categories));

  // Audio file handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast({
        title: 'Error',
        description: 'Please select a valid audio file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 100MB',
        variant: 'destructive',
      });
      return;
    }

    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    
    audio.addEventListener('loadedmetadata', () => {
      setAudioFile({
        file,
        url,
        duration: audio.duration,
      });

      // Auto-fill title if empty
      if (!watchedValues.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setValue('title', nameWithoutExt);
        trigger('title');
      }
    });

    audio.addEventListener('error', () => {
      toast({
        title: 'Error',
        description: 'Invalid audio file format',
        variant: 'destructive',
      });
    });
  }, [watchedValues.title, setValue, trigger, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'],
    },
    multiple: false,
  });

  // Audio preview controls
  const setupAudioPreview = (audio: HTMLAudioElement) => {
    const updateTime = () => {
      setAudioPreview(prev => ({
        ...prev,
        currentTime: audio.currentTime,
      }));
    };

    const updateDuration = () => {
      setAudioPreview(prev => ({
        ...prev,
        duration: audio.duration,
      }));
    };

    const handleEnded = () => {
      setAudioPreview(prev => ({
        ...prev,
        isPlaying: false,
      }));
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  };

  const toggleAudioPreview = () => {
    const audioSrc = audioFile?.url || sermon?.audioUrl;
    if (!audioSrc) return;

    if (!audioPreview.audio) {
      const audio = new Audio(audioSrc);
      setAudioPreview(prev => ({ ...prev, audio }));
      setupAudioPreview(audio);
      audio.play();
      setAudioPreview(prev => ({ ...prev, isPlaying: true }));
    } else {
      if (audioPreview.isPlaying) {
        audioPreview.audio.pause();
        setAudioPreview(prev => ({ ...prev, isPlaying: false }));
      } else {
        audioPreview.audio.play();
        setAudioPreview(prev => ({ ...prev, isPlaying: true }));
      }
    }
  };

  const onSubmit = async (data: AudioSermonFormData) => {
    if (sermon?.id) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // FIXED: Add success handlers to mutations
  const createMutation = useMutation({
    mutationFn: async (data: AudioSermonFormData) => {
      if (!audioFile) {
        throw new Error('Please select an audio file');
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Upload audio file
        const uploadResult = await uploadApi.audio(audioFile.file);
        setUploadProgress(100);

        // Create sermon record
        const sermonData = {
          ...data,
          category: data.category === 'none' ? undefined : data.category,
          audioUrl: uploadResult.url,
          cloudinaryPublicId: uploadResult.publicId,
          duration: uploadResult.duration || (audioFile.duration ? formatDuration(audioFile.duration) : undefined),
          fileSize: uploadResult.fileSize,
          sermonDate: data.sermonDate ? new Date(data.sermonDate).toISOString() : undefined,
        };

        const result = await audioSermonsApi.create(sermonData);
        return result;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (result) => {
      toast({
        title: 'Success',
        description: 'Audio sermon created successfully!',
      });
      
      // Invalidate audio-sermons list so it refreshes
      queryClient.invalidateQueries({ queryKey: ["audio-sermons"] });
      
      // Reset form
      reset();
      setAudioFile(null);
      setAudioPreview({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        audio: null,
      });
      
      // Call success callback
      onSuccess?.(result);
    },
    onError: (error: any) => {
      console.error('Failed to create audio sermon:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create audio sermon',
        variant: 'destructive',
      });
    },
  });

  // FIXED: Add update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: AudioSermonFormData) => {
      if (!sermon?.id) throw new Error('Sermon ID is required for updates');

      const updateData: any = {
        ...data,
        category: data.category === 'none' ? undefined : data.category,
        sermonDate: data.sermonDate ? new Date(data.sermonDate).toISOString() : undefined,
      };

      // Only upload new audio if file is selected
      if (audioFile) {
        setIsUploading(true);
        setUploadProgress(0);

        try {
          const uploadResult = await uploadApi.audio(audioFile.file);
          setUploadProgress(100);
          
          updateData.audioUrl = uploadResult.url;
          updateData.cloudinaryPublicId = uploadResult.publicId;
          updateData.duration = uploadResult.duration || (audioFile.duration ? formatDuration(audioFile.duration) : undefined);
          updateData.fileSize = uploadResult.fileSize;
        } finally {
          setIsUploading(false);
        }
      }

      return await audioSermonsApi.update(sermon.id, updateData);
    },
    onSuccess: (result) => {
      toast({
        title: 'Success',
        description: 'Audio sermon updated successfully!',
      });
      onSuccess?.(result);
    },
    onError: (error: any) => {
      console.error('Failed to update audio sermon:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update audio sermon',
        variant: 'destructive',
      });
    },
  });


  const isLoading = createMutation.isPending || updateMutation.isPending || isUploading;


  const handleDateSelect = (date: Date | undefined) => {
    setValue('sermonDate', date);
    trigger('sermonDate');
  };

  const removeAudioFile = () => {
    if (audioFile?.url) {
      URL.revokeObjectURL(audioFile.url);
    }
    if (audioPreview.audio) {
      audioPreview.audio.pause();
      setAudioPreview({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        audio: null,
      });
    }
    setAudioFile(null);
  };

  const progressPercentage = audioPreview.duration > 0 
    ? (audioPreview.currentTime / audioPreview.duration) * 100 
    : 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Audio Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Audio File</CardTitle>
              <CardDescription>
                Upload your sermon audio file (MP3, WAV, M4A, AAC, OGG, FLAC)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!audioFile && !sermon?.audio_url && (
                <div
                  {...getRootProps()}
                  className={cn(
                    'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                    isDragActive 
                      ? 'border-teal-500 bg-teal-50' 
                      : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
                  )}
                >
                  <input {...getInputProps()} />
                  <FileAudio className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {isDragActive ? 'Drop the audio file here' : 'Drag & drop audio file here'}
                  </p>
                  <p className="text-gray-600 mb-4">
                    or click to browse files
                  </p>
                  <Button type="button" variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                  <p className="text-xs text-gray-500 mt-4">
                    Maximum file size: 100MB. Supported formats: MP3, WAV, M4A, AAC, OGG, FLAC
                  </p>
                </div>
              )}

              {(audioFile || sermon?.audioUrl) && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <FileAudio className="h-8 w-8 text-teal-600" />
                      <div>
                        <p className="font-medium">
                          {audioFile ? audioFile.file.name : 'Current Audio File'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {audioFile && formatFileSize(audioFile.file.size)}
                          {audioFile?.duration && ` • ${formatDuration(audioFile.duration)}`}
                          {sermon?.duration && ` • ${sermon.duration}`}
                        </p>
                      </div>
                    </div>
                    {!sermon && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeAudioFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Audio Preview Controls */}
                  <div className="flex items-center space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleAudioPreview}
                    >
                      {audioPreview.isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                    <span className="text-sm text-gray-600 min-w-20">
                      {audioPreview.duration > 0 
                        ? `${formatDuration(audioPreview.currentTime)} / ${formatDuration(audioPreview.duration)}`
                        : '--:-- / --:--'
                      }
                    </span>
                  </div>

                  {sermon && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-2">
                        Upload a new file to replace the current audio:
                      </p>
                      <div
                        {...getRootProps()}
                        className="border border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:border-teal-400 hover:bg-gray-50"
                      >
                        <input {...getInputProps()} />
                        <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click or drag to upload new audio file
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading audio file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sermon Details */}
          <Card>
            <CardHeader>
              <CardTitle>Sermon Details</CardTitle>
              <CardDescription>
                Enter the sermon title, speaker, and other information
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
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending || isUploading}
              className="min-w-[120px]"
            >
              {createMutation.isPending || updateMutation.isPending || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {sermon ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                sermon ? 'Update Sermon' : 'Create Sermon'
              )}
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
                  <Label htmlFor="featured">Featured Sermon</Label>
                  <p className="text-sm text-gray-600">
                    Show this sermon prominently in the app
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

          {/* File Info */}
          <Card>
            <CardHeader>
              <CardTitle>File Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Format:</span>
                <span>{audioFile ? audioFile.file.type : sermon ? 'MP3' : 'Not selected'}</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span>
                  {audioFile ? formatFileSize(audioFile.file.size) : 
                   sermon?.file_size ? formatFileSize(sermon.file_size) : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>
                  {audioFile?.duration ? formatDuration(audioFile.duration) :
                   sermon?.duration || 'Unknown'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>• Use MP3 format for best compatibility</p>
              <p>• Keep file sizes under 100MB when possible</p>
              <p>• Use descriptive titles for easy discovery</p>
              <p>• Add categories to organize content</p>
              <p>• Featured sermons appear first in the app</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}