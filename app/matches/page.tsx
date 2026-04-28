'use client';
import { useState } from 'react';
import { useSupabaseStore } from '../store/useSupabaseStore';
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

const INPUT = "w-full bg-stone-50 border-0 rounded-xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:text-stone-400";

export default function MatchesPage() {
  const { players, matchRecords, role, addMatchRecord, removeMatchRecord, voteForMvp, closeMvpVoting, incrementMatchCount } = useSupabaseStore();
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
  const wins   = matchRecords.filter(m => m.scoreA > m.scoreB).length;
  const draws  = matchRecords.filter(m => m.scoreA === m.scoreB).length;
  const losses = matchRecords.filter(m => m.scoreA < m.scoreB).length;
  const totalFor     = matchRecords.reduce((s, m) => s + m.scoreA, 0);
  const totalAgainst = matchRecords.reduce((s, m) => s + m.scoreB, 0);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-gray-900">경기 기록</h1>
          <p className="text-stone-400 text-sm mt-0.5">팀의 공식 경기 결과</p>
        </div>
        {role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)}
            className={`font-bold px-4 py-2 rounded-xl transition text-sm shadow-sm ${
              showForm ? 'bg-stone-100 text-gray-600' : 'bg-green-600 hover:bg-green-700 text-white'
            }`}>
            {showForm ? '취소' : '+ 기록'}
          </button>
        )}
      </div>

      {/* Season record card */}
      {matchRecords.length > 0 && (
        <div className="bg-stone-900 rounded-2xl p-5 text-white">
          <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest mb-4">시즌 전적</p>
          <div className="flex items-center">
            <div className="flex-1 text-center">
              <div className="text-4xl font-black text-green-400">{wins}</div>
              <div className="text-stone-600 text-xs font-bold mt-1">승</div>
            </div>
            <div className="w-px h-12 bg-stone-800" />
            <div className="flex-1 text-center">
              <div className="text-4xl font-black text-stone-400">{draws}</div>
              <div className="text-stone-600 text-xs font-bold mt-1">무</div>
            </div>
            <div className="w-px h-12 bg-stone-800" />
            <div className="flex-1 text-center">
              <div className="text-4xl font-black text-red-400">{losses}</div>
              <div className="text-stone-600 text-xs font-bold mt-1">패</div>
            </div>
            <div className="w-px h-12 bg-stone-800" />
            <div className="flex-1 text-center">
              <div className="text-xl font-black">{totalFor}<span className="text-stone-600 text-sm">:</span>{totalAgainst}</div>
              <div className="text-stone-600 text-xs font-bold mt-1">득실</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-stone-600 mb-1.5 font-bold">
              <span>승률 {Math.round((wins / matchRecords.length) * 100)}%</span>
              <span>{matchRecords.length}경기</span>
            </div>
            <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden flex">
              <div className="h-full bg-green-500" style={{ width: `${(wins / matchRecords.length) * 100}%` }} />
              <div className="h-full bg-stone-600" style={{ width: `${(draws / matchRecords.length) * 100}%` }} />
              <div className="h-full bg-red-500/60" style={{ width: `${(losses / matchRecords.length) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* MVP voter selector */}
      {matchRecords.some((m) => m.mvpOpen) && players.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-700 mb-1.5">MVP 투표 진행중 — 내 선수 선택</p>
            <select className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none"
              value={myVoterId} onChange={(e) => setMyVoterId(e.target.value)}>
              <option value="">선수 선택...</option>
              {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
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
            <input className="flex-1 bg-stone-50 border-0 rounded-xl px-3.5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-center font-bold"
              value={teamAName} onChange={(e) => setTeamAName(e.target.value)} />
            <span className="self-center text-stone-300 font-black text-sm">vs</span>
            <input className="flex-1 bg-stone-50 border-0 rounded-xl px-3.5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 text-center font-bold"
              value={teamBName} onChange={(e) => setTeamBName(e.target.value)} />
          </div>

          <div className="bg-stone-50 rounded-2xl p-4">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-xs text-blue-500 font-bold mb-2">{teamAName}</p>
                <input type="number" min={0} value={scoreA} onChange={(e) => setScoreA(Number(e.target.value))}
                  className="w-16 h-16 text-center text-3xl font-black text-gray-900 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <span className="text-stone-300 text-3xl font-black mt-5">:</span>
              <div className="text-center">
                <p className="text-xs text-red-400 font-bold mb-2">{teamBName}</p>
                <input type="number" min={0} value={scoreB} onChange={(e) => setScoreB(Number(e.target.value))}
                  className="w-16 h-16 text-center text-3xl font-black text-gray-900 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wide">참여 선수</p>
              <span className="text-xs text-stone-400">{selectedIds.size}명 선택</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {sortedPlayers.map((p) => (
                <button key={p.id} type="button" onClick={() => togglePlayer(p.id)}
                  className={`flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl font-semibold transition ${
                    selectedIds.has(p.id) ? 'bg-green-600 text-white' : 'bg-stone-100 text-gray-600 hover:bg-stone-200'
                  }`}>
                  <span>{p.name}</span>
                  {selectedIds.has(p.id) && (
                    <svg className="w-3.5 h-3.5 text-green-200" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="경기 메모 (선택)"
            className="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none h-16 placeholder:text-stone-400" />

          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition">
            저장 & MVP 투표 시작
          </button>
        </form>
      )}

      {/* Empty state */}
      {matchRecords.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl shadow-sm text-center py-20">
          <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-stone-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
          </div>
          <p className="text-gray-500 font-bold">경기 기록이 없습니다</p>
          <p className="text-stone-400 text-sm mt-1">첫 경기 결과를 기록해보세요</p>
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

          return (
            <div key={m.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className={`h-1 ${isWin ? 'bg-green-500' : isDraw ? 'bg-stone-300' : 'bg-red-400'}`} />
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-gray-900">{m.title}</h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(m.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                      isWin ? 'bg-green-100 text-green-700' :
                      isDraw ? 'bg-stone-100 text-stone-500' :
                      'bg-red-50 text-red-500'
                    }`}>
                      {isWin ? '승' : isDraw ? '무' : '패'}
                    </span>
                    {role === 'admin' && (
                      <button onClick={() => removeMatchRecord(m.id)} className="text-stone-200 hover:text-red-400 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Scoreboard */}
                <div className="bg-stone-50 rounded-2xl px-6 py-4 flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-blue-500 font-bold mb-1 truncate">{m.teamAName}</p>
                    <p className="text-5xl font-black text-gray-900 leading-none">{m.scoreA}</p>
                  </div>
                  <div className="text-stone-300 font-black text-2xl px-2">:</div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-red-400 font-bold mb-1 truncate">{m.teamBName}</p>
                    <p className="text-5xl font-black text-gray-900 leading-none">{m.scoreB}</p>
                  </div>
                </div>

                {participants.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {participants.map((p) => (
                      <span key={p.id} className="text-[11px] bg-stone-100 text-stone-500 font-semibold px-2 py-0.5 rounded-lg">
                        {p.name}
                      </span>
                    ))}
                  </div>
                )}

                {m.notes && <p className="text-xs text-stone-400 mt-2 italic">{m.notes}</p>}

                {/* MVP closed */}
                {mvp && !m.mvpOpen && (
                  <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wide">MVP</p>
                      <p className="text-sm font-black text-amber-800">{mvp.name}</p>
                    </div>
                    <span className="ml-auto text-xs text-amber-400 font-bold">{mvp.count}표</span>
                  </div>
                )}

                {/* MVP voting */}
                {m.mvpOpen && (
                  <div className="mt-3 pt-3 border-t border-stone-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                        <p className="text-xs font-bold text-gray-700">MVP 투표 진행중</p>
                      </div>
                      {role === 'admin' && (
                        <button onClick={() => closeMvpVoting(m.id)}
                          className="text-xs text-stone-400 hover:text-gray-600 border border-stone-200 px-2.5 py-1 rounded-lg transition">
                          마감
                        </button>
                      )}
                    </div>
                    {m.mvpVotes.length > 0 && (
                      <div className="bg-stone-50 rounded-xl p-3 mb-3 space-y-1.5">
                        {(() => {
                          const counts = new Map<string, { name: string; count: number }>();
                          m.mvpVotes.forEach((v) => {
                            const prev = counts.get(v.mvpPlayerId);
                            counts.set(v.mvpPlayerId, { name: v.mvpPlayerName, count: (prev?.count ?? 0) + 1 });
                          });
                          return [...counts.entries()].sort((a, b) => b[1].count - a[1].count).map(([id, { name, count }], idx) => (
                            <div key={id} className="flex justify-between text-xs">
                              <span className={`font-semibold ${idx === 0 ? 'text-amber-600' : 'text-stone-500'}`}>{name}</span>
                              <span className={`font-bold ${idx === 0 ? 'text-amber-500' : 'text-stone-400'}`}>{count}표</span>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                    {myVoterId && !myVote && (
                      <div className="grid grid-cols-3 gap-1.5">
                        {participants.filter(p => p.id !== myVoterId).map((p) => (
                          <button key={p.id} onClick={() => voteForMvp(m.id, myVoterId, p.id, p.name)}
                            className="text-xs py-2.5 bg-stone-100 hover:bg-amber-50 hover:text-amber-700 rounded-xl text-gray-600 font-semibold transition">
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {myVote && (
                      <div className="flex items-center justify-center gap-1.5 py-1.5">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-xs text-green-600 font-bold">{myVote.mvpPlayerName}에게 투표 완료</p>
                      </div>
                    )}
                    {!myVoterId && (
                      <p className="text-xs text-stone-400 text-center">위에서 내 선수를 먼저 선택하세요</p>
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
