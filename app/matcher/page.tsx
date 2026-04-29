'use client';
import { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSupabaseStore } from '../store/useSupabaseStore';
import { QuickPlayer, Tier, TIER_TO_SCORE } from '../types';
import { TierBadge, tierAvatarColors } from '../components/TierBadge';
import { balanceTeams } from '../utils/teamBalancer';
import { Team } from '../types';

// ── Quick mode helpers ────────────────────────────────────────────────────

interface QuickTeam { name: string; players: QuickPlayer[]; total: number; }

function balanceQuick(players: QuickPlayer[], nameA: string, nameB: string): [QuickTeam, QuickTeam] {
  const avg = players.filter(p => p.score !== null).reduce((s, p) => s + p.score!, 0) /
    (players.filter(p => p.score !== null).length || 1);
  const withScore = players.map((p) => ({ ...p, _s: p.score ?? (avg + (Math.random() - 0.5) * 2) }));
  const sorted = [...withScore].sort((a, b) => b._s - a._s);
  const a: typeof withScore = [], b: typeof withScore = [];
  sorted.forEach((p) => {
    const sA = a.reduce((s, x) => s + x._s, 0);
    const sB = b.reduce((s, x) => s + x._s, 0);
    (sA <= sB ? a : b).push(p);
  });
  const make = (name: string, ps: typeof withScore): QuickTeam => ({
    name, players: ps.map(({ _s, ...p }) => p),
    total: +ps.reduce((s, p) => s + p._s, 0).toFixed(1),
  });
  return [make(nameA, a), make(nameB, b)];
}

function genId() { return Math.random().toString(36).slice(2, 8); }

const QUICK_TIERS: { tier: Tier; label: string; color: string }[] = [
  { tier: 'beginner-2',  label: '비기너',   color: 'bg-sky-100 text-sky-700' },
  { tier: 'amateur-2',   label: '아마추어',  color: 'bg-indigo-100 text-indigo-700' },
  { tier: 'semi-pro-2',  label: '세미프로',  color: 'bg-purple-100 text-purple-700' },
  { tier: 'pro',         label: '프로',      color: 'bg-amber-100 text-amber-700' },
];

// ── Team result display ───────────────────────────────────────────────────

