'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSoccerStore } from '../store/useSoccerStore';
import { QuickPlayer, Tier, TIER_LABELS, ALL_TIERS, TIER_TO_SCORE } from '../types';
import { TierBadge } from '../components/TierBadge';
import { balanceTeams } from '../utils/teamBalancer';
import { Team } from '../types';

// ── Quick team helpers ─────────────────────────────────────────────────────

interface QuickTeam { name: string; players: QuickPlayer[]; total: number; avg: number; }

function balanceQuick(players: QuickPlayer[], nameA: string, nameB: string): [QuickTeam, QuickTeam] {
  const scored = players.filter((p) => p.score !== null);
  const avg = scored.length ? scored.reduce((s, p) => s + p.score!, 0) / scored.length : 5;
  const withScore = players.map((p) => ({ ...p, _s: p.score ?? (avg + (Math.random() - 0.5) * 2) }));
  const sorted = [...withScore].sort((a, b) => b._s - a._s);
  const a: typeof withScore = [], b: typeof withScore = [];
  sorted.forEach((p) => {
    const sA = a.reduce((s, x) => s + x._s, 0);
    const sB = b.reduce((s, x) => s + x._s, 0);
    if (sA <= sB) a.push(p); else b.push(p);
  });
  const make = (name: string, ps: typeof withScore): QuickTeam => {
    const total = +ps.reduce((s, p) => s + p._s, 0).toFixed(1);
    return { name, players: ps.map(({ _s, ...p }) => p), total, avg: ps.length ? +(total / ps.length).toFixed(1) : 0 };
  };
  return [make(nameA, a), make(nameB, b)];
}

function genId() { return Math.random().toString(36).slice(2, 8); }

// ── Registered mode ────────────────────────────────────────────────────────

