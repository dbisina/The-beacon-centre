// src/components/forms/AnnouncementForm.tsx - Main announcement form component

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Save, Eye, Loader2, Upload, Image as ImageIcon, X, ExternalLink, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { announcementsApi, uploadApi } from '@/lib/api';
import { Announcement } from '@/lib/types';
import { cn } from '@/lib/utils';

// Form validation schema
const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  content: z.string().min(1, 'Content is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    required_error: 'Please select a priority level',
  }),
  startDate: z.date({
    required_error: 'Please select a start date',
  }),
  expiryDate: z.date().optional(),
  actionUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  actionText: z.string().optional(),
  isActive: z.boolean().default(true),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

interface AnnouncementFormProps {
  announcement?: Announcement;
}

interface ImageFile {
  file: File;
  url: string;
}

export function AnnouncementForm({ announcement }: AnnouncementFormProps) {
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    trigger,
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: announcement ? {
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      startDate: new Date(announcement.startDate),
      expiryDate: announcement.expiryDate ? new Date(announcement.expiryDate) : undefined,
      actionUrl: announcement.actionUrl || '',
      actionText: announcement.actionText || '',
      isActive: announcement.isActive,
    } : {
      title: '',
      content: '',
      priority: 'MEDIUM',
      startDate: new Date(),
      expiryDate: undefined,
      actionUrl: '',
      actionText: '',
      isActive: true,
    },
  });

  const watchedValues = watch();

  // Image file handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select a valid image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setImageFile({ file, url });
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    multiple: false,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      let uploadResult = null;

      // Upload image if provided
      if (imageFile) {
        setIsUploading(true);
        setUploadProgress(0);
        uploadResult = await uploadApi.image(imageFile.file);
        setUploadProgress(100);
      }

      const announcementData = {
        ...data,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        expiryDate: data.expiryDate ? format(data.expiryDate, 'yyyy-MM-dd') : undefined,
        actionUrl: data.actionUrl || undefined,
        actionText: data.actionText || undefined,
        ...(uploadResult && {
          imageUrl: uploadResult.url,
          cloudinaryPublicId: uploadResult.publicId,
        }),
      };

      return announcementsApi.create(announcementData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      toast({
        title: 'Success',
        description: 'Announcement created successfully',
        variant: 'success',
      });
      router.push('/dashboard/announcements');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsUploading(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AnnouncementFormData }) => {
      let uploadResult = null;

      // Upload new image if provided
      if (imageFile) {
        setIsUploading(true);
        setUploadProgress(0);
        uploadResult = await uploadApi.image(imageFile.file);
        setUploadProgress(100);
      }

      const announcementData = {
        ...data,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        expiryDate: data.expiryDate ? format(data.expiryDate, 'yyyy-MM-dd') : undefined,
        actionUrl: data.actionUrl || undefined,
        actionText: data.actionText || undefined,
        ...(uploadResult && {
          imageUrl: uploadResult.url,
          cloudinaryPublicId: uploadResult.publicId,
        }),
      };

      return announcementsApi.update(id, announcementData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      queryClient.invalidateQueries(['announcement', announcement?.id]);
      toast({
        title: 'Success',
        description: 'Announcement updated successfully',
        variant: 'success',
      });
      router.push('/dashboard/announcements');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsUploading(false);
    },
  });

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  const onSubmit = (data: AnnouncementFormData) => {
    if (announcement) {
      updateMutation.mutate({ id: announcement.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDateSelect = (field: 'startDate' | 'expiryDate') => (date: Date | undefined) => {
    setValue(field, date);
    trigger(field);
  };

  const removeImage = () => {
    if (imageFile?.url) {
      URL.revokeObjectURL(imageFile.url);
    }
    setImageFile(null);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'MEDIUM':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'LOW':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  if (isPreviewMode) {
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
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-0">
            {(imageFile?.url || announcement?.imageUrl) && (
              <img
                src={imageFile?.url || announcement?.imageUrl}
                alt={watchedValues.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
            )}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getPriorityIcon(watchedValues.priority)}
                  <Badge 
                    variant={
                      watchedValues.priority === 'HIGH' ? 'destructive' :
                      watchedValues.priority === 'MEDIUM' ? 'secondary' :
                      'outline'
                    }
                  >
                    {watchedValues.priority} Priority
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {format(watchedValues.startDate, 'MMM dd, yyyy')}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {watchedValues.title}
              </h3>
              
              <div className="prose max-w-none">
                {watchedValues.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 text-gray-700">{paragraph}</p>
                ))}
              </div>

              {watchedValues.actionUrl && watchedValues.actionText && (
                <div className="mt-6 pt-4 border-t">
                  <Button asChild>
                    <a href={watchedValues.actionUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {watchedValues.actionText}
                    </a>
                  </Button>
                </div>
              )}

              {watchedValues.expiryDate && (
                <div className="mt-4 text-sm text-gray-500">
                  Expires on {format(watchedValues.expiryDate, 'MMM dd, yyyy')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the announcement title, content, and priority level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter announcement title..."
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter announcement content..."
                  rows={8}
                  className="min-h-[200px]"
                  {...register('content')}
                />
                {errors.content && (
                  <p className="text-sm text-red-600">{errors.content.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select 
                  value={watchedValues.priority} 
                  onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => setValue('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Low Priority</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span>Medium Priority</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="HIGH">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span>High Priority</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.priority && (
                  <p className="text-sm text-red-600">{errors.priority.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduling</CardTitle>
              <CardDescription>
                Set when this announcement should be visible
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !watchedValues.startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchedValues.startDate ? format(watchedValues.startDate, 'PPP') : 'Select start date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watchedValues.startDate}
                        onSelect={handleDateSelect('startDate')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && (
                    <p className="text-sm text-red-600">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !watchedValues.expiryDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchedValues.expiryDate ? format(watchedValues.expiryDate, 'PPP') : 'No expiry date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watchedValues.expiryDate}
                        onSelect={handleDateSelect('expiryDate')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Image (Optional)</CardTitle>
              <CardDescription>
                Add an image to make your announcement more engaging
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!imageFile && !announcement?.imageUrl && (
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
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {isDragActive ? 'Drop the image here' : 'Drag & drop image here'}
                  </p>
                  <p className="text-gray-600 mb-4">
                    or click to browse files
                  </p>
                  <Button type="button" variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Image
                  </Button>
                  <p className="text-xs text-gray-500 mt-4">
                    Maximum file size: 10MB. Supported formats: PNG, JPG, JPEG, GIF, WebP
                  </p>
                </div>
              )}

              {(imageFile || announcement?.imageUrl) && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <img 
                      src={imageFile?.url || announcement?.imageUrl} 
                      alt="Announcement"
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {imageFile ? imageFile.file.name : 'Current Image'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {imageFile && `${(imageFile.file.size / 1024 / 1024).toFixed(2)} MB`}
                      </p>
                      <div className="mt-2 space-x-2">
                        {!announcement && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {announcement && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-2">
                        Upload a new image to replace the current one:
                      </p>
                      <div
                        {...getRootProps()}
                        className="border border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:border-teal-400 hover:bg-gray-50"
                      >
                        <input {...getInputProps()} />
                        <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click or drag to upload new image
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
                    <span>Uploading image...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card>
            <CardHeader>
              <CardTitle>Call to Action (Optional)</CardTitle>
              <CardDescription>
                Add a button with a link for users to take action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="actionText">Button Text</Label>
                <Input
                  id="actionText"
                  placeholder="e.g., Learn More, Register Now, Contact Us"
                  {...register('actionText')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actionUrl">Button URL</Label>
                <Input
                  id="actionUrl"
                  placeholder="https://example.com"
                  {...register('actionUrl')}
                />
                {errors.actionUrl && (
                  <p className="text-sm text-red-600">{errors.actionUrl.message}</p>
                )}
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
                {announcement ? 'Update Announcement' : 'Create Announcement'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPreviewMode(true)}
                className="w-full"
                disabled={!watchedValues.title || !watchedValues.content}
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
                  <Label htmlFor="active">Active Status</Label>
                  <p className="text-sm text-gray-600">
                    Make this announcement visible to users
                  </p>
                </div>
                <Switch
                  id="active"
                  checked={watchedValues.isActive}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>• Use clear, concise titles that grab attention</p>
              <p>• High priority announcements appear first</p>
              <p>• Add images to increase engagement</p>
              <p>• Set expiry dates for time-sensitive announcements</p>
              <p>• Use call-to-action buttons for important links</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}