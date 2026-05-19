'use client';
import { useSupabaseStore } from '../store/useSupabaseStore';

export function Toaster() {
  const { error, success, clearMessages } = useSupabaseStore();
  const message = error || success;
  const isError = !!error;

  if (!message) return null;

  return (
    <div
      key={message}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)] animate-toast-in"
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.16)] ${
        isError
          ? 'bg-red-600 text-white'
          : 'bg-[#1C1C1E] text-white'
      }`}>
        <span className="text-base shrink-0">{isError ? '⚠️' : '✅'}</span>
        <p className="text-sm font-semibold flex-1">{message}</p>
        <button onClick={clearMessages} className="opacity-60 hover:opacity-100 transition shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
