import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type Session = { status: 'loading' } | { status: 'signedOut' } | { status: 'signedIn'; user: User };

export function useSession(): Session {
  const [session, setSession] = useState<Session>({ status: 'loading' });

  useEffect(() => {
    const toStatus = (s: { user: User } | null): Session => (s ? { status: 'signedIn', user: s.user } : { status: 'signedOut' });
    supabase.auth.getSession().then(({ data }) => setSession(toStatus(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(toStatus(s)));
    return () => data.subscription.unsubscribe();
  }, []);

  return session;
}

export const signOut = () => supabase.auth.signOut();
