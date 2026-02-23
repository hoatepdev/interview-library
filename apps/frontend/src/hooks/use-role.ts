import { useAuth } from '@/contexts/auth-context';

export function useRole() {
  const { user } = useAuth();
  return {
    role: user?.role ?? null,
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator',
    isModOrAdmin: user?.role === 'moderator' || user?.role === 'admin',
  };
}
