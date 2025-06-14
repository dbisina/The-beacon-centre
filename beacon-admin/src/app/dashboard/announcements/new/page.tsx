// src/app/dashboard/announcements/new/page.tsx - New announcement page

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnnouncementForm } from '@/components/forms/AnnouncementForm';

export default function NewAnnouncementPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/announcements">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Announcement</h1>
          <p className="text-gray-600">Create a new church announcement</p>
        </div>
      </div>

      {/* Form */}
      <AnnouncementForm />
    </div>
  );
}