function RegisteredMatcher({ presetIds }: { presetIds: string[] }) {
  const players = useSoccerStore((s) => s.players);
  const [selected, setSelected] = useState<Set<string>>(new Set(presetIds));
  const [result, setResult] = useState<[Team, Team] | null>(null);
  const [nameA, setNameA] = useState('A팀');
  const [nameB, setNameB] = useState('B팀');

  useEffect(() => {
    if (presetIds.length > 0) setSelected(new Set(presetIds));
  }, [presetIds.join(',')]);

  function toggle(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setResult(null);
  }

  const diff = result ? Math.abs(result[0].totalScore - result[1].totalScore) : 0;

  return (
    <div className="space-y-4">
      {presetIds.length > 0 && (
        <p className="text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2 border border-green-100">
          ✅ 출석 참석자 {presetIds.length}명 자동 선택됨
        </p>
      )}

      <div className="flex gap-2">
        <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400" value={nameA} onChange={(e) => setNameA(e.target.value)} />
        <span className="self-center text-gray-300 font-bold text-sm">vs</span>
        <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400" value={nameB} onChange={(e) => setNameB(e.target.value)} />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-500 font-medium">{selected.size}명 선택</span>
          <div className="flex gap-3 text-xs">
            <button onClick={() => { setSelected(new Set(players.map(p => p.id))); setResult(null); }} className="text-green-600">전체</button>
            <button onClick={() => { setSelected(new Set()); setResult(null); }} className="text-gray-400">해제</button>
          </div>
        </div>
        <div className="space-y-2">
          {players.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">팀 탭에서 선수를 먼저 추가해주세요</p>
          ) : (
            [...players].sort((a, b) => b.score - a.score).map((p) => (
              <div key={p.id} onClick={() => toggle(p.id)}
                className={`bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between gap-3 border cursor-pointer select-none transition
                  ${selected.has(p.id) ? 'border-green-400 bg-green-50' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selected.has(p.id) ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                    {selected.has(p.id) && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">{p.name}</span>
                    <div className="mt-0.5"><TierBadge tier={p.tier} status={p.status} /></div>
                  </div>
                </div>
                <span className={`text-xl font-black ${p.status === 'measuring' ? 'text-gray-200' : 'text-gray-700'}`}>
                  {p.status === 'measuring' ? '—' : p.score}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <button onClick={() => { const c = players.filter(p => selected.has(p.id)); if (c.length >= 2) setResult(balanceTeams(c, nameA, nameB)); }}
        disabled={selected.size < 2}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-300 text-white font-bold py-3 rounded-xl transition text-base">
        ⚡ 팀 나누기
      </button>

      {result && (
        <div className="space-y-3">
          <div className="text-center">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${diff === 0 ? 'bg-green-50 text-green-700' : diff <= 2 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'}`}>
              점수 차 {diff}점{diff === 0 ? ' — 완벽한 균형' : ''}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {result.map((team, i) => (
              <div key={team.id} className={`rounded-2xl border-2 p-4 ${i === 0 ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex justify-between mb-3">
                  <span className={`font-black text-sm ${i === 0 ? 'text-blue-700' : 'text-red-700'}`}>{team.name}</span>
                  <span className="text-xs font-semibold text-gray-500">{team.totalScore}점</span>
                </div>
                {[...team.players].sort((a, b) => b.score - a.score).map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-xs py-1 border-b border-white/50 last:border-0">
                    <div className="flex items-center gap-1.5">
                      <TierBadge tier={p.tier} status={p.status} />
                      <span className="text-gray-800">{p.name}</span>
                    </div>
                    <span className="font-bold text-gray-500">{p.status === 'measuring' ? '—' : p.score}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Quick mode ─────────────────────────────────────────────────────────────

// Group tiers for quick select (only main levels, not sub-tiers)
const QUICK_TIERS: { tier: Tier; label: string }[] = [
  { tier: 'beginner-2', label: '비기너' },
  { tier: 'amateur-2', label: '아마추어' },
  { tier: 'semi-pro-2', label: '세미프로' },
  { tier: 'pro', label: '프로' },
];

function QuickMatcher() {
  const [quickPlayers, setQuickPlayers] = useState<QuickPlayer[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [tierMode, setTierMode] = useState(false);
  const [scoreInput, setScoreInput] = useState(5);
  const [tierInput, setTierInput] = useState<Tier>('amateur-2');
  const [noScore, setNoScore] = useState(true); // 기본값: 상관없음
  const [nameA, setNameA] = useState('A팀');
  const [nameB, setNameB] = useState('B팀');
  const [result, setResult] = useState<[QuickTeam, QuickTeam] | null>(null);
  const composingRef = useRef(false);

  function addPlayer() {
    const name = nameInput.trim();
    if (!name) return;
    const score = noScore ? null : tierMode ? TIER_TO_SCORE[tierInput] : scoreInput;
    setQuickPlayers((prev) => [...prev, { id: genId(), name, score }]);
    setNameInput('');
    setResult(null);
  }

  const diff = result ? Math.abs(result[0].total - result[1].total).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
        ⚡ 번개전 — 저장 없이 즉석 팀 구성
      </p>

      <div className="flex gap-2">
        <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400" value={nameA} onChange={(e) => setNameA(e.target.value)} />
        <span className="self-center text-gray-300 font-bold text-sm">vs</span>
        <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400" value={nameB} onChange={(e) => setNameB(e.target.value)} />
      </div>

      {/* Input card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onCompositionStart={() => { composingRef.current = true; }}
            onCompositionEnd={() => { composingRef.current = false; }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !composingRef.current) { e.preventDefault(); addPlayer(); } }}
            placeholder="이름 입력 후 엔터"
          />
          <button onClick={addPlayer} className="bg-amber-400 hover:bg-amber-500 text-white font-bold px-4 rounded-xl transition text-lg">+</button>
        </div>

        {/* Score options */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer select-none" onClick={() => setNoScore(v => !v)}>
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${noScore ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
              {noScore && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-xs text-gray-600 font-medium">상관없음</span>
          </label>

          {!noScore && (
            <>
              <div className="w-px h-4 bg-gray-200" />
              <button onClick={() => setTierMode(false)} className={`text-xs px-2.5 py-1 rounded-lg border transition ${!tierMode ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500'}`}>숫자</button>
              <button onClick={() => setTierMode(true)} className={`text-xs px-2.5 py-1 rounded-lg border transition ${tierMode ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500'}`}>티어</button>

              {!tierMode ? (
                <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                  <input type="range" min={1} max={10} value={scoreInput} onChange={(e) => setScoreInput(Number(e.target.value))} className="flex-1 accent-amber-400" />
                  <span className="font-black text-amber-500 w-4 text-center text-sm">{scoreInput}</span>
                </div>
              ) : (
                <div className="flex gap-1">
                  {QUICK_TIERS.map(({ tier, label }) => (
                    <button key={tier} onClick={() => setTierInput(tier)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${tierInput === tier ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {quickPlayers.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500 font-medium">{quickPlayers.length}명</span>
            <button onClick={() => { setQuickPlayers([]); setResult(null); }} className="text-xs text-gray-400 hover:text-red-400">초기화</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickPlayers.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
                <span className="text-sm font-medium text-gray-900">{p.name}</span>
                {p.score !== null && <span className="text-amber-500 font-bold text-xs">{p.score}</span>}
                <button onClick={() => { setQuickPlayers(prev => prev.filter(x => x.id !== p.id)); setResult(null); }}
                  className="text-gray-300 hover:text-red-400 text-xs ml-0.5">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => quickPlayers.length >= 2 && setResult(balanceQuick(quickPlayers, nameA, nameB))}
        disabled={quickPlayers.length < 2}
        className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-gray-100 disabled:text-gray-300 text-white font-bold py-3 rounded-xl transition text-base">
        ⚡ 팀 나누기
      </button>

      {result && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${Number(diff) <= 1 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              점수 차 {diff}{Number(diff) <= 1 ? ' ⚖️' : ''}
            </span>
            <button onClick={() => setResult(balanceQuick(quickPlayers, nameA, nameB))}
              className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
              🔀 다시 섞기
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {result.map((team, i) => (
              <div key={i} className={`rounded-2xl border-2 p-4 ${i === 0 ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex justify-between mb-3">
                  <span className={`font-black text-sm ${i === 0 ? 'text-blue-700' : 'text-red-700'}`}>{team.name}</span>
                  <span className="text-xs font-semibold text-gray-500">{team.total}</span>
                </div>
                {[...team.players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((p) => (
                  <div key={p.id} className="flex justify-between text-xs py-1 border-b border-white/50 last:border-0">
                    <span className="text-gray-800">{p.name}</span>
                    <span className="font-bold text-gray-400">{p.score !== null ? p.score : '?'}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

function MatcherContent() {
  const searchParams = useSearchParams();
  const presetIds = (searchParams.get('preset') ?? '').split(',').filter(Boolean);
  const [mode, setMode] = useState<'registered' | 'quick'>('registered');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">팀 매칭</h1>
        <p className="text-gray-500 text-sm mt-0.5">균형 잡힌 팀을 자동으로 구성합니다</p>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1">
        <button onClick={() => setMode('registered')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === 'registered' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>
          👤 등록 선수
        </button>
        <button onClick={() => setMode('quick')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === 'quick' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>
          ⚡ 번개전
        </button>
      </div>

      {mode === 'registered' ? <RegisteredMatcher presetIds={presetIds} /> : <QuickMatcher />}
    </div>
  );
}

export default function MatcherPage() {
  return <Suspense><MatcherContent /></Suspense>;
}
