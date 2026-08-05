'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, CheckCircle2, ImageIcon, Loader2, Save, Star, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { collagesApi, uploadApi } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRole } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StagedPhoto {
  file: File;
  previewUrl: string;
}

function NewCollagePageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [photos, setPhotos] = useState<StagedPhoto[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const staged = accepted
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...staged]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: true,
  });

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
    setCoverIndex((prev) => {
      if (index === prev) return 0;
      if (index < prev) return prev - 1;
      return prev;
    });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      // Upload every staged photo first (parallel), tracking progress, then
      // create the collage from the resulting Cloudinary URLs.
      setUploadProgress({ done: 0, total: photos.length });
      const uploaded = await Promise.all(
        photos.map(async (p) => {
          const result = await uploadApi.image(p.file);
          setUploadProgress((prev) => (prev ? { ...prev, done: prev.done + 1 } : prev));
          return { url: result.url, publicId: result.publicId };
        })
      );
      setUploadProgress(null);
      return collagesApi.create({ date, photos: uploaded, coverIndex });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['collages']);
      toast({ title: 'Success', description: 'Collage created', variant: 'success' });
      router.push('/dashboard/collages');
    },
    onError: (error: any) => {
      setUploadProgress(null);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to create collage',
        variant: 'destructive',
      });
    },
  });

  const canSubmit = photos.length > 0 && !createMutation.isPending;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/collages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Collage</h1>
          <p className="text-gray-600">Add this Sunday's photos and pick the cover shot.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Date</CardTitle>
              <CardDescription>The day these photos are from - one collage per date.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>
                Drag &amp; drop or select multiple images. Click a photo to mark it as the cover - that's what shows
                on the app's home screen and in the gallery archive list.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  isDragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
                )}
              >
                <input {...getInputProps()} />
                <ImageIcon className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                <p className="font-medium text-gray-900">{isDragActive ? 'Drop the photos here' : 'Drag & drop photos here'}</p>
                <p className="text-gray-600 text-sm mt-1">or click to browse - select as many as you like</p>
                <Button type="button" variant="outline" className="mt-4">
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Photos
                </Button>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {photos.map((p, i) => (
                    <div
                      key={p.previewUrl}
                      onClick={() => setCoverIndex(i)}
                      className={cn(
                        'relative rounded-lg overflow-hidden cursor-pointer border-4 aspect-square',
                        i === coverIndex ? 'border-teal-500' : 'border-transparent'
                      )}
                    >
                      <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                      {i === coverIndex && (
                        <div className="absolute top-1 left-1 bg-teal-500 text-white rounded-full p-1">
                          <Star className="h-3 w-3 fill-current" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(i);
                        }}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {photos.length > 0 && (
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  {photos.length} photo{photos.length === 1 ? '' : 's'} staged, cover selected
                </p>
              )}
              {uploadProgress && (
                <p className="text-sm text-gray-600">
                  Uploading {uploadProgress.done}/{uploadProgress.total}…
                </p>
              )}
              <Button
                type="button"
                disabled={!canSubmit}
                onClick={() => createMutation.mutate()}
                className="w-full"
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Create Collage
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.back()} className="w-full">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function NewCollagePage() {
  return (
    <ProtectedRoute requireRole={[AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.EDITOR]}>
      <NewCollagePageContent />
    </ProtectedRoute>
  );
}
