'use client';
import Link from 'next/link';
import { useSupabaseStore } from '../store/useSupabaseStore';
import { NotificationBell } from './NotificationBell';

function IconStats() {
  return (
    <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

export function AppHeader() {
  const { teamName } = useSupabaseStore();

  return (
    <header className="sticky top-0 z-30 bg-white/75 backdrop-blur-md border-b border-gray-200/60">
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
            <p className="text-[9px] text-gray-400 font-semibold leading-none tracking-widest uppercase">팀매처</p>
            <p className="font-bold text-gray-900 text-sm leading-tight mt-0.5">{teamName || '내 팀'}</p>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/stats"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <IconStats />
          </Link>
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