function TeamResultCard({ teams, diff }: { teams: [Team | QuickTeam, Team | QuickTeam]; diff: number }) {
  const isBalanced = diff <= 1;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
          isBalanced ? 'bg-green-100 text-green-700' : diff <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
        }`}>
          {isBalanced ? '완벽한 균형' : `점수 차 ${diff}`}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {teams.map((team, i) => {
          const playerList = 'players' in team ? team.players : [];
          const total = 'totalScore' in team ? (team as Team).totalScore : (team as QuickTeam).total;
          return (
            <div key={i} className={`rounded-2xl p-4 ${i === 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
              <div className="flex justify-between items-center mb-3">
                <span className={`font-black text-sm ${i === 0 ? 'text-blue-700' : 'text-red-700'}`}>{team.name}</span>
                <span className="text-xs font-semibold text-gray-400">{total}pt</span>
              </div>
              <div className="space-y-1.5">
                {[...playerList].sort((a, b) => {
                  const sa = 'score' in a ? (a as { score: number }).score : 0;
                  const sb = 'score' in b ? (b as { score: number }).score : 0;
                  return sb - sa;
                }).map((p: { id: string; name: string; score?: number | null; tier?: Tier; status?: string }) => (
                  <div key={p.id} className="flex justify-between items-center text-xs">
                    <span className="text-gray-700 font-medium">{p.name}</span>
                    <span className="text-gray-400 font-bold">
                      {p.score !== undefined && p.score !== null ? p.score : '?'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Registered mode ───────────────────────────────────────────────────────

function RegisteredMatcher({ presetIds }: { presetIds: string[] }) {
  const players = useSupabaseStore((s) => s.players);
  const [selected, setSelected] = useState<Set<string>>(
    () => presetIds.length > 0 ? new Set(presetIds) : new Set()
  );
  const [result, setResult] = useState<[Team, Team] | null>(null);
  const [nameA, setNameA] = useState('A팀');
  const [nameB, setNameB] = useState('B팀');

  function toggle(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setResult(null);
  }

  const diff = result ? Math.abs(result[0].totalScore - result[1].totalScore) : 0;

  return (
    <div className="space-y-4">
      {presetIds.length > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-3.5 py-2.5 text-xs text-green-700 font-semibold">
          출석 참석자 {presetIds.length}명이 자동 선택됐습니다
        </div>
      )}

      {/* Team name inputs */}
      <div className="flex gap-2">
        <input className="flex-1 bg-gray-50 border-0 rounded-xl px-3.5 py-3 text-sm font-bold text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={nameA} onChange={(e) => setNameA(e.target.value)} />
        <span className="self-center text-gray-300 font-black text-sm">vs</span>
        <input className="flex-1 bg-gray-50 border-0 rounded-xl px-3.5 py-3 text-sm font-bold text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-red-400"
          value={nameB} onChange={(e) => setNameB(e.target.value)} />
      </div>

      {/* Player list */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-xs font-bold text-gray-400">{selected.size}명 선택</span>
          <div className="flex gap-3">
            <button onClick={() => { setSelected(new Set(players.map(p => p.id))); setResult(null); }}
              className="text-xs text-green-600 font-semibold">전체 선택</button>
            <button onClick={() => { setSelected(new Set()); setResult(null); }}
              className="text-xs text-gray-400 font-semibold">해제</button>
          </div>
        </div>
        {players.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            팀 탭에서 선수를 먼저 추가해주세요
          </div>
        ) : (
          <div className="space-y-1.5">
            {[...players].sort((a, b) => b.score - a.score).map((p) => {
              const isSelected = selected.has(p.id);
              const avatarCls = tierAvatarColors(p.tier, p.status);
              return (
                <button key={p.id} onClick={() => toggle(p.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-green-50 border border-green-200 shadow-sm'
                      : 'bg-white shadow-sm border border-transparent'
                  }`}>
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition ${
                    isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className={`w-9 h-9 rounded-xl ${avatarCls} flex items-center justify-center text-sm font-black shrink-0`}>
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-bold text-gray-900 text-sm">{p.name}</span>
                    <div className="mt-0.5"><TierBadge tier={p.tier} status={p.status} /></div>
                  </div>
                  <span className={`text-xl font-black shrink-0 ${p.status === 'measuring' ? 'text-gray-200' : 'text-gray-700'}`}>
                    {p.status === 'measuring' ? '—' : p.score}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          const chosen = players.filter(p => selected.has(p.id));
          if (chosen.length >= 2) setResult(balanceTeams(chosen, nameA, nameB));
        }}
        disabled={selected.size < 2}
        className="w-full bg-[#1C1C1E] hover:bg-[#2C2C2E] disabled:bg-gray-100 disabled:text-gray-300 text-white font-black py-4 rounded-2xl transition text-base shadow-sm">
        팀 나누기
      </button>

      {result && (
        <>
          <TeamResultCard teams={result} diff={diff} />
          <button onClick={() => {
            const chosen = players.filter(p => selected.has(p.id));
            if (chosen.length >= 2) setResult(balanceTeams(chosen, nameA, nameB));
          }} className="w-full text-sm text-gray-500 border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition font-semibold">
            다시 섞기
          </button>
        </>
      )}
    </div>
  );
}

// ── Quick mode ────────────────────────────────────────────────────────────

function QuickMatcher() {
  const [players, setPlayers] = useState<QuickPlayer[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [tierInput, setTierInput] = useState<Tier>('amateur-2');
  const [useScore, setUseScore] = useState(false);
  const [nameA, setNameA] = useState('A팀');
  const [nameB, setNameB] = useState('B팀');
  const [result, setResult] = useState<[QuickTeam, QuickTeam] | null>(null);
  const composingRef = useRef(false);

  function addPlayer() {
    const name = nameInput.trim();
    if (!name) return;
    const score = useScore ? TIER_TO_SCORE[tierInput] : null;
    setPlayers((prev) => [...prev, { id: genId(), name, score }]);
    setNameInput('');
    setResult(null);
  }

  const diff = result ? Math.abs(result[0].total - result[1].total) : 0;

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5 text-xs text-amber-700 font-semibold">
        저장 없이 즉석으로 팀을 구성합니다
      </div>

      <div className="flex gap-2">
        <input className="flex-1 bg-gray-50 border-0 rounded-xl px-3.5 py-3 text-sm font-bold text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={nameA} onChange={(e) => setNameA(e.target.value)} />
        <span className="self-center text-gray-300 font-black text-sm">vs</span>
        <input className="flex-1 bg-gray-50 border-0 rounded-xl px-3.5 py-3 text-sm font-bold text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-red-400"
          value={nameB} onChange={(e) => setNameB(e.target.value)} />
      </div>

      {/* Add player */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-50 border-0 rounded-xl px-3.5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-gray-400"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onCompositionStart={() => { composingRef.current = true; }}
            onCompositionEnd={() => { composingRef.current = false; }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !composingRef.current) { e.preventDefault(); addPlayer(); } }}
            placeholder="이름 입력 후 엔터"
          />
          <button onClick={addPlayer}
            className="w-12 bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white font-black rounded-xl transition text-lg flex items-center justify-center">
            +
          </button>
        </div>

        {/* Skill level */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer" onClick={() => setUseScore(v => !v)}>
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${useScore ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
              {useScore && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-xs text-gray-600 font-semibold">실력 수준 반영</span>
          </label>
          {useScore && (
            <div className="flex gap-1.5">
              {QUICK_TIERS.map(({ tier, label, color }) => (
                <button key={tier} onClick={() => setTierInput(tier)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    tierInput === tier ? 'bg-[#1C1C1E] text-white' : `${color}`
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Player chips */}
      {players.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-400">{players.length}명</span>
            <button onClick={() => { setPlayers([]); setResult(null); }}
              className="text-xs text-gray-400 hover:text-red-500 font-semibold transition">
              전체 삭제
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {players.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 bg-white shadow-sm border border-gray-200 rounded-xl px-3 py-1.5">
                <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                {p.score !== null && <span className="text-xs text-gray-400 font-bold">{p.score}</span>}
                <button onClick={() => { setPlayers(prev => prev.filter(x => x.id !== p.id)); setResult(null); }}
                  className="text-gray-300 hover:text-red-400 transition ml-0.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => players.length >= 2 && setResult(balanceQuick(players, nameA, nameB))}
        disabled={players.length < 2}
        className="w-full bg-[#1C1C1E] hover:bg-[#2C2C2E] disabled:bg-gray-100 disabled:text-gray-300 text-white font-black py-4 rounded-2xl transition text-base">
        팀 나누기
      </button>

      {result && (
        <>
          <TeamResultCard teams={result} diff={diff} />
          <button onClick={() => setResult(balanceQuick(players, nameA, nameB))}
            className="w-full text-sm text-gray-500 border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition font-semibold">
            다시 섞기
          </button>
        </>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

function MatcherContent() {
  const searchParams = useSearchParams();
  const presetIds = (searchParams.get('preset') ?? '').split(',').filter(Boolean);
  const [mode, setMode] = useState<'registered' | 'quick'>('registered');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-gray-900">팀 나누기</h1>
        <p className="text-gray-400 text-sm mt-0.5">균형 잡힌 팀을 자동 구성합니다</p>
      </div>

      {/* Mode tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1">
        <button onClick={() => setMode('registered')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
            mode === 'registered' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
          }`}>
          등록 선수
        </button>
        <button onClick={() => setMode('quick')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
            mode === 'quick' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
          }`}>
          즉석 입력
        </button>
      </div>

      {mode === 'registered' ? <RegisteredMatcher presetIds={presetIds} /> : <QuickMatcher />}
    </div>
  );
}

export default function MatcherPage() {
  return <Suspense><MatcherContent /></Suspense>;
}
