'use client';

import { useEffect } from 'react';
import { authService } from '@/lib/authService';

export default function HomePage() {
  useEffect(() => {
    // Redirect based on auth status
    if (authService.isAuthenticated()) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/auth';
    }
  }, []);

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Auto<span className="text-blue-600">Buzz</span>
          </h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
  );
}