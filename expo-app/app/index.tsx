import { Redirect } from 'expo-router';
import { useAuth } from '@/services/auth';

/**
 * Entry gate. First launch goes to onboarding; every launch after goes
 * straight to the app — including for guests, who are never asked to sign in
 * again after the first "continue without an account".
 */
export default function Index() {
  const { mode, hasOnboarded, isMember } = useAuth();
  if (mode === 'loading') return null;
  return <Redirect href={hasOnboarded || isMember ? '/(tabs)' : '/onboarding'} />;
}
