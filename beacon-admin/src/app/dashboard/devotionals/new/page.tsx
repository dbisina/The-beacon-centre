'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DevotionalForm from '@/components/Forms/DevotionalForm';
import { devotionalsApi } from '@/lib/api';
import { CreateDevotionalForm } from '@/lib/types';

export default function NewDevotionalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateDevotionalForm) => devotionalsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devotionals'] });
      router.push('/dashboard/devotionals');
    },
  });

  const handleSubmit = async (data: CreateDevotionalForm) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <DevotionalForm
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending}
    />
  );
}