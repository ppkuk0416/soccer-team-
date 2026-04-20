'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSoccerStore } from '../store/useSoccerStore';

export function NotificationBell() {
  const { notifications, markAllRead } = useSoccerStore();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  function handleOpen() {
    setOpen((v) => !v);
    if (!open && unread > 0) markAllRead();
  }

  return (
    <div className="relative">
      <button onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition">
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-0.5">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="font-bold text-gray-900 text-sm">알림</p>
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">알림이 없습니다</p>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.slice(0, 20).map((n) => (
                  <Link key={n.id} href={n.link ?? '#'} onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-gray-50 transition">
                    <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-gray-300 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
