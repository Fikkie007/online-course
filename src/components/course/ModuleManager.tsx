'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Module, Lesson } from '@/types';

interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

interface ModuleManagerProps {
  courseId: string;
}

export function ModuleManager({ courseId }: ModuleManagerProps) {
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  // Lesson form states
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    content_type: 'video' as 'video' | 'document' | 'quiz',
    content_url: '',
    duration_minutes: '',
    is_preview: false,
  });
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchModules = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/modules`);
      const data = await response.json();
      if (data.success) {
        setModules(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch modules:', err);
      setError('Gagal memuat modul');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Module CRUD
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newModuleTitle }),
      });

      const data = await response.json();
      if (data.success) {
        setModules([...modules, { ...data.data, lessons: [] }]);
        setNewModuleTitle('');
        setShowModuleForm(false);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Gagal membuat modul');
    }
  };

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${editingModule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingModule.title }),
      });

      const data = await response.json();
      if (data.success) {
        setModules(modules.map(m => m.id === editingModule.id ? { ...m, ...data.data } : m));
        setEditingModule(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Gagal mengupdate modul');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Hapus modul ini beserta semua pelajarannya?')) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setModules(modules.filter(m => m.id !== moduleId));
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Gagal menghapus modul');
    }
  };

  // Lesson CRUD
  const handleFileUpload = async (file: File): Promise<string | null> => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', `courses/${courseId}`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        return data.data.url;
      } else {
        setError(data.error);
        return null;
      }
    } catch (err) {
      setError('Gagal mengupload file');
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId || !lessonForm.title.trim()) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${selectedModuleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonForm.title,
          content_type: lessonForm.content_type,
          content_url: lessonForm.content_url || null,
          duration_minutes: lessonForm.duration_minutes ? parseInt(lessonForm.duration_minutes) : null,
          is_preview: lessonForm.is_preview,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setModules(modules.map(m => {
          if (m.id === selectedModuleId) {
            return { ...m, lessons: [...(m.lessons || []), data.data] };
          }
          return m;
        }));
        resetLessonForm();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Gagal membuat pelajaran');
    }
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !selectedModuleId) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${selectedModuleId}/lessons/${editingLesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonForm.title,
          content_type: lessonForm.content_type,
          content_url: lessonForm.content_url || null,
          duration_minutes: lessonForm.duration_minutes ? parseInt(lessonForm.duration_minutes) : null,
          is_preview: lessonForm.is_preview,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setModules(modules.map(m => {
          if (m.id === selectedModuleId) {
            return {
              ...m,
              lessons: m.lessons?.map(l => l.id === editingLesson.id ? { ...l, ...data.data } : l) || [],
            };
          }
          return m;
        }));
        resetLessonForm();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Gagal mengupdate pelajaran');
    }
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('Hapus pelajaran ini?')) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setModules(modules.map(m => {
          if (m.id === moduleId) {
            return { ...m, lessons: m.lessons?.filter(l => l.id !== lessonId) || [] };
          }
          return m;
        }));
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Gagal menghapus pelajaran');
    }
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: '',
      content_type: 'video',
      content_url: '',
      duration_minutes: '',
      is_preview: false,
    });
    setShowLessonForm(false);
    setSelectedModuleId(null);
    setEditingLesson(null);
  };

  const openEditLesson = (moduleId: string, lesson: Lesson) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      content_type: lesson.content_type as 'video' | 'document' | 'quiz',
      content_url: lesson.content_url || '',
      duration_minutes: lesson.duration_minutes?.toString() || '',
      is_preview: lesson.is_preview,
    });
    setShowLessonForm(true);
  };

  const openNewLesson = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(null);
    setLessonForm({
      title: '',
      content_type: 'video',
      content_url: '',
      duration_minutes: '',
      is_preview: false,
    });
    setShowLessonForm(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await handleFileUpload(file);
    if (url) {
      setLessonForm({ ...lessonForm, content_url: url });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {/* Modules List */}
      <div className="space-y-4">
        {modules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            Belum ada modul. Tambah modul pertama Anda.
          </div>
        ) : (
          modules.map((module, index) => (
            <div key={module.id} className="border rounded-lg overflow-hidden">
              {/* Module Header */}
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">Modul {index + 1}</span>
                  {editingModule?.id === module.id ? (
                    <form onSubmit={handleUpdateModule} className="flex gap-2">
                      <input
                        type="text"
                        value={editingModule.title}
                        onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                        className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                      <Button type="submit" size="sm">Simpan</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingModule(null)}>Batal</Button>
                    </form>
                  ) : (
                    <h3 className="font-medium">{module.title}</h3>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openNewLesson(module.id)}
                  >
                    + Pelajaran
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingModule(module)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteModule(module.id)}
                  >
                    Hapus
                  </Button>
                </div>
              </div>

              {/* Lessons List */}
              <div className="divide-y">
                {module.lessons?.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    Belum ada pelajaran
                  </div>
                ) : (
                  module.lessons?.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-6">{lessonIndex + 1}.</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lesson.title}</span>
                            {lesson.is_preview && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Preview</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {lesson.content_type === 'video' && 'Video'}
                            {lesson.content_type === 'document' && 'Dokumen'}
                            {lesson.content_type === 'quiz' && 'Quiz'}
                            {lesson.duration_minutes && ` • ${lesson.duration_minutes} menit`}
                            {lesson.content_url && ' • File tersedia'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditLesson(module.id, lesson)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteLesson(module.id, lesson.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Module Button/Form */}
      {showModuleForm ? (
        <form onSubmit={handleCreateModule} className="flex gap-2">
          <input
            type="text"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="Judul modul"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <Button type="submit">Tambah</Button>
          <Button type="button" variant="outline" onClick={() => setShowModuleForm(false)}>Batal</Button>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setShowModuleForm(true)}>
          + Tambah Modul
        </Button>
      )}

      {/* Lesson Form Modal */}
      {showLessonForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingLesson ? 'Edit Pelajaran' : 'Tambah Pelajaran'}
              </h2>

              <form onSubmit={editingLesson ? handleUpdateLesson : handleCreateLesson} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Judul Pelajaran <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                {/* Content Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Tipe Konten</label>
                  <select
                    value={lessonForm.content_type}
                    onChange={(e) => setLessonForm({ ...lessonForm, content_type: e.target.value as any })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  >
                    <option value="video">Video</option>
                    <option value="document">Dokumen</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>

                {/* Content URL / File Upload */}
                <div>
                  <label className="block text-sm font-medium mb-1">File Materi</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept={
                        lessonForm.content_type === 'video'
                          ? 'video/*'
                          : lessonForm.content_type === 'document'
                          ? '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx'
                          : '*'
                      }
                      onChange={handleFileChange}
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                      disabled={uploading}
                    />
                    {uploading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Mengupload...
                      </div>
                    )}
                    {lessonForm.content_url && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        File berhasil diupload
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Atau masukkan URL manual:
                    </div>
                    <input
                      type="url"
                      value={lessonForm.content_url}
                      onChange={(e) => setLessonForm({ ...lessonForm, content_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium mb-1">Durasi (menit)</label>
                  <input
                    type="number"
                    min="0"
                    value={lessonForm.duration_minutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Estimasi durasi"
                  />
                </div>

                {/* Preview */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_preview"
                    checked={lessonForm.is_preview}
                    onChange={(e) => setLessonForm({ ...lessonForm, is_preview: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="is_preview" className="text-sm">
                    Tersedia sebagai preview gratis
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={uploading}>
                    {editingLesson ? 'Simpan Perubahan' : 'Tambah Pelajaran'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetLessonForm}>
                    Batal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}