'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { admin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (admin) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [admin, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
        <p className="mt-2 text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}