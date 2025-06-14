// src/app/dashboard/audio-sermons/new/page.tsx - New audio sermon page

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AudioSermonForm } from '@/components/forms/AudioSermonForm';

export default function NewAudioSermonPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/audio-sermons">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Audio Sermon</h1>
          <p className="text-gray-600">Upload a new audio sermon file</p>
        </div>
      </div>

      {/* Form */}
      <AudioSermonForm />
    </div>
  );
}