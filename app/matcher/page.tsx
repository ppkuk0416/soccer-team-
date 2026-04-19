'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSoccerStore } from '../store/useSoccerStore';
import { Player, QuickPlayer, Tier, TIER_LABELS } from '../types';
import { TierBadge } from '../components/TierBadge';
import { balanceTeams } from '../utils/teamBalancer';
import { Team } from '../types';

// ─── Quick (번개전) types & helpers ──────────────────────────────────────────

const TIER_SCORE: Record<Tier, number> = {
  beginner: 2, amateur: 4, 'semi-pro': 7, pro: 10,
};

interface QuickTeam {
  name: string;
  players: QuickPlayer[];
  total: number;
  avg: number;
}

function balanceQuick(players: QuickPlayer[], nameA: string, nameB: string): [QuickTeam, QuickTeam] {
  const scoredCount = players.filter((p) => p.score !== null).length;
  const avg = scoredCount
    ? players.filter((p) => p.score !== null).reduce((s, p) => s + p.score!, 0) / scoredCount
    : 5;
  const withScore = players.map((p) => ({ ...p, score: p.score ?? avg + (Math.random() - 0.5) }));
  const sorted = [...withScore].sort((a, b) => b.score! - a.score!);
  const a: QuickPlayer[] = [];
  const b: QuickPlayer[] = [];
  sorted.forEach((p) => {
    const sA = a.reduce((s, x) => s + (x.score ?? 0), 0);
    const sB = b.reduce((s, x) => s + (x.score ?? 0), 0);
    if (sA <= sB) a.push(p); else b.push(p);
  });
  const make = (name: string, ps: QuickPlayer[]): QuickTeam => {
    const total = +ps.reduce((s, p) => s + (p.score ?? 0), 0).toFixed(1);
    return { name, players: ps, total, avg: ps.length ? +(total / ps.length).toFixed(1) : 0 };
  };
  return [make(nameA, a), make(nameB, b)];
}

function genId() { return Math.random().toString(36).slice(2, 8); }

// ─── Registered mode ─────────────────────────────────────────────────────────

