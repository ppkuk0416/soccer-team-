'use client';
import { useEffect } from 'react';
import { useSupabaseStore } from '../store/useSupabaseStore';
import { createClient } from '../lib/supabase';

export function StoreInitializer() {
  const { init, initialized } = useSupabaseStore();

  useEffect(() => {
    const sb = createClient();
    if (!sb) return;

    if (!initialized) init();

    const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') init();
      if (event === 'SIGNED_OUT') {
        useSupabaseStore.setState({
          teamId: null, teamName: null, teamInviteCode: null,
          team: null, players: [], events: [], matchRecords: [],
          evalRequests: [], dues: [], challenges: [], notifications: [],
          role: 'member', initialized: false, loading: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
