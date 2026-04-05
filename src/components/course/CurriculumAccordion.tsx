'use client';

import { useState } from 'react';
import { Module, Lesson } from '@/types';
import {
  ChevronDown,
  Lock,
  Play,
  FileText,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';

interface CurriculumAccordionProps {
  modules: (Module & { lessons: Lesson[] })[];
  completedLessons?: string[];
  isEnrolled: boolean;
}

export function CurriculumAccordion({
  modules,
  completedLessons = [],
  isEnrolled,
}: CurriculumAccordionProps) {
  const [openModuleId, setOpenModuleId] = useState<string | null>(
    modules[0]?.id || null
  );

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const totalLessons = modules.reduce(
    (sum, m) => sum + (m.lessons?.length || 0),
    0
  );
  const totalDuration = modules.reduce(
    (sum, m) =>
      sum + m.lessons?.reduce((lSum, l) => lSum + (l.duration_minutes || 0), 0) || 0,
    0
  );

  return (
    <div className="border rounded-lg">
      {/* Header */}
      <div className="p-4 bg-muted/50 border-b">
        <div className="flex justify-between text-sm">
          <span>{modules.length} modul • {totalLessons} pelajaran</span>
          {totalDuration > 0 && (
            <span>{Math.floor(totalDuration / 60)} jam {totalDuration % 60 > 0 ? `${totalDuration % 60} menit` : ''} total</span>
          )}
        </div>
      </div>

      {/* Modules */}
      {modules.map((module) => (
        <div key={module.id} className="border-b last:border-b-0">
          <button
            onClick={() =>
              setOpenModuleId(openModuleId === module.id ? null : module.id)
            }
            className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  openModuleId === module.id ? 'rotate-180' : ''
                }`}
              />
              <span className="font-medium">{module.title}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {module.lessons?.length || 0} pelajaran
            </span>
          </button>

          {openModuleId === module.id && (
            <div className="bg-muted/20">
              {module.lessons?.map((lesson) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const canAccess = isEnrolled || lesson.is_preview;

                return (
                  <div
                    key={lesson.id}
                    className={`p-3 flex items-center gap-3 border-t ${
                      !canAccess ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : !canAccess ? (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        getContentTypeIcon(lesson.content_type)
                      )}
                    </div>

                    {/* Lesson info */}
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{lesson.title}</span>
                        {lesson.is_preview && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            Preview
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Duration */}
                    {lesson.duration_minutes && (
                      <span className="text-sm text-muted-foreground">
                        {lesson.duration_minutes} menit
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}