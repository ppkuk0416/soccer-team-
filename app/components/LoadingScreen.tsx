'use client';
import { useSupabaseStore } from '../store/useSupabaseStore';

export function LoadingScreen() {
  const { initialized, loading } = useSupabaseStore();

  if (initialized) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-3xl">⚽</span>
        </div>
        <div className="text-center">
          <p className="font-black text-gray-900 text-lg">팀매처</p>
          <p className="text-gray-400 text-sm mt-0.5">데이터를 불러오는 중...</p>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
