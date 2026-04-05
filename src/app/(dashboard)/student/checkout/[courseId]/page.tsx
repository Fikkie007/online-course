import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { CheckoutButton } from '@/components/course';
import { getSnapScriptUrl, getClientKey } from '@/lib/midtrans';

interface CheckoutPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { courseId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = createAdminClient();

  // Get course details
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      mentor:profiles!courses_mentor_id_fkey(full_name)
    `)
    .eq('id', courseId)
    .single();

  if (error || !course) {
    notFound();
  }

  // Check existing enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .single();

  if (enrollment?.status === 'active') {
    redirect(`/student/courses/${enrollment.id}/learn`);
  }

  const isFree = course.price === 0;
  const hasDiscount = course.discount_price && course.discount_price < course.price;
  const displayPrice = hasDiscount ? course.discount_price : course.price;

  // Get Midtrans configuration
  const snapUrl = getSnapScriptUrl();
  const clientKey = getClientKey();

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl lg:text-3xl font-bold mb-6">Checkout</h1>

        {/* Course info card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex gap-4">
            {course.thumbnail_url && (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-24 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h2 className="font-semibold text-lg mb-1">{course.title}</h2>
              <p className="text-sm text-muted-foreground">
                by {course.mentor?.full_name || 'Mentor'}
              </p>
              {course.duration_hours && (
                <p className="text-sm text-muted-foreground mt-1">
                  {course.duration_hours} jam total durasi
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h3 className="font-semibold mb-4">Ringkasan Pembayaran</h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Harga Kursus</span>
              <span>Rp {course.price.toLocaleString('id-ID')}</span>
            </div>

            {hasDiscount && (
              <div className="flex justify-between text-green-600">
                <span>Diskon</span>
                <span>- Rp {(course.price - course.discount_price!).toLocaleString('id-ID')}</span>
              </div>
            )}

            <div className="border-t pt-3 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className={isFree ? 'text-green-600' : ''}>
                {isFree ? 'Gratis' : `Rp ${displayPrice?.toLocaleString('id-ID')}`}
              </span>
            </div>
          </div>
        </div>

        {/* Checkout form */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <CheckoutButton
            courseId={courseId}
            isFree={isFree}
            clientKey={clientKey}
            snapUrl={snapUrl}
          />

          <p className="text-sm text-muted-foreground text-center mt-4">
            Dengan melanjutkan, Anda menyetujui{' '}
            <a href="#" className="text-primary hover:underline">
              Syarat & Ketentuan
            </a>
          </p>
        </div>

        {/* Info for sandbox mode */}
        {!isFree && process.env.MIDTRANS_IS_PRODUCTION !== 'true' && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Mode Sandbox:</strong> QRIS dari sandbox tidak dapat di-scan dengan aplikasi bank real (BCA Mobile, etc).
              Gunakan simulator Midtrans atau metode pembayaran virtual account untuk testing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}