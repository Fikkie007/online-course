import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/certificate/PrintButton';

interface CertificatePageProps {
  params: Promise<{ certificateNumber: string }>;
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const { certificateNumber } = await params;
  const supabase = createAdminClient();

  // Get certificate with related info
  const { data: certificate, error } = await supabase
    .from('certificates')
    .select(`
      *,
      student:profiles!certificates_student_id_fkey(full_name),
      course:courses(title, mentor_id, duration_hours)
    `)
    .eq('certificate_number', certificateNumber)
    .single();

  if (error || !certificate) {
    notFound();
  }

  // Get mentor info
  const { data: mentor } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', certificate.course?.mentor_id)
    .single();

  const issuedDate = new Date(certificate.issued_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Certificate Card */}
        <div className="bg-white rounded-lg shadow-2xl p-12 border-8 border-double border-gray-300">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif font-bold text-gray-800 mb-2">
              SERTIFIKAT
            </h1>
            <p className="text-lg text-gray-500">Certificate of Completion</p>
            <div className="w-32 h-1 bg-primary mx-auto mt-4" />
          </div>

          {/* Content */}
          <div className="text-center space-y-6">
            <p className="text-gray-600">Diberikan kepada:</p>

            <h2 className="text-3xl font-bold text-gray-900">
              {certificate.student?.full_name || 'Peserta'}
            </h2>

            <p className="text-gray-600">Telah berhasil menyelesaikan kursus:</p>

            <h3 className="text-2xl font-semibold text-primary">
              {certificate.course?.title || 'Kursus'}
            </h3>

            {certificate.course?.duration_hours && (
              <p className="text-gray-500">
                Durasi: {certificate.course.duration_hours} jam
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-12 flex justify-between items-end">
            <div>
              <p className="text-sm text-gray-500">Tanggal Terbit</p>
              <p className="font-semibold">{issuedDate}</p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">Mentor</p>
              <p className="font-semibold">{mentor?.full_name || 'Instructor'}</p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">No. Sertifikat</p>
              <p className="font-mono text-sm">{certificate.certificate_number}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 mb-4">
            Verifikasi keaslian sertifikat ini di:{' '}
            <span className="font-mono text-sm">
              {process.env.NEXTAUTH_URL}/certificate/{certificate.certificate_number}
            </span>
          </p>
          <PrintButton />
        </div>
      </div>
    </div>
  );
}