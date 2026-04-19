'use client';
import { useState } from 'react';
import { useSoccerStore } from '../store/useSoccerStore';
import { balanceTeams } from '../utils/teamBalancer';
import { MatchResult, Team } from '../types';
import { TierBadge } from '../components/TierBadge';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          className={`text-xl ${s <= value ? 'text-yellow-400' : 'text-gray-200'} ${onChange ? 'hover:text-yellow-300 cursor-pointer' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function MatchesPage() {
  const { players, matches, addMatch, removeMatch, incrementMatchCount } = useSoccerStore();
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [teams, setTeams] = useState<[Team, Team] | null>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [mannerA, setMannerA] = useState(3);
  const [mannerB, setMannerB] = useState(3);
  const [notes, setNotes] = useState('');

  function togglePlayer(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setTeams(null);
  }

  function generateTeams() {
    const chosen = players.filter((p) => selectedIds.has(p.id));
    if (chosen.length < 2) return;
    setTeams(balanceTeams(chosen));
  }

  function handleSave() {
    if (!teams) return;
    const match: MatchResult = {
      id: genId(),
      date: new Date().toISOString(),
      teamA: teams[0],
      teamB: teams[1],
      scoreA,
      scoreB,
      mannerRatingA: mannerA,
      mannerRatingB: mannerB,
      notes: notes.trim() || undefined,
    };
    addMatch(match);
    const allPlayerIds = [...teams[0].players, ...teams[1].players].map((p) => p.id);
    incrementMatchCount(allPlayerIds);
    setShowForm(false);
    setSelectedIds(new Set());
    setTeams(null);
    setScoreA(0); setScoreB(0);
    setMannerA(3); setMannerB(3);
    setNotes('');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">경기 기록</h1>
          <p className="text-gray-500 text-sm mt-1">총 {matches.length}경기</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-xl transition shadow"
        >
          {showForm ? '취소' : '+ 경기 기록'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 space-y-5">
          <h2 className="font-bold text-gray-700">새 경기 기록</h2>

          {/* Step 1: Select players */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">1. 참가 선수 선택 ({selectedIds.size}명)</p>
            <div className="grid grid-cols-2 gap-2">
              {[...players].sort((a, b) => b.score - a.score).map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlayer(p.id)}
                  className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg border transition
                    ${selectedIds.has(p.id) ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-gray-500 font-bold">{p.score}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Generate teams */}
          <button
            onClick={generateTeams}
            disabled={selectedIds.size < 2}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2 rounded-xl transition"
          >
            팀 자동 배정
          </button>

          {teams && (
            <>
              {/* Teams display */}
              <div className="grid grid-cols-2 gap-3">
                {teams.map((team) => (
                  <div key={team.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm">{team.name}</span>
                      <span className="text-green-600 font-bold text-sm">{team.totalScore}점</span>
                    </div>
                    {team.players.map((p) => (
                      <div key={p.id} className="flex justify-between text-xs text-gray-600 py-0.5">
                        <span>{p.name}</span><span>{p.score}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Score input */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">경기 결과</p>
                <div className="flex items-center gap-3 justify-center">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">{teams[0].name}</p>
                    <input
                      type="number" min={0} value={scoreA}
                      onChange={(e) => setScoreA(Number(e.target.value))}
                      className="w-16 text-center text-2xl font-bold border border-gray-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  <span className="text-gray-400 font-bold text-xl mt-4">:</span>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">{teams[1].name}</p>
                    <input
                      type="number" min={0} value={scoreB}
                      onChange={(e) => setScoreB(Number(e.target.value))}
                      className="w-16 text-center text-2xl font-bold border border-gray-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                </div>
              </div>

              {/* Manner rating */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">매너 평가</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">{teams[0].name}</p>
                    <StarRating value={mannerA} onChange={setMannerA} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">{teams[1].name}</p>
                    <StarRating value={mannerB} onChange={setMannerB} />
                  </div>
                </div>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="경기 메모 (선택)"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none h-20"
              />

              <button
                onClick={handleSave}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition"
              >
                경기 저장
              </button>
            </>
          )}
        </div>
      )}

      {/* Match history */}
      <div className="space-y-3">
        {matches.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p>아직 기록된 경기가 없습니다</p>
          </div>
        ) : (
          matches.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl shadow border border-gray-100 p-4">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs text-gray-400">{new Date(m.date).toLocaleDateString('ko-KR')}</span>
                <button onClick={() => removeMatch(m.id)} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="font-bold text-gray-800">{m.teamA.name}</p>
                  <p className="text-xs text-gray-400">avg {m.teamA.avgScore}</p>
                  <StarRating value={m.mannerRatingA} />
                </div>
                <div className="text-center px-4">
                  <span className="text-3xl font-black text-gray-800">{m.scoreA}</span>
                  <span className="text-gray-400 mx-2">:</span>
                  <span className="text-3xl font-black text-gray-800">{m.scoreB}</span>
                  <p className="text-xs text-gray-400 mt-1">
                    {m.scoreA > m.scoreB ? m.teamA.name : m.scoreB > m.scoreA ? m.teamB.name : '무승부'} 승
                  </p>
                </div>
                <div className="text-center flex-1">
                  <p className="font-bold text-gray-800">{m.teamB.name}</p>
                  <p className="text-xs text-gray-400">avg {m.teamB.avgScore}</p>
                  <StarRating value={m.mannerRatingB} />
                </div>
              </div>
              {m.notes && <p className="text-xs text-gray-400 mt-3 border-t pt-2">{m.notes}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
