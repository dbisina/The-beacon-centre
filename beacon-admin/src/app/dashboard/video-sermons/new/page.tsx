// app/dashboard/video-sermons/new/page.tsx - Create new video sermon

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import VideoSermonForm from '@/components/Forms/VideoSermonForm';
import { videoSermonsApi } from '@/lib/api';
import { CreateVideoSermonForm } from '@/lib/types';

export default function NewVideoSermonPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateVideoSermonForm) => videoSermonsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-sermons'] });
      router.push('/dashboard/video-sermons');
    },
  });

  const handleSubmit = async (data: CreateVideoSermonForm) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <VideoSermonForm
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending}
    />
  );
}