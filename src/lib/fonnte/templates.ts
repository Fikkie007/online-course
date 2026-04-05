// WhatsApp message templates

export function enrollmentSuccessWA(studentName: string, courseName: string): string {
  return `🎓 *Pendaftaran Berhasil!*

Halo ${studentName},

Selamat! Anda telah berhasil mendaftar di kursus:
📚 ${courseName}

Silakan login ke platform untuk mulai belajar:
${process.env.NEXTAUTH_URL}/student/courses

Selamat belajar! 🚀`;
}

export function paymentReminderWA(
  studentName: string,
  courseName: string,
  amount: number
): string {
  return `⏰ *Reminder Pembayaran*

Halo ${studentName},

Anda memiliki pembayaran yang belum diselesaikan untuk kursus:
📚 ${courseName}
💰 Rp ${amount.toLocaleString('id-ID')}

Segera selesaikan pembayaran untuk mengakses kursus.

Jika sudah membayar, abaikan pesan ini.`;
}

export function courseCompletionWA(
  studentName: string,
  courseName: string,
  certificateUrl: string
): string {
  return `🏆 *Selamat! Kursus Selesai*

Halo ${studentName},

Hebat! Anda telah menyelesaikan kursus:
📚 ${courseName}

Sertifikat digital Anda sudah tersedia:
${certificateUrl}

Terus belajar dan berkembang! 🚀`;
}

export function newCourseAvailableWA(courseName: string, mentorName: string, courseUrl: string): string {
  return `🆕 *Kursus Baru Tersedia!*

${courseName}
👨‍🏫 Oleh: ${mentorName}

Lihat detail kursus:
${courseUrl}

Jangan lewatkan kesempatan untuk belajar! 🎯`;
}