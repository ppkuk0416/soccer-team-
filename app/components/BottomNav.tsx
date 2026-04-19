'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSoccerStore } from '../store/useSoccerStore';

const NAV = [
  { href: '/players', label: '선수', icon: '👤' },
  { href: '/quick', label: '번개전', icon: '⚡' },
  { href: '/matcher', label: '팀 매칭', icon: '🔀' },
  { href: '/matches', label: '경기', icon: '📋' },
  { href: '/stats', label: '통계', icon: '📊' },
  { href: '/admin', label: '평가', icon: '🛡️' },
];

export function BottomNav() {
  const path = usePathname();
  const { evalRequests } = useSoccerStore();
  const pendingCount = evalRequests.filter((r) => r.status === 'pending').length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-40">
      <div className="max-w-md mx-auto flex">
        {NAV.map(({ href, label, icon }) => {
          const active = path === href || path.startsWith(href + '/');
          const showBadge = href === '/admin' && pendingCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition text-xs font-medium relative
                ${active ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <span className="text-lg relative">
                {icon}
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {pendingCount}
                  </span>
                )}
              </span>
              <span className="text-[10px]">{label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-green-500" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
