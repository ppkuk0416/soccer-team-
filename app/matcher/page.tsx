'use client';
import { useState } from 'react';
import { useSoccerStore } from '../store/useSoccerStore';
import { PlayerCard } from '../components/PlayerCard';
import { TierBadge } from '../components/TierBadge';
import { balanceTeams, scoreDiff } from '../utils/teamBalancer';
import { Team } from '../types';

export default function MatcherPage() {
  const players = useSoccerStore((s) => s.players);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<[Team, Team] | null>(null);
  const [teamAName, setTeamAName] = useState('A팀');
  const [teamBName, setTeamBName] = useState('B팀');

  function togglePlayer(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setResult(null);
  }

  function selectAll() {
    setSelected(new Set(players.map((p) => p.id)));
    setResult(null);
  }

  function clearAll() {
    setSelected(new Set());
    setResult(null);
  }

  function handleBalance() {
    const chosen = players.filter((p) => selected.has(p.id));
    if (chosen.length < 2) return;
    setResult(balanceTeams(chosen, teamAName, teamBName));
  }

  const diff = result ? scoreDiff(result[0], result[1]) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">팀 자동 매칭</h1>
        <p className="text-gray-500 text-sm mt-1">참가 선수를 선택하면 균형 잡힌 팀을 자동으로 구성합니다</p>
      </div>

      {/* Team name inputs */}
      <div className="flex gap-3">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400"
          value={teamAName} onChange={(e) => setTeamAName(e.target.value)}
          placeholder="A팀 이름"
        />
        <span className="self-center text-gray-400 font-bold">vs</span>
        <input
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400"
          value={teamBName} onChange={(e) => setTeamBName(e.target.value)}
          placeholder="B팀 이름"
        />
      </div>

      {/* Player selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">{selected.size}명 선택됨</span>
          <div className="flex gap-2 text-sm">
            <button onClick={selectAll} className="text-green-600 hover:underline">전체 선택</button>
            <span className="text-gray-300">|</span>
            <button onClick={clearAll} className="text-gray-400 hover:underline">해제</button>
          </div>
        </div>
        <div className="space-y-2">
          {players.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>선수 관리에서 선수를 먼저 추가해주세요</p>
            </div>
          ) : (
            [...players].sort((a, b) => b.score - a.score).map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                selectable
                selected={selected.has(p.id)}
                onToggle={() => togglePlayer(p.id)}
              />
            ))
          )}
        </div>
      </div>

      <button
        onClick={handleBalance}
        disabled={selected.size < 2}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition shadow text-lg"
      >
        ⚡ 팀 균형 맞추기
      </button>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className="text-center">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${diff === 0 ? 'bg-green-100 text-green-700' : diff <= 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
              점수 차이: {diff}점 {diff === 0 ? '(완벽한 균형!)' : diff <= 2 ? '(양호)' : '(불균형)'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {result.map((team) => (
              <div key={team.id} className="bg-white rounded-2xl shadow border border-gray-100 p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-800">{team.name}</h3>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-600">{team.totalScore}점</span>
                    <span className="text-xs text-gray-400 ml-1">avg {team.avgScore}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {[...team.players].sort((a, b) => b.score - a.score).map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <TierBadge tier={p.tier} />
                        <span className="text-gray-700">{p.name}</span>
                        {p.position && <span className="text-gray-400 text-xs">{p.position}</span>}
                      </div>
                      <span className="font-bold text-gray-600">{p.score}</span>
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
