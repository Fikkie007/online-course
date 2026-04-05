import { auth } from '@/auth';
import { UserRole } from '@/types';

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  if (!allowedRoles.includes(user.role as UserRole)) {
    throw new Error('Forbidden');
  }
  return user;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === UserRole.ADMIN;
}

export async function isMentor() {
  const user = await getCurrentUser();
  return user?.role === UserRole.MENTOR || user?.role === UserRole.ADMIN;
}

export async function isStudent() {
  const user = await getCurrentUser();
  return user?.role === UserRole.STUDENT;
}