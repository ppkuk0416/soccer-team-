'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/players', label: '선수', icon: '👤' },
  { href: '/matcher', label: '팀 매칭', icon: '⚡' },
  { href: '/matches', label: '경기', icon: '📋' },
  { href: '/stats', label: '통계', icon: '📊' },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-40">
      <div className="max-w-md mx-auto flex">
        {NAV.map(({ href, label, icon }) => {
          const active = path === href || path.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition text-xs font-medium
                ${active ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <span className="text-xl">{icon}</span>
              <span>{label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-green-500" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
