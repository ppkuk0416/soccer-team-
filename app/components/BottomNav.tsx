'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSoccerStore } from '../store/useSoccerStore';

const NAV = [
  { href: '/team',    label: '팀',   icon: '⚽' },
  { href: '/attend',  label: '출석', icon: '📅' },
  { href: '/matcher', label: '매칭', icon: '🔀' },
  { href: '/matches', label: '기록', icon: '📋' },
  { href: '/admin',   label: '평가', icon: '🛡️' },
];

export function BottomNav() {
  const path = usePathname();
  const { evalRequests, events } = useSoccerStore();
  const pendingEvals  = evalRequests.filter((r) => r.status === 'pending').length;
  const openEvents    = events.filter((e) => e.isOpen).length;
  const badges: Record<string, number> = { '/admin': pendingEvals, '/attend': openEvents };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40">
      <div className="max-w-md mx-auto flex">
        {NAV.map(({ href, label, icon }) => {
          const active = path === href || path.startsWith(href + '/');
          const badge  = badges[href] ?? 0;
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center pt-2.5 pb-3 gap-0.5 transition relative
                ${active ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="text-lg relative leading-none">
                {icon}
                {badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold px-0.5">
                    {badge}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-medium ${active ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
              {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-green-500 rounded-full" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
