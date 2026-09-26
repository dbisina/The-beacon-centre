// src/components/forms/CsgForm.tsx - Shared create/edit form for Community Service Groups (CSGs)

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { csgsApi } from '@/lib/api';
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

export function CsgForm({ csg }: CsgFormProps) {
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

  // Groups have no cover image any more: the app shows each community as its
  // own name, schedule and members, so a photo upload here would go nowhere.
  const buildPayload = async (data: CsgFormData) => {
    return {
      name: data.name,
      description: data.description || undefined,
      meetsOn: data.meetsOn || undefined,
      meetingTime: data.meetingTime || undefined,
      address: data.address || undefined,
      latitude: data.latitude,
      longitude: data.longitude,
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
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

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
