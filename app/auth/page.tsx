'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp, createTeam } from '../lib/db';

type Mode = 'login' | 'join' | 'create';

export default function AuthPage() {
  const router = useRouter();
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
        router.push('/team');
      } else if (mode === 'join') {
        await signUp(email, password, inviteCode);
        router.push('/team');
      } else {
        // create team: sign up without invite code (becomes admin)
        const result = await signIn(email, password);
        if (result?.user) {
          await createTeam(teamName, teamDesc);
          router.push('/team');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  const tabs: { key: Mode; label: string }[] = [
    { key: 'login',  label: '로그인' },
    { key: 'join',   label: '팀 참가' },
    { key: 'create', label: '팀 만들기' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-4xl mb-2">⚽</p>
          <h1 className="text-2xl font-black text-gray-900">팀매처</h1>
          <p className="text-sm text-gray-400 mt-1">조기축구 팀 관리 플랫폼</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {tabs.map(({ key, label }) => (
              <button key={key} onClick={() => { setMode(key); setError(''); }}
                className={`flex-1 py-3 text-sm font-semibold transition ${mode === key ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-400'}`}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'create' && (
              <>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={teamName} onChange={(e) => setTeamName(e.target.value)}
                  placeholder="팀 이름 (예: 화요일 FC)" required={mode === 'create'} />
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)}
                  placeholder="팀 소개 (선택)" />
                <hr className="border-gray-100" />
              </>
            )}

            <input type="email"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일" required />
            <input type="password"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (6자 이상)" required />

            {mode === 'join' && (
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 uppercase tracking-widest font-mono"
                value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="초대코드 6자리" maxLength={6} required />
            )}

            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-3 rounded-xl transition text-sm">
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : mode === 'join' ? '팀 참가' : '팀 만들기'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          팀장이 앱 내 초대코드를 팀원에게 공유하세요
        </p>
      </div>
    </div>
  );
}
