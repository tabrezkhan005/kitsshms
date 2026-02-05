import { Suspense } from 'react';
import AdminHallHistory from '@/components/admin/AdminHallHistory';

export default function HallsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            <span className="text-gray-500 text-sm">Loading...</span>
          </div>
        </div>
      }
    >
      <AdminHallHistory />
    </Suspense>
  );
}
