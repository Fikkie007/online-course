'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface CompleteLessonButtonProps {
  lessonId: string;
  isCompleted: boolean;
}

export function CompleteLessonButton({ lessonId, isCompleted: initialCompleted }: CompleteLessonButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(initialCompleted);

  const handleComplete = async () => {
    if (isLoading || isCompleted) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to mark lesson as complete');
        return;
      }

      setIsCompleted(true);

      // Refresh the page to update progress
      router.refresh();

      if (data.courseCompleted) {
        alert('Selamat! Anda telah menyelesaikan kursus ini.');
      }
    } catch (error) {
      console.error('Complete lesson error:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={isCompleted ? 'outline' : 'default'}
      className={isCompleted ? 'border-green-500 text-green-500' : ''}
      onClick={handleComplete}
      disabled={isLoading || isCompleted}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Menyimpan...
        </>
      ) : isCompleted ? (
        <>
          <CheckCircle className="w-4 h-4 mr-1" />
          Selesai
        </>
      ) : (
        'Tandai Selesai'
      )}
    </Button>
  );
}