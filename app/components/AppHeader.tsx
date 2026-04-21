'use client';
import Link from 'next/link';
import { useSoccerStore } from '../store/useSupabaseStore';
import { NotificationBell } from './NotificationBell';

export function AppHeader() {
  const { teamName } = useSoccerStore();

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/team" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-white text-sm">⚽</span>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-medium leading-none tracking-wide uppercase">팀매처</p>
            <p className="font-black text-gray-900 text-sm leading-tight">{teamName || '내 팀'}</p>
          </div>
        </Link>
        <NotificationBell />
      </div>
    </header>
  );
}
