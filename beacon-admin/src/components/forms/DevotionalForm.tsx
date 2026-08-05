// components/Forms/DevotionalForm.tsx - Create/Edit devotional form

'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import { CalendarIcon, Save, Eye, X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { uploadApi } from '@/lib/api';
import { Devotional, CreateDevotionalForm } from '@/lib/types';

interface CardImageFile {
  file: File;
  url: string;
}

const devotionalSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  verseText: z.string().min(1, 'Verse text is required'),
  verseReference: z.string().min(1, 'Verse reference is required').max(100, 'Reference must be less than 100 characters'),
  content: z.string().min(1, 'Content is required'),
  prayer: z.string().optional(),
  isActive: z.boolean().default(true),
});

type DevotionalFormData = z.infer<typeof devotionalSchema>;

interface DevotionalFormProps {
  devotional?: Devotional;
  onSubmit: (data: CreateDevotionalForm) => Promise<void>;
  isLoading?: boolean;
}

export default function DevotionalForm({ devotional, onSubmit, isLoading = false }: DevotionalFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    devotional ? new Date(devotional.date) : new Date()
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [cardImage, setCardImage] = useState<CardImageFile | null>(null);
  const [cardImageRemoved, setCardImageRemoved] = useState(false);
  const [isUploadingCard, setIsUploadingCard] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const existingCardImageUrl = (devotional as any)?.cardImageUrl as string | undefined;

  const onDropCardImage = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Error', description: 'Please select a valid image file', variant: 'destructive' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'Error', description: 'Image size must be less than 10MB', variant: 'destructive' });
        return;
      }
      setCardImage({ file, url: URL.createObjectURL(file) });
      setCardImageRemoved(false);
    },
    [toast]
  );

  const { getRootProps: getCardImageRootProps, getInputProps: getCardImageInputProps, isDragActive: isCardImageDragActive } = useDropzone({
    onDrop: onDropCardImage,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    multiple: false,
  });

  const removeCardImage = () => {
    setCardImage(null);
    setCardImageRemoved(true);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    reset,
  } = useForm<DevotionalFormData>({
    resolver: zodResolver(devotionalSchema),
    defaultValues: {
      date: devotional ? format(new Date(devotional.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      title: devotional?.title || '',
      verseText: devotional?.verseText || '',
      verseReference: devotional?.verseReference || '',
      content: devotional?.content || '',
      prayer: devotional?.prayer || '',
      isActive: devotional?.isActive ?? true,
    },
  });

  const watchedFields = watch();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setValue('date', format(date, 'yyyy-MM-dd'), { shouldDirty: true });
    }
  };

  const handleFormSubmit = async (data: DevotionalFormData) => {
    try {
      let cardImagePayload: { cardImageUrl?: string; cardImageCloudinaryPublicId?: string } = {};

      if (cardImage) {
        setIsUploadingCard(true);
        const uploadResult = await uploadApi.image(cardImage.file);
        setIsUploadingCard(false);
        cardImagePayload = { cardImageUrl: uploadResult.url, cardImageCloudinaryPublicId: uploadResult.publicId };
      } else if (cardImageRemoved) {
        cardImagePayload = { cardImageUrl: '', cardImageCloudinaryPublicId: '' };
      }

      await onSubmit({ ...data, ...cardImagePayload } as any);
      toast({
        title: 'Success',
        description: `Devotional ${devotional ? 'updated' : 'created'} successfully`,
      });
      if (!devotional) {
        reset();
        setSelectedDate(new Date());
        setCardImage(null);
        setCardImageRemoved(false);
      }
    } catch (error: any) {
      setIsUploadingCard(false);
      toast({
        title: 'Error',
        description: error?.message || `Failed to ${devotional ? 'update' : 'create'} devotional`,
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
  const DevotionalPreview = () => (
    <div className="max-w-2xl mx-auto space-y-6 p-6 bg-white rounded-lg border">
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">{watchedFields.title || 'Devotional Title'}</h1>
        <p className="text-sm text-gray-600 mt-2">
          {selectedDate ? format(selectedDate, 'EEEE, MMMM dd, yyyy') : 'Select Date'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
          <h3 className="font-semibold text-teal-900 mb-2">Today's Verse</h3>
          <blockquote className="text-teal-800 italic mb-2">
            "{watchedFields.verseText || 'Verse text will appear here...'}"
          </blockquote>
          <cite className="text-sm font-medium text-teal-700">
            — {watchedFields.verseReference || 'Reference'}
          </cite>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Reflection</h3>
          <div className="prose prose-sm max-w-none text-gray-700">
            {watchedFields.content ? (
              watchedFields.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-3">{paragraph}</p>
              ))
            ) : (
              <p className="text-gray-400 italic">Devotional content will appear here...</p>
            )}
          </div>
        </div>

        {watchedFields.prayer && (
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-semibold text-blue-900 mb-2">Prayer</h3>
            <div className="text-blue-800">
              {watchedFields.prayer.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-2">{paragraph}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t text-center">
        <Badge variant={watchedFields.isActive ? 'default' : 'secondary'}>
          {watchedFields.isActive ? 'Published' : 'Draft'}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {devotional ? 'Edit Devotional' : 'Create New Devotional'}
          </h1>
          <p className="mt-2 text-gray-600">
            {devotional ? 'Update your devotional content' : 'Create inspiring daily content for your community'}
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
        <DevotionalPreview />
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Set the title, date, and main content for your devotional
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Date Picker */}
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
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
                    {errors.date && (
                      <p className="text-sm text-red-600">{errors.date.message}</p>
                    )}
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter devotional title..."
                      {...register('title')}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Scripture Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Scripture</CardTitle>
                  <CardDescription>
                    Add the Bible verse that anchors this devotional
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verseReference">Verse Reference</Label>
                    <Input
                      id="verseReference"
                      placeholder="e.g., John 3:16, Psalm 23:1-3"
                      {...register('verseReference')}
                    />
                    {errors.verseReference && (
                      <p className="text-sm text-red-600">{errors.verseReference.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="verseText">Verse Text</Label>
                    <Textarea
                      id="verseText"
                      placeholder="Enter the complete verse text..."
                      rows={4}
                      {...register('verseText')}
                    />
                    {errors.verseText && (
                      <p className="text-sm text-red-600">{errors.verseText.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Card Image */}
              <Card>
                <CardHeader>
                  <CardTitle>Shareable Card Image</CardTitle>
                  <CardDescription>
                    Upload a background image for this devotional's shareable card
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!cardImage && !cardImageRemoved && !existingCardImageUrl && (
                    <div
                      {...getCardImageRootProps()}
                      className={cn(
                        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                        isCardImageDragActive
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
                      )}
                    >
                      <input {...getCardImageInputProps()} />
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {isCardImageDragActive ? 'Drop the image here' : 'Drag & drop image here'}
                      </p>
                      <p className="text-gray-600 mb-4">or click to browse files</p>
                      <Button type="button" variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Choose Image
                      </Button>
                      <p className="text-xs text-gray-500 mt-4">
                        Maximum file size: 10MB. Supported formats: PNG, JPG, JPEG, GIF, WebP
                      </p>
                    </div>
                  )}

                  {(cardImage || (existingCardImageUrl && !cardImageRemoved)) && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start space-x-4">
                        <img
                          src={cardImage?.url || existingCardImageUrl || ''}
                          alt="Devotional card"
                          className="w-24 h-24 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{cardImage ? cardImage.file.name : 'Current card image'}</p>
                          <p className="text-sm text-gray-600">
                            {cardImage && `${(cardImage.file.size / 1024 / 1024).toFixed(2)} MB`}
                          </p>
                          <div className="mt-2">
                            <Button type="button" variant="outline" size="sm" onClick={removeCardImage}>
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {cardImageRemoved && (
                    <div
                      {...getCardImageRootProps()}
                      className="border border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:border-teal-400 hover:bg-gray-50"
                    >
                      <input {...getCardImageInputProps()} />
                      <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click or drag to upload a new image</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Content Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Devotional Content</CardTitle>
                  <CardDescription>
                    Write the main reflection and teaching content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content">Main Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Write your devotional content here..."
                      rows={12}
                      {...register('content')}
                    />
                    {errors.content && (
                      <p className="text-sm text-red-600">{errors.content.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prayer">Prayer (Optional)</Label>
                    <Textarea
                      id="prayer"
                      placeholder="Add a closing prayer..."
                      rows={4}
                      {...register('prayer')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publish Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Publish Settings</CardTitle>
                  <CardDescription>
                    Control how this devotional is published
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Status</Label>
                      <p className="text-sm text-gray-600">
                        Make this devotional visible to users
                      </p>
                    </div>
                    <Switch
                      {...register('isActive')}
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
                      disabled={isLoading || isUploadingCard}
                      className="w-full"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isUploadingCard ? 'Uploading image...' : isLoading ? 'Saving...' : devotional ? 'Update Devotional' : 'Create Devotional'}
                    </Button>
                    
                    {!devotional && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setValue('isActive', false);
                          handleSubmit(handleFormSubmit)();
                        }}
                        disabled={isLoading}
                      >
                        Save as Draft
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              {devotional && (
                <Card>
                  <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Views</span>
                      <span className="font-medium">{devotional.viewCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Created</span>
                      <span className="font-medium text-sm">
                        {format(new Date(devotional.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Updated</span>
                      <span className="font-medium text-sm">
                        {format(new Date(devotional.updatedAt), 'MMM dd, yyyy')}
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