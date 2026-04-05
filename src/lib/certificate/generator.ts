import { createAdminClient } from '@/lib/supabase/admin';
import { sendCompletionNotification } from '@/lib/queue';
import crypto from 'crypto';

interface GenerateCertificateParams {
  enrollmentId: string;
  studentId: string;
  courseId: string;
  courseName: string;
  studentName: string;
}

function generateCertificateNumber(): string {
  const prefix = 'CERT';
  // SECURITY: Use cryptographically secure random bytes instead of Math.random
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${randomBytes}`;
}

export async function generateCertificate(params: GenerateCertificateParams) {
  const { enrollmentId, studentId, courseId, courseName, studentName } = params;

  const supabase = createAdminClient();

  // Check if certificate already exists
  const { data: existingCert } = await supabase
    .from('certificates')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .single();

  if (existingCert) {
    return existingCert;
  }

  // Generate certificate number
  const certificateNumber = generateCertificateNumber();

  // Create certificate record
  const { data: certificate, error } = await supabase
    .from('certificates')
    .insert({
      enrollment_id: enrollmentId,
      student_id: studentId,
      course_id: courseId,
      certificate_number: certificateNumber,
      issued_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Certificate creation error:', error);
    throw error;
  }

  // Generate PDF URL (placeholder - in production, use a PDF generation service)
  const certificateUrl = `${process.env.NEXTAUTH_URL}/certificate/${certificateNumber}`;

  // Send completion notification
  await sendCompletionNotification(studentId, courseName, certificateUrl);

  return certificate;
}