'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp, signUpAndCreateTeam } from '../lib/db';
import { useSupabaseStore } from '../store/useSupabaseStore';

type Mode = 'login' | 'join' | 'create';

const MODE_CONFIG: Record<Mode, { label: string; desc: string }> = {
  login:  { label: '로그인',    desc: '기존 계정으로 로그인' },
  join:   { label: '팀 참가',   desc: '초대코드로 팀에 합류' },
  create: { label: '팀 만들기', desc: '새 팀을 만들고 팀장이 되기' },
};

const INPUT = "w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:text-gray-400";

export default function AuthPage() {
  const router = useRouter();
  const { init } = useSupabaseStore();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else if (mode === 'join') {
        if (inviteCode.trim().length !== 6) throw new Error('초대코드는 6자리입니다');
        await signUp(email, password, inviteCode.trim());
      } else {
        if (!teamName.trim()) throw new Error('팀 이름을 입력해주세요');
        await signUpAndCreateTeam(email, password, teamName.trim(), teamDesc.trim() || undefined);
      }
      // 스토어 초기화 후 이동
      await init();
      router.push('/team');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  const modes: Mode[] = ['login', 'join', 'create'];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl items-center justify-center shadow-lg mb-3">
            <span className="text-3xl">⚽</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">팀매처</h1>
          <p className="text-sm text-gray-400 mt-1">조기축구 팀 관리 플랫폼</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* Tabs */}
          <div className="flex">
            {modes.map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-3.5 text-sm font-bold transition-all ${
                  mode === m
                    ? 'text-green-600 bg-green-50 border-b-2 border-green-500'
                    : 'text-gray-400 border-b-2 border-gray-100 hover:text-gray-600'
                }`}>
                {MODE_CONFIG[m].label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-3">
            <p className="text-xs text-gray-400 font-medium -mb-1">{MODE_CONFIG[mode].desc}</p>

            {/* 팀 만들기 전용 필드 */}
            {mode === 'create' && (
              <>
                <input className={INPUT} value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="팀 이름 (예: 화요일 FC)" required />
                <input className={INPUT} value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  placeholder="팀 소개 (선택, 예: 매주 화요일 저녁 7시)" />
                <div className="border-t border-gray-100 pt-1" />
              </>
            )}

            <input type="email" className={INPUT} value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일" autoComplete="email" required />
            <input type="password" className={INPUT} value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (6자 이상)" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />

            {/* 팀 참가 초대코드 */}
            {mode === 'join' && (
              <input className={`${INPUT} uppercase tracking-[0.3em] text-center font-black text-lg`}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="초대코드 6자리"
                maxLength={6} required />
            )}

            {error && (
              <div className="flex items-start gap-2 bg-red-50 rounded-xl px-3 py-2.5">
                <span className="text-red-500 text-sm shrink-0">⚠️</span>
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-3.5 rounded-xl transition text-sm mt-1">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />처리 중...</span>
                : MODE_CONFIG[mode].label}
            </button>
          </form>
        </div>

        <div className="mt-6 bg-white/60 rounded-2xl p-4 text-xs text-gray-500 space-y-1.5">
          <p className="font-bold text-gray-600">사용 방법</p>
          <p>• <strong>팀 만들기</strong>: 팀장이 팀을 생성하면 초대코드가 발급됩니다</p>
          <p>• <strong>팀 참가</strong>: 팀장에게 초대코드를 받아 팀원으로 합류하세요</p>
        </div>
      </div>
    </div>
  );
}
