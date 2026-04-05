// Email templates

// SECURITY: HTML escape function to prevent XSS in email templates
function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface WelcomeEmailProps {
  name: string;
}

export function welcomeEmailTemplate({ name }: WelcomeEmailProps): string {
  const safeName = escapeHtml(name);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Selamat Datang</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Selamat Datang!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px;">Halo <strong>${safeName}</strong>,</p>
        <p>Terima kasih telah bergabung di platform kursus online kami. Anda sekarang dapat mengakses ratusan kursus berkualitas.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/courses" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Jelajahi Kursus</a>
        </div>
        <p style="color: #666; font-size: 14px;">Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi kami.</p>
      </div>
    </body>
    </html>
  `;
}

interface EnrollmentSuccessEmailProps {
  name: string;
  courseName: string;
  price: number;
  enrolledAt: string;
}

export function enrollmentSuccessEmailTemplate({ name, courseName, price, enrolledAt }: EnrollmentSuccessEmailProps): string {
  const safeName = escapeHtml(name);
  const safeCourseName = escapeHtml(courseName);
  const formattedPrice = price === 0 ? 'Gratis' : `Rp ${price.toLocaleString('id-ID')}`;
  const formattedDate = new Date(enrolledAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Pendaftaran Berhasil</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Pendaftaran Berhasil!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px;">Halo <strong>${safeName}</strong>,</p>
        <p>Selamat! Anda telah berhasil mendaftar di kursus:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #11998e;">
          <h3 style="margin: 0 0 10px 0;">${safeCourseName}</h3>
          <p style="margin: 5px 0; color: #666;">Harga: ${formattedPrice}</p>
          <p style="margin: 5px 0; color: #666;">Tanggal: ${formattedDate}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/student/courses" style="background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Mulai Belajar</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

interface CourseCompletionEmailProps {
  name: string;
  courseName: string;
  certificateUrl: string;
}

export function courseCompletionEmailTemplate({ name, courseName, certificateUrl }: CourseCompletionEmailProps): string {
  const safeName = escapeHtml(name);
  const safeCourseName = escapeHtml(courseName);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Selamat! Kursus Selesai</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Selamat!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px;">Halo <strong>${safeName}</strong>,</p>
        <p>Hebat! Anda telah menyelesaikan kursus:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin: 0 0 20px 0;">${safeCourseName}</h3>
          <p style="color: #666;">Sertifikat digital Anda sudah tersedia!</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${certificateUrl}" style="background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Lihat Sertifikat</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

interface PaymentFailedEmailProps {
  name: string;
  courseName: string;
  amount: number;
}

export function paymentFailedEmailTemplate({ name, courseName, amount }: PaymentFailedEmailProps): string {
  const safeName = escapeHtml(name);
  const safeCourseName = escapeHtml(courseName);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Pembayaran Gagal</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #ef4444; padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Pembayaran Gagal</h1>
      </div>
      <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px;">Halo <strong>${safeName}</strong>,</p>
        <p>Mohon maaf, pembayaran Anda untuk kursus <strong>${safeCourseName}</strong> sebesar <strong>Rp ${amount.toLocaleString('id-ID')}</strong> gagal diproses.</p>
        <p>Silakan coba lagi atau hubungi customer support kami jika masalah berlanjut.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/courses" style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Coba Lagi</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function passwordResetEmailTemplate({ name, resetUrl, expiresInMinutes }: PasswordResetEmailProps): string {
  const safeName = escapeHtml(name) || 'Pengguna';
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Reset Password</h1>
      </div>
      <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px;">Halo <strong>${safeName}</strong>,</p>
        <p>Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah untuk membuat password baru:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">Link ini akan kadaluarsa dalam <strong>${expiresInMinutes} menit</strong>.</p>
        <p style="color: #666; font-size: 14px;">Jika Anda tidak meminta reset password, Anda dapat mengabaikan email ini.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">Jika tombol di atas tidak berfungsi, salin dan tempel link berikut di browser Anda:</p>
        <p style="color: #667eea; font-size: 12px; word-break: break-all;">${resetUrl}</p>
      </div>
    </body>
    </html>
  `;
}