'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSoccerStore } from '../store/useSupabaseStore';

const NAV = [
  { href: '/team',      label: '팀',   icon: '⚽' },
  { href: '/attend',    label: '출석', icon: '📅' },
  { href: '/dues',      label: '회비', icon: '💰' },
  { href: '/challenge', label: '매칭', icon: '🤝' },
  { href: '/matches',   label: '기록', icon: '📋' },
];

export function BottomNav() {
  const path = usePathname();
  const { events, challenges, teamId } = useSoccerStore();
  const openEvents = events.filter((e) => e.isOpen).length;
  const incomingChallenges = challenges.filter((c) => c.targetTeamId === teamId && c.status === 'pending').length;
  const badges: Record<string, number> = { '/attend': openEvents, '/challenge': incomingChallenges };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center p-1.5 gap-1">
        {NAV.map(({ href, label, icon }) => {
          const active = path === href || path.startsWith(href + '/');
          const badge  = badges[href] ?? 0;
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-all duration-200 relative ${
                active
                  ? 'bg-green-600 shadow-sm'
                  : 'hover:bg-gray-50'
              }`}>
              <span className={`text-lg leading-none transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                {icon}
              </span>
              <span className={`text-[10px] font-bold mt-0.5 transition-colors ${active ? 'text-white' : 'text-gray-400'}`}>
                {label}
              </span>
              {badge > 0 && (
                <span className="absolute top-1.5 right-2 min-w-[16px] h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold px-1 shadow-sm">
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
