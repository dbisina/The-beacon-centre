// beacon-admin/src/app/dashboard/video-sermons/shorts/new/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import YouTubeVideoForm from '@/components/forms/YoutubeVideoForm';
import { videoSermonsApi } from '@/lib/api';
import { toast } from 'sonner';

interface ShortFormData {
  youtubeUrl: string;
  youtubeId: string;
  title: string;
  speaker: string;
  description?: string;
  categoryId?: string;
  sermonDate?: string;
  isFeatured: boolean;
  tags?: string;
  videoInfo?: any;
}

export default function NewShortPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createShort = useMutation({
    mutationFn: async (data: ShortFormData) => {
      const apiData = {
        youtubeId: data.youtubeId,
        title: data.title,
        speaker: data.speaker,
        description: data.description || '',
        kind: 'EXCERPT' as const,
        categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
        sermonDate: data.sermonDate || undefined,
        isFeatured: data.isFeatured,
        tags: data.tags ? data.tags.split(',').map((tag) => tag.trim()) : [],
        ...(data.videoInfo && {
          thumbnailUrl: data.videoInfo.thumbnails.high || data.videoInfo.thumbnails.medium,
          duration: data.videoInfo.duration,
        }),
      };
      return videoSermonsApi.create(apiData);
    },
    onSuccess: () => {
      toast.success('Short added successfully!');
      queryClient.invalidateQueries({ queryKey: ['video-sermons'] });
      router.push('/dashboard/video-sermons');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Failed to add short. Please try again.');
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/video-sermons">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Videos
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add a Short</h1>
          <p className="text-gray-600 mt-1">
            A short clip cut from a sermon, or a standalone quick word - shows in the app's Shorts rail.
          </p>
        </div>
      </div>

      <YouTubeVideoForm
        onSubmit={(data) => createShort.mutateAsync(data)}
        isLoading={createShort.isPending}
        mode="create"
        lockKind="EXCERPT"
      />
    </div>
  );
}
