// src/components/forms/ProjectForm.tsx - Shared create/edit form for Giving Projects

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CalendarIcon,
  Save,
  Loader2,
  Upload,
  Image as ImageIcon,
  X,
  Target,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { projectsApi, uploadApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// Local type for the Projects resource - the backend serializes BigInt money
// columns (targetAmount/raisedAmount) as strings, see backend/src/server.ts.
export interface Project {
  id: number;
  title: string;
  blurb: string | null;
  description: string | null;
  imageUrl: string | null;
  cloudinaryPublicId: string | null;
  targetAmount: string; // kobo
  raisedAmount: string; // kobo
  donorCount: number;
  progressPct: number;
  deadline: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const formatNaira = (kobo: string | number): string => {
  const naira = Number(kobo) / 100;
  return `₦${naira.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  blurb: z.string().max(500, 'Blurb must be less than 500 characters').optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  targetAmount: z.coerce
    .number({ invalid_type_error: 'Target amount is required' })
    .positive('Target amount must be greater than 0'),
  deadline: z.date().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: Project;
}

interface ImageFile {
  file: File;
  url: string;
}

export function ProjectForm({ project }: ProjectFormProps) {
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? {
          title: project.title,
          blurb: project.blurb || '',
          description: project.description || '',
          targetAmount: Number(project.targetAmount) / 100,
          deadline: project.deadline ? new Date(project.deadline) : undefined,
        }
      : {
          title: '',
          blurb: '',
          description: '',
          targetAmount: undefined,
          deadline: undefined,
        },
  });

  const watchedValues = watch();

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

  const buildPayload = async (data: ProjectFormData) => {
    let uploadResult: { url: string; publicId: string } | null = null;

    if (imageFile) {
      setIsUploading(true);
      uploadResult = await uploadApi.image(imageFile.file);
    }

    return {
      title: data.title,
      blurb: data.blurb || undefined,
      description: data.description || undefined,
      targetAmount: data.targetAmount,
      deadline: data.deadline ? format(data.deadline, 'yyyy-MM-dd') : undefined,
      ...(uploadResult && {
        imageUrl: uploadResult.url,
        cloudinaryPublicId: uploadResult.publicId,
      }),
    };
  };

  const createMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => projectsApi.create(await buildPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Success',
        description: 'Project created successfully',
        variant: 'success',
      });
      router.push('/dashboard/giving?tab=projects');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create project',
        variant: 'destructive',
      });
      setIsUploading(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProjectFormData) =>
      projectsApi.update(project!.id, await buildPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', project?.id] });
      toast({
        title: 'Success',
        description: 'Project updated successfully',
        variant: 'success',
      });
      router.push('/dashboard/giving?tab=projects');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update project',
        variant: 'destructive',
      });
      setIsUploading(false);
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending || isUploading;

  const onSubmit = (data: ProjectFormData) => {
    if (project) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const removeImage = () => {
    if (imageFile?.url) {
      URL.revokeObjectURL(imageFile.url);
    }
    setImageFile(null);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                The title and copy shown for this project in the mobile app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="e.g. New Sanctuary Roof" {...register('title')} />
                {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="blurb">Short Blurb (Optional)</Label>
                <Textarea
                  id="blurb"
                  placeholder="A one or two line summary shown on project cards..."
                  rows={2}
                  {...register('blurb')}
                />
                {errors.blurb && <p className="text-sm text-red-600">{errors.blurb.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Full project details shown on the project's page..."
                  rows={8}
                  className="min-h-[160px]"
                  {...register('description')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Funding</CardTitle>
              <CardDescription>Set the funding target and an optional deadline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount (₦)</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 500000"
                    {...register('targetAmount')}
                  />
                  {errors.targetAmount && (
                    <p className="text-sm text-red-600">{errors.targetAmount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !watchedValues.deadline && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchedValues.deadline ? format(watchedValues.deadline, 'PPP') : 'No deadline'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watchedValues.deadline}
                        onSelect={(date) => setValue('deadline', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Image (Optional)</CardTitle>
              <CardDescription>Cover image shown for this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!imageFile && !project?.imageUrl && (
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

              {(imageFile || project?.imageUrl) && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <img
                      src={imageFile?.url || project?.imageUrl || ''}
                      alt="Project"
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

                  {project && (
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
                {project ? 'Update Project' : 'Create Project'}
              </Button>

              <Button type="button" variant="ghost" onClick={() => router.back()} className="w-full">
                Cancel
              </Button>
            </CardContent>
          </Card>

          {project && (
            <Card>
              <CardHeader>
                <CardTitle>Progress (Read-only)</CardTitle>
                <CardDescription>
                  Computed automatically from successful giving transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{project.progressPct}% funded</span>
                    <span className="font-medium">
                      {formatNaira(project.raisedAmount)} / {formatNaira(project.targetAmount)}
                    </span>
                  </div>
                  <Progress value={project.progressPct} />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Target className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Target</p>
                      <p className="text-sm font-medium">{formatNaira(project.targetAmount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Donors</p>
                      <p className="text-sm font-medium">{project.donorCount}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
}
