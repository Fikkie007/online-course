// Enums
export enum UserRole {
  ADMIN = 'admin',
  MENTOR = 'mentor',
  STUDENT = 'student',
}

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum ContentType {
  VIDEO = 'video',
  DOCUMENT = 'document',
  QUIZ = 'quiz',
}

export enum EnrollmentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
}

export enum NotificationChannel {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  BOTH = 'both',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

// Base interface with common fields
interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Category
export interface Category extends BaseEntity {
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
}

// User/Profile
export interface Profile extends BaseEntity {
  id: string; // NextAuth provider user ID (Google sub)
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  role: UserRole;
  is_active: boolean;
}

// Course
export interface Course extends BaseEntity {
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  mentor_id: string;
  price: number;
  discount_price: number | null;
  status: CourseStatus;
  duration_hours: number | null;
  total_students: number;
  rating: number | null;
}

// Course Category (junction table)
export interface CourseCategory extends BaseEntity {
  course_id: string;
  category_id: string;
}

// Module
export interface Module extends BaseEntity {
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
}

// Lesson
export interface Lesson extends BaseEntity {
  module_id: string;
  title: string;
  content_type: ContentType;
  content_url: string | null;
  duration_minutes: number | null;
  order_index: number;
  is_preview: boolean;
}

// Enrollment
export interface Enrollment extends BaseEntity {
  student_id: string;
  course_id: string;
  status: EnrollmentStatus;
  enrolled_at: string | null;
  expires_at: string | null;
  completed_at: string | null;
  progress_percent: number;
}

// Lesson Progress
export interface LessonProgress extends BaseEntity {
  enrollment_id: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at: string | null;
}

// Payment
export interface Payment extends BaseEntity {
  enrollment_id: string;
  student_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string | null;
  midtrans_order_id: string;
  midtrans_token: string | null;
  paid_at: string | null;
  expired_at: string | null;
}

// Certificate
export interface Certificate extends BaseEntity {
  enrollment_id: string;
  student_id: string;
  course_id: string;
  certificate_number: string;
  issued_at: string;
  file_url: string | null;
}

// Notification Log
export interface NotificationLog extends BaseEntity {
  user_id: string;
  channel: NotificationChannel;
  type: string;
  subject: string | null;
  body: string | null;
  status: NotificationStatus;
  sent_at: string | null;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Course with relations
export interface CourseWithDetails extends Course {
  mentor: Profile;
  modules: ModuleWithLessons[];
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

// Enrollment with relations
export interface EnrollmentWithDetails extends Enrollment {
  course: CourseWithDetails;
  student: Profile;
}