export type UserRole = 'REQUESTOR' | 'REAL_AGENT' | 'PLATFORM_ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export const getRoleHomeRoute = (role?: UserRole): string => {
  if (role === 'REQUESTOR') {
    return '/chat';
  }

  if (role === 'REAL_AGENT') {
    return '/agent';
  }

  return '/dashboard';
};

export const getRoleLabel = (role?: UserRole): string => {
  if (role === 'REQUESTOR') {
    return 'Requestor';
  }

  if (role === 'REAL_AGENT') {
    return 'Real Agent';
  }

  if (role === 'PLATFORM_ADMIN') {
    return 'Platform Admin';
  }

  return 'Unknown';
};