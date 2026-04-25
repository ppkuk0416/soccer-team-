'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSupabaseStore } from '../store/useSupabaseStore';

type NavItem = { href: string; label: string; icon: React.ReactNode };

function IconUsers() {
  return (
    <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function IconWallet() {
  return (
    <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

const NAV: NavItem[] = [
  { href: '/team',      label: '팀',   icon: <IconUsers /> },
  { href: '/attend',    label: '출석', icon: <IconCalendar /> },
  { href: '/dues',      label: '회비', icon: <IconWallet /> },
  { href: '/challenge', label: '매칭', icon: <IconBolt /> },
  { href: '/matches',   label: '기록', icon: <IconChart /> },
];

export function BottomNav() {
  const path = usePathname();
  const { events, challenges, teamId } = useSupabaseStore();
  const openEvents = events.filter((e) => e.isOpen).length;
  const incomingChallenges = challenges.filter((c) => c.targetTeamId === teamId && c.status === 'pending').length;
  const badges: Record<string, number> = { '/attend': openEvents, '/challenge': incomingChallenges };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-safe-or-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.06)] border border-stone-200/50 flex items-center p-1.5 gap-0.5">
        {NAV.map(({ href, label, icon }) => {
          const active = path === href || path.startsWith(href + '/');
          const badge  = badges[href] ?? 0;
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-150 relative select-none ${
                active ? 'bg-green-600' : 'hover:bg-stone-50 active:bg-stone-100'
              }`}>
              <span className={`transition-colors ${active ? 'text-white' : 'text-stone-400'}`}>
                {icon}
              </span>
              <span className={`text-[10px] font-semibold mt-0.5 transition-colors ${active ? 'text-white' : 'text-stone-400'}`}>
                {label}
              </span>
              {badge > 0 && (
                <span className="absolute top-1 right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold px-1 shadow-sm">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