function RegisteredMatcher({ presetIds }: { presetIds: string[] }) {
  const players = useSoccerStore((s) => s.players);
  const [selected, setSelected] = useState<Set<string>>(
    presetIds.length > 0 ? new Set(presetIds) : new Set()
  );
  const [result, setResult] = useState<[Team, Team] | null>(null);
  const [teamAName, setTeamAName] = useState('A팀');
  const [teamBName, setTeamBName] = useState('B팀');

  useEffect(() => {
    if (presetIds.length > 0) setSelected(new Set(presetIds));
  }, [presetIds.join(',')]);

  function toggle(id: string) { setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); setResult(null); }

  function handleBalance() {
    const chosen = players.filter((p) => selected.has(p.id));
    if (chosen.length < 2) return;
    setResult(balanceTeams(chosen, teamAName, teamBName));
  }

  const diff = result ? Math.abs(result[0].totalScore - result[1].totalScore) : 0;

  return (
    <div className="space-y-4">
      {presetIds.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700 font-medium">
          ✅ 출석 투표 참석자 {presetIds.length}명이 자동 선택됐습니다
        </div>
      )}

      <div className="flex gap-3">
        <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400" value={teamAName} onChange={(e) => setTeamAName(e.target.value)} />
        <span className="self-center text-gray-400 font-bold">vs</span>
        <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400" value={teamBName} onChange={(e) => setTeamBName(e.target.value)} />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">{selected.size}명 선택</span>
          <div className="flex gap-2 text-xs">
            <button onClick={() => { setSelected(new Set(players.map((p) => p.id))); setResult(null); }} className="text-green-600 hover:underline">전체</button>
            <span className="text-gray-200">|</span>
            <button onClick={() => { setSelected(new Set()); setResult(null); }} className="text-gray-400 hover:underline">해제</button>
          </div>
        </div>
        <div className="space-y-2">
          {players.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">팀 탭에서 선수를 먼저 추가해주세요</p>
          ) : (
            [...players].sort((a, b) => b.score - a.score).map((p) => (
              <div
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`bg-white rounded-xl px-4 py-3 shadow flex items-center justify-between gap-3 border cursor-pointer transition
                  ${selected.has(p.id) ? 'border-green-400 bg-green-50' : 'border-gray-100'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected.has(p.id) ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                    {selected.has(p.id) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 text-sm">{p.name}</span>
                      {p.status === 'measuring' && <span className="text-xs bg-orange-100 text-orange-500 px-1.5 py-0.5 rounded-full">측정중</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <TierBadge tier={p.tier} />
                      {p.position && <span className="text-xs text-gray-400">{p.position}</span>}
                    </div>
                  </div>
                </div>
                <span className={`text-xl font-bold ${p.status === 'measuring' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {p.status === 'measuring' ? '?' : p.score}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={handleBalance}
        disabled={selected.size < 2}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition text-lg"
      >
        ⚡ 팀 나누기
      </button>

      {result && (
        <div className="space-y-3">
          <div className="text-center">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${diff === 0 ? 'bg-green-100 text-green-700' : diff <= 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
              점수 차 {diff}점 {diff === 0 ? '⚖️ 완벽!' : ''}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {result.map((team, i) => (
              <div key={team.id} className={`rounded-2xl border-2 p-4 ${i === 0 ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`font-black ${i === 0 ? 'text-blue-700' : 'text-red-700'}`}>{team.name}</h3>
                  <span className="text-sm font-bold text-gray-500">{team.totalScore}점</span>
                </div>
                {[...team.players].sort((a, b) => b.score - a.score).map((p) => (
                  <div key={p.id} className="flex justify-between text-xs py-1 border-b border-white/60 last:border-0">
                    <div className="flex items-center gap-1">
                      <TierBadge tier={p.tier} />
                      <span className="text-gray-700">{p.name}</span>
                    </div>
                    <span className="font-bold text-gray-500">{p.score}</span>
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

// ─── Quick (번개전) mode ──────────────────────────────────────────────────────

const TIER_OPTIONS: { tier: Tier; label: string; color: string }[] = [
  { tier: 'beginner', label: '비기너', color: 'border-gray-300 text-gray-600' },
  { tier: 'amateur', label: '아마추어', color: 'border-blue-300 text-blue-600' },
  { tier: 'semi-pro', label: '세미프로', color: 'border-purple-300 text-purple-600' },
  { tier: 'pro', label: '프로', color: 'border-yellow-400 text-yellow-600' },
];

function QuickMatcher() {
  const [quickPlayers, setQuickPlayers] = useState<QuickPlayer[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [tierMode, setTierMode] = useState(false);
  const [scoreInput, setScoreInput] = useState(5);
  const [tierInput, setTierInput] = useState<Tier>('amateur');
  const [noScore, setNoScore] = useState(false);
  const [teamAName, setTeamAName] = useState('A팀');
  const [teamBName, setTeamBName] = useState('B팀');
  const [result, setResult] = useState<[QuickTeam, QuickTeam] | null>(null);

  function addPlayer() {
    const name = nameInput.trim();
    if (!name) return;
    const score = noScore ? null : tierMode ? TIER_SCORE[tierInput] : scoreInput;
    setQuickPlayers((prev) => [...prev, { id: genId(), name, score }]);
    setNameInput('');
    setNoScore(false);
    setResult(null);
  }

  const diff = result ? Math.abs(result[0].total - result[1].total).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 text-xs text-yellow-700">
        ⚡ 번개전 모드 — 저장 없이 즉석에서 팀을 구성합니다
      </div>

      <div className="flex gap-3">
        <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400" value={teamAName} onChange={(e) => setTeamAName(e.target.value)} />
        <span className="self-center text-gray-400 font-bold">vs</span>
        <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400" value={teamBName} onChange={(e) => setTeamBName(e.target.value)} />
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow p-4 space-y-3">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            placeholder="이름 입력 후 엔터"
          />
          <button onClick={addPlayer} className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-4 rounded-xl transition">+</button>
        </div>
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <div
              onClick={() => setNoScore((v) => !v)}
              className={`w-4 h-4 rounded border flex items-center justify-center text-xs cursor-pointer transition
                ${noScore ? 'bg-gray-500 border-gray-500 text-white' : 'border-gray-300'}`}
            >{noScore ? '✓' : ''}</div>
            <span className="text-xs text-gray-500">상관없음</span>
          </label>
          {!noScore && (
            <>
              <button onClick={() => setTierMode(false)} className={`text-xs px-2 py-1 rounded-lg border transition ${!tierMode ? 'bg-yellow-400 text-white border-yellow-400' : 'border-gray-200 text-gray-400'}`}>숫자</button>
              <button onClick={() => setTierMode(true)} className={`text-xs px-2 py-1 rounded-lg border transition ${tierMode ? 'bg-yellow-400 text-white border-yellow-400' : 'border-gray-200 text-gray-400'}`}>티어</button>
              {!tierMode ? (
                <div className="flex items-center gap-2 flex-1">
                  <input type="range" min={1} max={10} value={scoreInput} onChange={(e) => setScoreInput(Number(e.target.value))} className="flex-1 accent-yellow-400" />
                  <span className="font-bold text-yellow-600 w-4 text-center">{scoreInput}</span>
                </div>
              ) : (
                <div className="flex gap-1 flex-wrap">
                  {TIER_OPTIONS.map(({ tier, label, color }) => (
                    <button key={tier} onClick={() => setTierInput(tier)}
                      className={`text-xs px-2 py-1 rounded-lg border transition ${tierInput === tier ? color + ' bg-white ring-1 ring-current' : 'border-gray-200 text-gray-400'}`}>
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
            <span className="text-sm font-medium text-gray-600">{quickPlayers.length}명</span>
            <button onClick={() => { setQuickPlayers([]); setResult(null); }} className="text-xs text-gray-400 hover:text-red-400">초기화</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickPlayers.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm shadow-sm">
                <span className="font-medium text-gray-700">{p.name}</span>
                <span className="text-yellow-500 font-bold text-xs">{p.score !== null ? p.score : '?'}</span>
                <button onClick={() => { setQuickPlayers((prev) => prev.filter((x) => x.id !== p.id)); setResult(null); }} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => quickPlayers.length >= 2 && setResult(balanceQuick(quickPlayers, teamAName, teamBName))}
        disabled={quickPlayers.length < 2}
        className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-100 disabled:text-gray-300 text-white font-bold py-3 rounded-xl transition text-lg"
      >
        ⚡ 팀 나누기
      </button>

      {result && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${Number(diff) <= 1 ? 'bg-green-100 text-green-700' : Number(diff) <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
              점수 차 {diff} {Number(diff) <= 1 ? '⚖️' : ''}
            </span>
            <button onClick={() => setResult(balanceQuick(quickPlayers, teamAName, teamBName))} className="text-sm text-gray-400 border border-gray-200 rounded-lg px-3 py-1 hover:text-gray-600 transition">🔀 다시 섞기</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {result.map((team, i) => (
              <div key={i} className={`rounded-2xl border-2 p-4 ${i === 0 ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`font-black ${i === 0 ? 'text-blue-700' : 'text-red-700'}`}>{team.name}</h3>
                  <span className="text-sm font-bold text-gray-500">{team.total}</span>
                </div>
                {[...team.players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((p) => (
                  <div key={p.id} className="flex justify-between text-xs py-1 border-b border-white/60 last:border-0">
                    <span className="text-gray-700">{p.name}</span>
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

// ─── Main page ────────────────────────────────────────────────────────────────

function MatcherContent() {
  const searchParams = useSearchParams();
  const presetParam = searchParams.get('preset') ?? '';
  const presetIds = presetParam ? presetParam.split(',').filter(Boolean) : [];

  const [mode, setMode] = useState<'registered' | 'quick'>(presetIds.length > 0 ? 'registered' : 'registered');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">팀 매칭</h1>
        <p className="text-gray-500 text-sm mt-1">균형 잡힌 팀을 자동으로 구성합니다</p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        <button
          onClick={() => setMode('registered')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === 'registered' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}
        >
          👤 등록 선수
        </button>
        <button
          onClick={() => setMode('quick')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === 'quick' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}
        >
          ⚡ 번개전
        </button>
      </div>

      {mode === 'registered' ? (
        <RegisteredMatcher presetIds={presetIds} />
      ) : (
        <QuickMatcher />
      )}
    </div>
  );
}

export default function MatcherPage() {
  return (
    <Suspense>
      <MatcherContent />
    </Suspense>
  );
}
