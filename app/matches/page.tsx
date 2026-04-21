'use client';
import { useState } from 'react';
import { useSoccerStore } from '../store/useSupabaseStore';
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

const INPUT = "w-full bg-slate-50 border-0 rounded-xl px-3.5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:text-gray-400";

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
  const totalWins = matchRecords.filter(m => m.scoreA > m.scoreB).length;
  const totalDraws = matchRecords.filter(m => m.scoreA === m.scoreB).length;
  const totalLosses = matchRecords.filter(m => m.scoreA < m.scoreB).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-gray-900">경기 기록</h1>
          <p className="text-gray-400 text-sm mt-0.5">총 {matchRecords.length}경기</p>
        </div>
        {role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)}
            className={`font-bold px-4 py-2 rounded-xl transition text-sm ${showForm ? 'bg-slate-100 text-gray-600' : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'}`}>
            {showForm ? '취소' : '+ 기록'}
          </button>
        )}
      </div>

      {/* Season summary */}
      {matchRecords.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-black text-blue-600">{totalWins}</div>
              <div className="text-[11px] text-gray-400 font-medium mt-0.5">승</div>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-400">{totalDraws}</div>
              <div className="text-[11px] text-gray-400 font-medium mt-0.5">무</div>
            </div>
            <div>
              <div className="text-2xl font-black text-red-500">{totalLosses}</div>
              <div className="text-[11px] text-gray-400 font-medium mt-0.5">패</div>
            </div>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <p className="text-base font-black text-gray-900">새 경기 기록</p>
          <input className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="경기 제목 (예: 5월 정기전)" required />
          <input type="date" className={INPUT} value={date} onChange={(e) => setDate(e.target.value)} />

          <div className="flex gap-2">
            <input className={`flex-1 bg-slate-50 border-0 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-center font-bold`}
              value={teamAName} onChange={(e) => setTeamAName(e.target.value)} />
            <span className="self-center text-gray-300 font-black text-sm">vs</span>
            <input className={`flex-1 bg-slate-50 border-0 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 text-center font-bold`}
              value={teamBName} onChange={(e) => setTeamBName(e.target.value)} />
          </div>

          {/* Score input */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-xs text-blue-500 font-bold mb-2">{teamAName}</p>
                <input type="number" min={0} value={scoreA} onChange={(e) => setScoreA(Number(e.target.value))}
                  className="w-16 h-16 text-center text-3xl font-black text-gray-900 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <span className="text-gray-200 text-3xl font-black mt-6">—</span>
              <div className="text-center">
                <p className="text-xs text-red-400 font-bold mb-2">{teamBName}</p>
                <input type="number" min={0} value={scoreB} onChange={(e) => setScoreB(Number(e.target.value))}
                  className="w-16 h-16 text-center text-3xl font-black text-gray-900 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">참여 선수 ({selectedIds.size}명 선택)</p>
            <div className="grid grid-cols-2 gap-1.5">
              {sortedPlayers.map((p) => (
                <button key={p.id} type="button" onClick={() => togglePlayer(p.id)}
                  className={`flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl font-semibold transition ${
                    selectedIds.has(p.id) ? 'bg-green-600 text-white' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                  }`}>
                  <span>{p.name}</span>
                  {selectedIds.has(p.id) && <span className="text-green-200">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="경기 메모 (선택)"
            className="w-full bg-slate-50 border-0 rounded-xl px-3.5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none h-16 placeholder:text-gray-400" />

          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition">
            저장 & MVP 투표 시작
          </button>
        </form>
      )}

      {/* MVP voter selector */}
      {matchRecords.some((m) => m.mvpOpen) && players.length > 0 && (
        <div className="bg-amber-50 rounded-2xl px-4 py-3.5 flex items-center gap-3">
          <span className="text-xl shrink-0">🏆</span>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-700 mb-1.5">MVP 투표: 내 선수 선택</p>
            <select className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none"
              value={myVoterId} onChange={(e) => setMyVoterId(e.target.value)}>
              <option value="">선수 선택...</option>
              {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Empty state */}
      {matchRecords.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl shadow-sm text-center py-20">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-400 font-medium">경기 기록이 없습니다</p>
        </div>
      )}

      {/* Match cards */}
      <div className="space-y-3">
        {matchRecords.map((m) => {
          const mvp = getMvpResult(m.mvpVotes);
          const myVote = m.mvpVotes.find((v) => v.voterId === myVoterId);
          const participants = players.filter((p) => m.playerIds.includes(p.id));
          const isWin  = m.scoreA > m.scoreB;
          const isDraw = m.scoreA === m.scoreB;
          const resultLabel = isWin ? `${m.teamAName} 승` : isDraw ? '무승부' : `${m.teamBName} 승`;
          const resultColor = isWin ? 'text-blue-600 bg-blue-50' : isDraw ? 'text-gray-500 bg-slate-100' : 'text-red-500 bg-red-50';

          return (
            <div key={m.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                {/* Title row */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-black text-gray-900">{m.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(m.date).toLocaleDateString('ko-KR')}</p>
                  </div>
                  {role === 'admin' && (
                    <button onClick={() => removeMatchRecord(m.id)} className="text-gray-200 hover:text-red-400 transition p-0.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>

                {/* Score card */}
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 text-center">
                      <p className="text-xs text-blue-500 font-bold mb-1">{m.teamAName}</p>
                      <p className="text-4xl font-black text-gray-900">{m.scoreA}</p>
                    </div>
                    <div className="text-center px-2">
                      <p className={`text-[10px] font-black px-2.5 py-1 rounded-full ${resultColor}`}>{resultLabel}</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-xs text-red-400 font-bold mb-1">{m.teamBName}</p>
                      <p className="text-4xl font-black text-gray-900">{m.scoreB}</p>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                {participants.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {participants.map((p) => (
                      <span key={p.id} className="text-[11px] bg-slate-100 text-gray-500 font-medium px-2 py-0.5 rounded-lg">{p.name}</span>
                    ))}
                  </div>
                )}

                {m.notes && <p className="text-xs text-gray-400 mt-2 italic">{m.notes}</p>}

                {/* MVP closed result */}
                {mvp && !m.mvpOpen && (
                  <div className="mt-3 bg-amber-50 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
                    <span className="text-xl">🏆</span>
                    <div>
                      <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wide">MVP</p>
                      <p className="text-sm font-black text-amber-800">{mvp.name}</p>
                    </div>
                    <span className="ml-auto text-xs text-amber-400 font-bold">{mvp.count}표</span>
                  </div>
                )}

                {/* MVP voting open */}
                {m.mvpOpen && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-xs font-bold text-gray-600">🏆 MVP 투표 진행중</p>
                      {role === 'admin' && (
                        <button onClick={() => closeMvpVoting(m.id)}
                          className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-0.5 rounded-lg transition">
                          마감
                        </button>
                      )}
                    </div>
                    {m.mvpVotes.length > 0 && (
                      <div className="bg-slate-50 rounded-xl p-2.5 mb-2.5 space-y-1">
                        {(() => {
                          const counts = new Map<string, { name: string; count: number }>();
                          m.mvpVotes.forEach((v) => { const p = counts.get(v.mvpPlayerId); counts.set(v.mvpPlayerId, { name: v.mvpPlayerName, count: (p?.count ?? 0) + 1 }); });
                          return [...counts.entries()].sort((a, b) => b[1].count - a[1].count).map(([id, { name, count }]) => (
                            <div key={id} className="flex justify-between text-xs px-1">
                              <span className="text-gray-600 font-medium">{name}</span>
                              <span className="font-bold text-amber-500">{count}표</span>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                    {myVoterId && !myVote && (
                      <div className="grid grid-cols-3 gap-1.5">
                        {participants.filter(p => p.id !== myVoterId).map((p) => (
                          <button key={p.id} onClick={() => voteForMvp(m.id, myVoterId, p.id, p.name)}
                            className="text-xs py-2 bg-slate-100 hover:bg-amber-100 hover:text-amber-700 rounded-xl text-gray-600 font-semibold transition">
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {myVote && (
                      <p className="text-xs text-green-600 font-bold text-center py-1">✅ {myVote.mvpPlayerName}에게 투표 완료</p>
                    )}
                    {!myVoterId && (
                      <p className="text-xs text-gray-400 text-center">위에서 내 선수를 먼저 선택하세요</p>
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
