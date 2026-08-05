// src/components/forms/CsgForm.tsx - Shared create/edit form for Community Service Groups (CSGs)

'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2, Upload, Image as ImageIcon, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { csgsApi, uploadApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// Local type for a CSG record - mirrors backend's Csg Prisma model (see backend/prisma/schema.prisma)
export interface Csg {
  id: number;
  name: string;
  description?: string | null;
  meetsOn?: string | null;
  meetingTime?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coverImageUrl?: string | null;
  coverImageCloudinaryPublicId?: string | null;
  memberCount: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const csgSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().optional(),
  meetsOn: z.string().optional(),
  meetingTime: z.string().optional(),
  address: z.string().optional(),
  latitude: z
    .union([z.coerce.number(), z.literal('')])
    .optional()
    .transform((val) => (val === '' || val === undefined ? undefined : val)),
  longitude: z
    .union([z.coerce.number(), z.literal('')])
    .optional()
    .transform((val) => (val === '' || val === undefined ? undefined : val)),
});

type CsgFormData = z.infer<typeof csgSchema>;

interface CsgFormProps {
  csg?: Csg;
}

interface ImageFile {
  file: File;
  url: string;
}

export function CsgForm({ csg }: CsgFormProps) {
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CsgFormData>({
    resolver: zodResolver(csgSchema),
    defaultValues: csg
      ? {
          name: csg.name,
          description: csg.description || '',
          meetsOn: csg.meetsOn || '',
          meetingTime: csg.meetingTime || '',
          address: csg.address || '',
          latitude: csg.latitude ?? undefined,
          longitude: csg.longitude ?? undefined,
        }
      : {
          name: '',
          description: '',
          meetsOn: '',
          meetingTime: '',
          address: '',
          latitude: undefined,
          longitude: undefined,
        },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Please select a valid image file',
          variant: 'destructive',
        });
        return;
      }

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
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    multiple: false,
  });

  const removeImage = () => {
    if (imageFile?.url) {
      URL.revokeObjectURL(imageFile.url);
    }
    setImageFile(null);
  };

  const buildPayload = async (data: CsgFormData) => {
    let uploadResult: { url: string; publicId: string } | null = null;

    if (imageFile) {
      setIsUploading(true);
      uploadResult = await uploadApi.image(imageFile.file);
    }

    return {
      name: data.name,
      description: data.description || undefined,
      meetsOn: data.meetsOn || undefined,
      meetingTime: data.meetingTime || undefined,
      address: data.address || undefined,
      latitude: data.latitude,
      longitude: data.longitude,
      ...(uploadResult && {
        coverImageUrl: uploadResult.url,
        coverImageCloudinaryPublicId: uploadResult.publicId,
      }),
    };
  };

  const createMutation = useMutation({
    mutationFn: async (data: CsgFormData) => {
      const payload = await buildPayload(data);
      return csgsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csgs'] });
      toast({ title: 'Success', description: 'Community Group created successfully' });
      router.push('/dashboard/csgs');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to create Community Group',
        variant: 'destructive',
      });
      setIsUploading(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CsgFormData) => {
      const payload = await buildPayload(data);
      return csgsApi.update(csg!.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csgs'] });
      queryClient.invalidateQueries({ queryKey: ['csg', csg?.id] });
      toast({ title: 'Success', description: 'Community Group updated successfully' });
      router.push('/dashboard/csgs');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to update Community Group',
        variant: 'destructive',
      });
      setIsUploading(false);
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending || isUploading;

  const onSubmit = (data: CsgFormData) => {
    if (csg) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Group Information</CardTitle>
              <CardDescription>Basic details about this Community Service Group</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="e.g., Youth Fellowship" {...register('name')} />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What is this group about?"
                  rows={5}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule &amp; Location</CardTitle>
              <CardDescription>When and where this group meets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meetsOn">Meets On</Label>
                  <Input id="meetsOn" placeholder="e.g., Every Wednesday" {...register('meetsOn')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meetingTime">Meeting Time</Label>
                  <Input id="meetingTime" placeholder="e.g., 6:30 PM" {...register('meetingTime')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="Meeting location address" {...register('address')} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude (Optional)</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="e.g., 6.5244"
                    {...register('latitude')}
                  />
                  {errors.latitude && (
                    <p className="text-sm text-red-600">{errors.latitude.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude (Optional)</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="e.g., 3.3792"
                    {...register('longitude')}
                  />
                  {errors.longitude && (
                    <p className="text-sm text-red-600">{errors.longitude.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cover Image (Optional)</CardTitle>
              <CardDescription>Add a cover image for this group</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!imageFile && !csg?.coverImageUrl && (
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

              {(imageFile || csg?.coverImageUrl) && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <img
                      src={imageFile?.url || csg?.coverImageUrl || ''}
                      alt="Cover"
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{imageFile ? imageFile.file.name : 'Current Image'}</p>
                      <p className="text-sm text-gray-600">
                        {imageFile && `${(imageFile.file.size / 1024 / 1024).toFixed(2)} MB`}
                      </p>
                      {imageFile && (
                        <div className="mt-2">
                          <Button type="button" variant="outline" size="sm" onClick={removeImage}>
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {csg && (
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
                        <p className="text-sm text-gray-600">Click or drag to upload new image</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
                {csg ? 'Update Group' : 'Create Group'}
              </Button>

              <Button type="button" variant="ghost" onClick={() => router.back()} className="w-full">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
