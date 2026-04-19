'use client';
import { useState, useRef } from 'react';
import { QuickPlayer, Tier, TIER_LABELS } from '../types';

const TIER_SCORE: Record<Tier, number> = {
  beginner: 2,
  amateur: 4,
  'semi-pro': 7,
  pro: 10,
};

const TIER_OPTIONS: { tier: Tier; label: string; color: string }[] = [
  { tier: 'beginner', label: '비기너', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { tier: 'amateur', label: '아마추어', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { tier: 'semi-pro', label: '세미프로', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { tier: 'pro', label: '프로', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
];

function genId() {
  return Math.random().toString(36).slice(2, 8);
}

interface BalancedTeam {
  name: string;
  players: QuickPlayer[];
  total: number;
  avg: number;
}

function balanceQuick(players: QuickPlayer[], teamAName: string, teamBName: string): [BalancedTeam, BalancedTeam] {
  // 점수 없는 선수는 전체 평균으로 채움
  const scoredCount = players.filter((p) => p.score !== null).length;
  const avg = scoredCount
    ? players.filter((p) => p.score !== null).reduce((s, p) => s + p.score!, 0) / scoredCount
    : 5;

  const withScore = players.map((p) => ({ ...p, score: p.score ?? avg + (Math.random() - 0.5) }));
  const sorted = [...withScore].sort((a, b) => b.score! - a.score!);

  const a: QuickPlayer[] = [];
  const b: QuickPlayer[] = [];
  sorted.forEach((p) => {
    const sumA = a.reduce((s, x) => s + (x.score ?? 0), 0);
    const sumB = b.reduce((s, x) => s + (x.score ?? 0), 0);
    if (sumA <= sumB) a.push(p);
    else b.push(p);
  });

  const makeTeam = (name: string, ps: QuickPlayer[]): BalancedTeam => {
    const total = +ps.reduce((s, p) => s + (p.score ?? 0), 0).toFixed(1);
    return { name, players: ps, total, avg: ps.length ? +(total / ps.length).toFixed(1) : 0 };
  };

  return [makeTeam(teamAName, a), makeTeam(teamBName, b)];
}

export default function QuickPage() {
  const [players, setPlayers] = useState<QuickPlayer[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [tierMode, setTierMode] = useState(false); // true = 티어선택, false = 숫자입력
  const [scoreInput, setScoreInput] = useState<number>(5);
  const [tierInput, setTierInput] = useState<Tier>('amateur');
  const [noScore, setNoScore] = useState(false); // 상관없음
  const [teamAName, setTeamAName] = useState('A팀');
  const [teamBName, setTeamBName] = useState('B팀');
  const [result, setResult] = useState<[BalancedTeam, BalancedTeam] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function addPlayer() {
    const name = nameInput.trim();
    if (!name) return;
    const score = noScore ? null : tierMode ? TIER_SCORE[tierInput] : scoreInput;
    setPlayers((prev) => [...prev, { id: genId(), name, score }]);
    setNameInput('');
    setNoScore(false);
    setResult(null);
    inputRef.current?.focus();
  }

  function removePlayer(id: string) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setResult(null);
  }

  function handleBalance() {
    if (players.length < 2) return;
    setResult(balanceQuick(players, teamAName, teamBName));
  }

  function handleShuffle() {
    if (!result) return;
    setResult(balanceQuick(players, teamAName, teamBName));
  }

  function handleReset() {
    setPlayers([]);
    setResult(null);
  }

  const diff = result ? Math.abs(result[0].total - result[1].total).toFixed(1) : '0';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <h1 className="text-2xl font-bold text-gray-800">번개전</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">그때그때 이름 입력해서 즉석 팀 구성 — 저장 없음</p>
      </div>

      {/* Team names */}
      <div className="flex gap-3">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
          value={teamAName} onChange={(e) => setTeamAName(e.target.value)}
        />
        <span className="self-center text-gray-400 font-bold">vs</span>
        <input
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
          value={teamBName} onChange={(e) => setTeamBName(e.target.value)}
        />
      </div>

      {/* Input area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow p-4 space-y-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            placeholder="이름 입력 (엔터)"
          />
          <button
            onClick={addPlayer}
            className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-4 rounded-xl transition"
          >
            +
          </button>
        </div>

        {/* Score input toggle */}
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={() => setNoScore((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition font-medium text-xs
              ${noScore ? 'bg-gray-100 border-gray-300 text-gray-600' : 'border-gray-200 text-gray-400'}`}
          >
            <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${noScore ? 'bg-gray-500 border-gray-500 text-white' : 'border-gray-300'}`}>
              {noScore ? '✓' : ''}
            </span>
            상관없음
          </button>

          {!noScore && (
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={() => setTierMode(false)}
                className={`text-xs px-2 py-1 rounded-lg border transition ${!tierMode ? 'bg-yellow-400 text-white border-yellow-400' : 'border-gray-200 text-gray-400'}`}
              >
                숫자
              </button>
              <button
                onClick={() => setTierMode(true)}
                className={`text-xs px-2 py-1 rounded-lg border transition ${tierMode ? 'bg-yellow-400 text-white border-yellow-400' : 'border-gray-200 text-gray-400'}`}
              >
                티어
              </button>

              {!tierMode ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="range" min={1} max={10} value={scoreInput}
                    onChange={(e) => setScoreInput(Number(e.target.value))}
                    className="flex-1 accent-yellow-400"
                  />
                  <span className="font-bold text-yellow-600 w-4 text-center">{scoreInput}</span>
                </div>
              ) : (
                <div className="flex gap-1 flex-wrap">
                  {TIER_OPTIONS.map(({ tier, label, color }) => (
                    <button
                      key={tier}
                      onClick={() => setTierInput(tier)}
                      className={`text-xs px-2 py-1 rounded-lg border transition ${tierInput === tier ? color + ' font-semibold' : 'border-gray-200 text-gray-400'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Player list */}
      {players.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">{players.length}명 추가됨</span>
            <button onClick={handleReset} className="text-xs text-gray-400 hover:text-red-400 transition">전체 초기화</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm shadow-sm"
              >
                <span className="font-medium text-gray-700">{p.name}</span>
                {p.score !== null ? (
                  <span className="text-yellow-600 font-bold text-xs">{p.score}</span>
                ) : (
                  <span className="text-gray-300 text-xs">-</span>
                )}
                <button onClick={() => removePlayer(p.id)} className="text-gray-300 hover:text-red-400 text-xs ml-1">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleBalance}
        disabled={players.length < 2}
        className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-100 disabled:text-gray-300 text-white font-bold py-3 rounded-xl transition shadow text-lg"
      >
        ⚡ 팀 나누기
      </button>

      {/* Result */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              Number(diff) <= 1 ? 'bg-green-100 text-green-700' :
              Number(diff) <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
            }`}>
              점수 차: {diff} {Number(diff) <= 1 ? '⚖️ 균형!' : ''}
            </span>
            <button
              onClick={handleShuffle}
              className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1 transition"
            >
              🔀 다시 섞기
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {result.map((team, i) => (
              <div key={i} className={`rounded-2xl border-2 p-4 ${i === 0 ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`font-black text-lg ${i === 0 ? 'text-blue-700' : 'text-red-700'}`}>{team.name}</h3>
                  <div className="text-right">
                    <div className={`font-bold text-sm ${i === 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {team.total.toFixed(1)}점
                    </div>
                    <div className="text-xs text-gray-400">avg {team.avg}</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {[...team.players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-sm bg-white rounded-lg px-2.5 py-1.5">
                      <span className="font-medium text-gray-700">{p.name}</span>
                      <span className="text-gray-400 font-bold text-xs">
                        {p.score !== null ? p.score : '?'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
