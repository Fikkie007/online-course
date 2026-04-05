import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createAdminClient } from '@/lib/supabase/admin';
import { CourseCard } from '@/components/course/CourseCard';
import { Category } from '@/types';

// Extended type for courses with categories relation
type CourseWithRelation = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  discount_price: number | null;
  total_students: number;
  rating: number | null;
  duration_hours: number | null;
  mentor?: {
    id: string;
    full_name: string | null;
  };
  categories?: { category: Category }[];
};

export default async function HomePage() {
  const supabase = createAdminClient();

  // Fetch featured courses (published, ordered by students)
  const { data: courses } = await supabase
    .from('courses')
    .select(`
      *,
      mentor:profiles!courses_mentor_id_fkey(id, full_name),
      categories:course_categories(
        category:categories(id, name, slug, icon)
      )
    `)
    .eq('status', 'published')
    .order('total_students', { ascending: false })
    .limit(6) as { data: CourseWithRelation[] | null };

  // Fetch active categories for footer
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
    .limit(4);

  const features = [
    {
      icon: '🎓',
      title: 'Kursus Berkualitas',
      description: 'Materi dibuat oleh mentor berpengalaman dengan kurikulum terstruktur',
    },
    {
      icon: '📱',
      title: 'Belajar Kapan Saja',
      description: 'Akses kursus dari desktop atau mobile, fleksibel sesuai jadwal Anda',
    },
    {
      icon: '📜',
      title: 'Sertifikat Resmi',
      description: 'Dapatkan sertifikat setelah menyelesaikan kursus untuk portofolio',
    },
    {
      icon: '💬',
      title: 'Komunitas Aktif',
      description: 'Diskusi dengan mentor dan sesama pelajar di forum komunitas',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Pelajar Aktif' },
    { value: '100+', label: 'Kursus Tersedia' },
    { value: '50+', label: 'Mentor Expert' },
    { value: '95%', label: 'Rating Kepuasan' },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/20 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Tingkatkan Skill dengan{' '}
              <span className="text-primary">Kursus Online</span> Terbaik
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Platform kursus online terpercaya dengan materi berkualitas dari mentor expert.
              Belajar kapan saja, di mana saja.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg">
                <Link href="/courses">Mulai Belajar</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg">
                <Link href="/login">Daftar Gratis</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/30 rounded-full blur-xl" />
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-primary/5 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Kenapa Memilih Kami?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Kami menyediakan pengalaman belajar online yang efektif dan menyenangkan
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Kursus Populer
              </h2>
              <p className="text-muted-foreground">
                Kursus dengan pelajar terbanyak dan rating terbaik
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/courses">Lihat Semua</Link>
            </Button>
          </div>

          {courses && courses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                // Transform categories from junction table
                const courseWithCategories = {
                  ...course,
                  categories: course.categories?.map((cc) => cc.category) || [],
                };
                return <CourseCard key={course.id} course={courseWithCategories} />;
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Kursus belum tersedia. Coming soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Siap Memulai Perjalanan Belajar?
          </h2>
          <p className="mb-8 max-w-2xl mx-auto opacity-90">
            Daftar gratis dan mulai belajar skill baru hari ini. Tidak ada biaya hidden,
            akses penuh ke semua kursus gratis.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-primary hover:bg-white/90"
          >
            <Link href="/login">Daftar Sekarang</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Online Course</h3>
              <p className="text-muted-foreground text-sm">
                Platform kursus online terbaik untuk belajar skill baru dan meningkatkan
                kompetensi profesional.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Navigasi</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/courses" className="text-muted-foreground hover:text-foreground">Kursus</Link></li>
                <li><Link href="/login" className="text-muted-foreground hover:text-foreground">Masuk</Link></li>
                <li><Link href="/login" className="text-muted-foreground hover:text-foreground">Daftar</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Kategori</h4>
              <ul className="space-y-2 text-sm">
                {categories && categories.length > 0 ? (
                  categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/courses?category=${cat.slug}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {cat.icon} {cat.name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li><Link href="/courses" className="text-muted-foreground hover:text-foreground">Lihat Semua Kursus</Link></li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Kontak</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>support@onlinecourse.id</li>
                <li>+62 812 3456 7890</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Online Course Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}