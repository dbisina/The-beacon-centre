// src/app/dashboard/video-sermons/[id]/edit/page.tsx - Edit video sermon page
'use client';

import React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import YouTubeVideoForm from '@/components/forms/YoutubeVideoForm';
import { videoSermonsApi } from '@/lib/api';

interface EditVideoSermonPageProps {
  params: {
    id: string;
  };
}

export default function EditVideoSermonPage({ params }: EditVideoSermonPageProps) {
  const sermonId = parseInt(params.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sermon, isLoading, error } = useQuery({
    queryKey: ['video-sermon', sermonId],
    queryFn: () => videoSermonsApi.getById(sermonId),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      videoSermonsApi.update(sermonId, {
        title: data.title,
        speaker: data.speaker,
        youtubeId: data.youtubeId,
        description: data.description || undefined,
        kind: data.kind,
        series: data.series || undefined,
        categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
        sermonDate: data.sermonDate || undefined,
        isFeatured: data.isFeatured,
        tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()) : undefined,
        ...(data.videoInfo && {
          thumbnailUrl: data.videoInfo.thumbnails.high || data.videoInfo.thumbnails.medium,
          duration: data.videoInfo.duration,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-sermons'] });
      queryClient.invalidateQueries({ queryKey: ['video-sermon', sermonId] });
      toast({ title: 'Success', description: 'Video sermon updated', variant: 'success' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to update video sermon',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !sermon) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Video sermon not found</h3>
        <p className="text-gray-500 mt-2">The video sermon you're looking for doesn't exist.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/video-sermons">Back to Video Sermons</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/video-sermons">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Video Sermon</h1>
          <p className="text-gray-600">Update video sermon details</p>
        </div>
      </div>

      <YouTubeVideoForm
        mode="edit"
        isLoading={updateMutation.isPending}
        onSubmit={(data) => updateMutation.mutateAsync(data)}
        initialData={{
          youtubeUrl: `https://youtube.com/watch?v=${sermon.youtubeId}`,
          youtubeId: sermon.youtubeId,
          title: sermon.title,
          speaker: sermon.speaker,
          description: sermon.description || '',
          kind: sermon.kind || 'SERMON',
          series: sermon.series || '',
          categoryId: sermon.categoryId ? String(sermon.categoryId) : '',
          sermonDate: sermon.sermonDate ? sermon.sermonDate.slice(0, 10) : '',
          isFeatured: sermon.isFeatured,
          tags: Array.isArray(sermon.tags) ? sermon.tags.join(', ') : '',
        }}
      />
    </div>
  );
}
