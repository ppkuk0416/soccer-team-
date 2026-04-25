'use client';
import Link from 'next/link';
import { useSupabaseStore } from '../store/useSupabaseStore';
import { NotificationBell } from './NotificationBell';

export function AppHeader() {
  const { teamName } = useSupabaseStore();

  return (
    <header className="sticky top-0 z-30 bg-white/75 backdrop-blur-md border-b border-stone-200/60">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/team" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-[10px] flex items-center justify-center shadow-sm flex-shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fillOpacity="0.15" />
              <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 1.5a8.5 8.5 0 110 17 8.5 8.5 0 010-17z" opacity="0.4"/>
              <path d="M12 6a1 1 0 100 2 1 1 0 000-2zm-4 3a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2zm-5.5 3a1 1 0 100 2 1 1 0 000-2zm3 0a1 1 0 100 2 1 1 0 000-2zm-1.5 3a1 1 0 100 2 1 1 0 000-2z"/>
            </svg>
          </div>
          <div>
            <p className="text-[9px] text-stone-400 font-semibold leading-none tracking-widest uppercase">팀매처</p>
            <p className="font-bold text-stone-900 text-sm leading-tight mt-0.5">{teamName || '내 팀'}</p>
          </div>
        </Link>
        <NotificationBell />
      </div>
    </header>
  );
}
