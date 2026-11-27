'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers';
import { LoadingState } from '@/components/ui';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/dashboard' : '/login');
    }
  }, [loading, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <LoadingState message="Redirecting..." />
    </div>
  );
}
