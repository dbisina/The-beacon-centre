// beacon-admin/src/app/dashboard/video-sermons/new/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Video, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import YouTubeVideoForm from '@/components/forms/YoutubeVideoForm';
import { videoSermonsApi } from '@/lib/api';
import { youtubeUtils } from '@/lib/youtube';
import { toast } from 'sonner';

interface VideoSermonData {
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

export default function NewVideoSermonPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createVideoSermon = useMutation({
    mutationFn: async (data: VideoSermonData) => {
      // Transform the data for the API
      const apiData = {
        youtubeId: data.youtubeId,
        title: data.title,
        speaker: data.speaker,
        description: data.description || '',
        categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
        sermonDate: data.sermonDate || undefined,
        isFeatured: data.isFeatured,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
        // Include metadata from YouTube API if available
        ...(data.videoInfo && {
          thumbnailUrl: data.videoInfo.thumbnails.high || data.videoInfo.thumbnails.medium,
          duration: data.videoInfo.duration,
          publishedAt: data.videoInfo.publishedAt,
          viewCount: data.videoInfo.viewCount,
        }),
      };

      return videoSermonsApi.create(apiData);
    },
    onSuccess: () => {
      toast.success('Video sermon added successfully!');
      // Invalidate and refetch video sermons
      queryClient.invalidateQueries({ queryKey: ['video-sermons'] });
      // Redirect to video sermons list
      router.push('/dashboard/video-sermons');
    },
    onError: (error: any) => {
      console.error('Failed to create video sermon:', error);
      toast.error(error.message || 'Failed to add video sermon. Please try again.');
    },
  });

  const handleSubmit = async (data: VideoSermonData) => {
    createVideoSermon.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/video-sermons">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Videos
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <Video className="h-5 w-5 text-white" />
                </div>
                Add Video Sermon
              </h1>
              <p className="text-slate-600 mt-1">
                Add a new YouTube video sermon to your collection
              </p>
            </div>
          </div>
        </div>

        {/* YouTube API Status */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Video className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">YouTube Integration</h3>
                  <p className="text-sm text-slate-600">
                    {youtubeUtils.isConfigured() 
                      ? "YouTube API is configured. Video details will be automatically fetched when you paste a YouTube URL."
                      : "YouTube API is not configured. You'll need to manually enter video details."
                    }
                  </p>
                </div>
              </div>
              <div>
                {youtubeUtils.isConfigured() ? (
                  <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
                    ✓ Configured
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Not Configured
                  </Badge>
                )}
              </div>
            </div>
            
            {!youtubeUtils.isConfigured() && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Setup YouTube API (Recommended)</h4>
                <div className="text-sm text-yellow-700 space-y-2">
                  <p>To enable automatic video metadata fetching:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Go to <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-800">Google Cloud Console</a></li>
                    <li>Create a new project or select an existing one</li>
                    <li>Enable the "YouTube Data API v3"</li>
                    <li>Create an API key and restrict it to YouTube Data API</li>
                    <li>Add the API key to your environment variables as <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_YOUTUBE_API_KEY</code></li>
                  </ol>
                  <p className="text-xs text-yellow-600 mt-2">
                    YouTube API has a generous free tier (10,000 units per day) which is more than enough for most churches.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Form */}
        <YouTubeVideoForm
          onSubmit={handleSubmit}
          isLoading={createVideoSermon.isPending}
          mode="create"
        />

        {/* Tips Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800">📚 Tips for Adding Video Sermons</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">📹 Video Requirements:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Video must be public on YouTube</li>
                  <li>• Ensure video is not age-restricted</li>
                  <li>• Consider enabling captions for accessibility</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">🏷️ Best Practices:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Use descriptive titles for better searchability</li>
                  <li>• Add relevant tags (faith, worship, prayer, etc.)</li>
                  <li>• Set sermon date for chronological organization</li>
                  <li>• Feature important sermons for mobile app prominence</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}