'use client';
import { useState, useRef } from 'react';
import { useSoccerStore } from '../store/useSoccerStore';
import { MatchRecord } from '../types';

function getMvpResult(votes: MatchRecord['mvpVotes']) {
  if (!votes.length) return null;
  const counts = new Map<string, { name: string; count: number }>();
  votes.forEach((v) => {
    const prev = counts.get(v.mvpPlayerId);
    counts.set(v.mvpPlayerId, { name: v.mvpPlayerName, count: (prev?.count ?? 0) + 1 });
  });
  return [...counts.values()].sort((a, b) => b.count - a.count)[0];
}

export default function MatchesPage() {
  const { players, matchRecords, role, addMatchRecord, removeMatchRecord, voteForMvp, closeMvpVoting, incrementMatchCount } = useSoccerStore();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [teamAName, setTeamAName] = useState('A팀');
  const [teamBName, setTeamBName] = useState('B팀');
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [myVoterId, setMyVoterId] = useState('');

  function togglePlayer(id: string) {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const playerIds = [...selectedIds];
    addMatchRecord({ date, title: title.trim(), teamAName, teamBName, scoreA, scoreB, playerIds, notes: notes.trim() || undefined });
    incrementMatchCount(playerIds);
    setShowForm(false);
    setTitle(''); setScoreA(0); setScoreB(0); setSelectedIds(new Set()); setNotes('');
  }

  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">경기 기록</h1>
          <p className="text-gray-500 text-sm mt-0.5">총 {matchRecords.length}경기</p>
        </div>
        {role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-2 rounded-xl transition text-sm">
            {showForm ? '취소' : '+ 기록'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="font-bold text-gray-900 text-sm">새 경기 기록</p>
          <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
            value={title} onChange={(e) => setTitle(e.target.value)} placeholder="경기 제목 (예: 5월 3일 정기전)" required />
          <input type="date"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
            value={date} onChange={(e) => setDate(e.target.value)} />

          {/* Team names */}
          <div className="flex gap-2">
            <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={teamAName} onChange={(e) => setTeamAName(e.target.value)} />
            <span className="self-center text-gray-300 font-bold">vs</span>
            <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={teamBName} onChange={(e) => setTeamBName(e.target.value)} />
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">{teamAName}</p>
              <input type="number" min={0} value={scoreA} onChange={(e) => setScoreA(Number(e.target.value))}
                className="w-16 text-center text-2xl font-black text-gray-900 border border-gray-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <span className="text-gray-300 text-2xl font-bold mt-5">:</span>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">{teamBName}</p>
              <input type="number" min={0} value={scoreB} onChange={(e) => setScoreB(Number(e.target.value))}
                className="w-16 text-center text-2xl font-black text-gray-900 border border-gray-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>

          {/* Player selection */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">참여 선수 ({selectedIds.size}명)</p>
            <div className="grid grid-cols-2 gap-1.5">
              {sortedPlayers.map((p) => (
                <button key={p.id} type="button" onClick={() => togglePlayer(p.id)}
                  className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl border transition ${selectedIds.has(p.id) ? 'border-green-400 bg-green-50 text-green-700 font-semibold' : 'border-gray-200 text-gray-600'}`}>
                  <span>{p.name}</span>
                  {selectedIds.has(p.id) && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="경기 메모 (선택)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none h-16" />

          <button type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition">
            저장 & MVP 투표 시작
          </button>
        </form>
      )}

      {/* My voter selection for MVP */}
      {matchRecords.some((m) => m.mvpOpen) && players.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-amber-700 mb-1.5">MVP 투표용 내 선수 선택</p>
          <select className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none"
            value={myVoterId} onChange={(e) => setMyVoterId(e.target.value)}>
            <option value="">선택...</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {matchRecords.length === 0 && !showForm && (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-gray-400 text-sm">경기 기록이 없습니다</p>
        </div>
      )}

      <div className="space-y-4">
        {matchRecords.map((m) => {
          const mvp = getMvpResult(m.mvpVotes);
          const myVote = m.mvpVotes.find((v) => v.voterId === myVoterId);
          const result = m.scoreA > m.scoreB ? `${m.teamAName} 승` : m.scoreA < m.scoreB ? `${m.teamBName} 승` : '무승부';
          const resultColor = m.scoreA > m.scoreB ? 'text-blue-600' : m.scoreA < m.scoreB ? 'text-red-500' : 'text-gray-500';
          const participants = players.filter((p) => m.playerIds.includes(p.id));

          return (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{m.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(m.date).toLocaleDateString('ko-KR')}</p>
                  </div>
                  {role === 'admin' && (
                    <button onClick={() => removeMatchRecord(m.id)} className="text-gray-300 hover:text-red-400 transition">✕</button>
                  )}
                </div>

                {/* Score */}
                <div className="flex items-center justify-center gap-6 my-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">{m.teamAName}</p>
                    <p className="text-3xl font-black text-gray-900">{m.scoreA}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-gray-200 text-xl font-bold">:</span>
                    <p className={`text-xs font-semibold mt-1 ${resultColor}`}>{result}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">{m.teamBName}</p>
                    <p className="text-3xl font-black text-gray-900">{m.scoreB}</p>
                  </div>
                </div>

                {/* Participants */}
                {participants.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {participants.map((p) => (
                      <span key={p.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.name}</span>
                    ))}
                  </div>
                )}

                {m.notes && <p className="text-xs text-gray-400 mb-3 italic">{m.notes}</p>}

                {/* MVP section */}
                {mvp && !m.mvpOpen && (
                  <div className="bg-amber-50 rounded-xl px-3 py-2 flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <div>
                      <p className="text-xs text-amber-600 font-semibold">MVP</p>
                      <p className="text-sm font-black text-amber-800">{mvp.name}</p>
                    </div>
                    <span className="ml-auto text-xs text-amber-500">{mvp.count}표</span>
                  </div>
                )}

                {/* MVP voting */}
                {m.mvpOpen && (
                  <div className="border-t border-gray-50 pt-3 mt-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-600">🏆 MVP 투표 진행중</p>
                      {role === 'admin' && (
                        <button onClick={() => closeMvpVoting(m.id)} className="text-xs text-gray-400 hover:text-gray-600">마감</button>
                      )}
                    </div>
                    {/* Current standings */}
                    {m.mvpVotes.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {(() => {
                          const counts = new Map<string, { name: string; count: number }>();
                          m.mvpVotes.forEach((v) => { const p = counts.get(v.mvpPlayerId); counts.set(v.mvpPlayerId, { name: v.mvpPlayerName, count: (p?.count ?? 0) + 1 }); });
                          return [...counts.entries()].sort((a, b) => b[1].count - a[1].count).map(([id, { name, count }]) => (
                            <div key={id} className="flex justify-between text-xs text-gray-600 px-2">
                              <span>{name}</span><span className="font-bold text-amber-500">{count}표</span>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                    {myVoterId && !myVote && (
                      <div className="grid grid-cols-3 gap-1">
                        {participants.map((p) => (
                          p.id !== myVoterId && (
                            <button key={p.id} onClick={() => voteForMvp(m.id, myVoterId, p.id, p.name)}
                              className="text-xs py-1.5 border border-gray-200 rounded-lg hover:bg-amber-50 hover:border-amber-300 text-gray-700 transition">
                              {p.name}
                            </button>
                          )
                        ))}
                      </div>
                    )}
                    {myVote && (
                      <p className="text-xs text-green-600 text-center py-1">✅ {myVote.mvpPlayerName}에게 투표했습니다</p>
                    )}
                    {!myVoterId && (
                      <p className="text-xs text-gray-400 text-center">위에서 내 선수를 선택하면 투표할 수 있습니다</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
