'use client';
import { useEffect, useState } from 'react';
import { useSupabaseStore } from '../store/useSupabaseStore';

export function Toaster() {
  const { error, success, clearMessages } = useSupabaseStore();
  const [visible, setVisible] = useState(false);

  const message = error || success;
  const isError = !!error;

  useEffect(() => {
    if (message) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [message]);

  if (!message) return null;

  return (
    <div
      className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)] transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg ${
        isError
          ? 'bg-red-600 text-white'
          : 'bg-gray-900 text-white'
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
