'use client';
import { useEffect } from 'react';
import { useSupabaseStore } from '../store/useSupabaseStore';

export function StoreInitializer() {
  const { init, initialized } = useSupabaseStore();
  useEffect(() => {
    if (!initialized) init();
  }, []);
  return null;
}
