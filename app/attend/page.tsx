'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSoccerStore } from '../store/useSupabaseStore';
import { VoteStatus, MatchEvent } from '../types';
import { TierBadge } from '../components/TierBadge';
import { balanceTeams } from '../utils/teamBalancer';
import { Team } from '../types';

const STATUS_CONFIG: { status: VoteStatus; label: string; base: string; active: string }[] = [
  { status: 'attending', label: '참석', base: 'text-gray-500 bg-stone-100', active: 'text-green-700 bg-green-100 font-bold' },
  { status: 'maybe',    label: '미정',  base: 'text-gray-500 bg-stone-100', active: 'text-yellow-700 bg-yellow-100 font-bold' },
  { status: 'absent',   label: '불참', base: 'text-gray-500 bg-stone-100', active: 'text-red-600 bg-red-100 font-bold' },
];

function QuarterBadge({ quarters, total }: { quarters?: number[]; total: number }) {
  if (!quarters || quarters.length === total || quarters.length === 0) {
    return <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-md">전쿼터</span>;
  }
  return (
    <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-md">
      {quarters.map(q => `${q}Q`).join('·')}
    </span>
  );
}

function QuarterGrid({ totalQuarters, selected, onChange }: {
  totalQuarters: number; selected: number[]; onChange: (q: number[]) => void;
}) {
  function toggle(q: number) {
    const next = selected.includes(q) ? selected.filter(x => x !== q) : [...selected, q].sort((a, b) => a - b);
    onChange(next.length === totalQuarters ? [] : next);
  }
  const all = Array.from({ length: totalQuarters }, (_, i) => i + 1);
  const isAll = selected.length === 0 || selected.length === totalQuarters;
  return (
    <div className="mt-2.5 bg-stone-50 rounded-xl p-3 space-y-2">
      <p className="text-[11px] text-gray-400 font-medium">참석 쿼터 선택</p>
      <div className="flex gap-1.5 flex-wrap">
        <button type="button" onClick={() => onChange([])}
          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${isAll ? 'bg-green-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
          전쿼터
        </button>
        {all.map(q => (
          <button key={q} type="button" onClick={() => toggle(q)}
            className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${!isAll && selected.includes(q) ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
            {q}Q
          </button>
        ))}
      </div>
    </div>
  );
}

function QuarterSummary({ event, playerCount }: { event: MatchEvent; playerCount: number }) {
  const all = Array.from({ length: event.totalQuarters }, (_, i) => i + 1);
  const attending = event.votes.filter(v => v.status === 'attending');
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${event.totalQuarters}, 1fr)` }}>
      {all.map(q => {
        const count = attending.filter(v => !v.quarters || v.quarters.length === 0 || v.quarters.includes(q)).length;
        const pct = playerCount > 0 ? Math.round((count / playerCount) * 100) : 0;
        return (
          <div key={q} className="text-center bg-stone-50 rounded-xl py-2.5">
            <div className="text-base font-black text-gray-900">{count}</div>
            <div className="text-[10px] text-gray-400 font-medium">{q}Q</div>
            <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden mx-2">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InlineTeamResult({ teams }: { teams: [Team, Team] }) {
  const diff = Math.abs(teams[0].totalScore - teams[1].totalScore);
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500">팀 구성 결과</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${diff <= 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          점수 차 {diff}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {teams.map((team, i) => (
          <div key={team.id} className={`rounded-xl p-3 ${i === 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-black ${i === 0 ? 'text-blue-700' : 'text-red-700'}`}>{team.name}</span>
              <span className="text-[10px] text-gray-400 font-semibold">{team.totalScore}pt</span>
            </div>
            {[...team.players].sort((a, b) => b.score - a.score).map((p) => (
              <div key={p.id} className="flex justify-between items-center text-xs py-0.5">
                <span className="text-gray-700">{p.name}</span>
                <span className="text-gray-400 font-medium">{p.status === 'measuring' ? '—' : p.score}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AttendPage() {
  const { players, events, role, addEvent, removeEvent, vote, closeEvent } = useSoccerStore();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [totalQuarters, setTotalQuarters] = useState(4);
  const [repeatMode, setRepeatMode] = useState<'none' | 'weekly' | 'biweekly' | 'monthly'>('none');
  const [repeatCount, setRepeatCount] = useState(4);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [teamResults, setTeamResults] = useState<Record<string, [Team, Team]>>({});
  const [teamAName, setTeamAName] = useState('A팀');
  const [teamBName, setTeamBName] = useState('B팀');
  const [quarterSelections, setQuarterSelections] = useState<Record<string, number[]>>({});

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    if (repeatMode === 'none') {
      await addEvent(title.trim(), date, location.trim() || undefined, totalQuarters);
    } else {
      const base = new Date(date);
      const promises = Array.from({ length: repeatCount }, (_, i) => {
        const d = new Date(base);
        if (repeatMode === 'weekly')   d.setDate(d.getDate() + i * 7);
        if (repeatMode === 'biweekly') d.setDate(d.getDate() + i * 14);
        if (repeatMode === 'monthly')  d.setMonth(d.getMonth() + i);
        const suffix = repeatCount > 1 ? ` (${i + 1}/${repeatCount})` : '';
        return addEvent(title.trim() + suffix, d.toISOString().slice(0, 16), location.trim() || undefined, totalQuarters);
      });
      await Promise.all(promises);
    }
    setTitle(''); setDate(''); setLocation(''); setTotalQuarters(4);
    setRepeatMode('none'); setRepeatCount(4);
    setShowCreate(false);
  }

  function handleVote(eventId: string, playerId: string, playerName: string, status: VoteStatus) {
    const quarters = quarterSelections[`${eventId}:${playerId}`];
    vote(eventId, playerId, playerName, status, quarters && quarters.length > 0 ? quarters : undefined);
  }

  function handleBalance(event: MatchEvent) {
    const attendingIds = event.votes.filter((v) => v.status === 'attending').map((v) => v.playerId);
    const attendingPlayers = players.filter((p) => attendingIds.includes(p.id));
    if (attendingPlayers.length < 2) return;
    setTeamResults((prev) => ({ ...prev, [event.id]: balanceTeams(attendingPlayers, teamAName, teamBName) }));
  }

  const openEvents   = events.filter((e) => e.isOpen);
  const closedEvents = events.filter((e) => !e.isOpen);

  const INPUT = "w-full bg-stone-50 border-0 rounded-xl px-3.5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:text-gray-400";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-gray-900">출석 투표</h1>
          <p className="text-gray-400 text-sm mt-0.5">경기 전 참석 여부를 확인하세요</p>
        </div>
        {role === 'admin' && (
          <button onClick={() => setShowCreate(!showCreate)}
            className={`font-bold px-4 py-2 rounded-xl transition text-sm ${showCreate ? 'bg-stone-100 text-gray-600' : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'}`}>
            {showCreate ? '취소' : '+ 일정'}
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3.5">
          <p className="text-base font-black text-gray-900">새 경기 일정</p>
          <input className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 (예: 5월 정기전)" required />
          <input type="datetime-local" step="600" className={INPUT} value={date}
            onChange={(e) => {
              const d = new Date(e.target.value);
              if (!isNaN(d.getTime())) { d.setMinutes(Math.round(d.getMinutes() / 10) * 10, 0, 0); setDate(d.toISOString().slice(0, 16)); }
              else setDate(e.target.value);
            }} required />
          <input className={INPUT} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="장소 (선택)" />

          <div>
            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">쿼터 수</p>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map(n => (
                <button key={n} type="button" onClick={() => setTotalQuarters(n)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${totalQuarters === n ? 'bg-gray-900 text-white' : 'bg-stone-100 text-gray-500'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">반복</p>
            <div className="flex gap-1.5 mb-2.5">
              {([['none', '없음'], ['weekly', '매주'], ['biweekly', '격주'], ['monthly', '매월']] as const).map(([v, label]) => (
                <button key={v} type="button" onClick={() => setRepeatMode(v)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${repeatMode === v ? 'bg-gray-900 text-white' : 'bg-stone-100 text-gray-500'}`}>
                  {label}
                </button>
              ))}
            </div>
            {repeatMode !== 'none' && (
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-gray-400 shrink-0">횟수</span>
                <div className="flex gap-1.5">
                  {[2, 3, 4, 6, 8, 12].map(n => (
                    <button key={n} type="button" onClick={() => setRepeatCount(n)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition ${repeatCount === n ? 'bg-gray-900 text-white' : 'bg-stone-100 text-gray-500'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleCreate}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition">
            {repeatMode !== 'none' ? `${repeatCount}개 일정 등록` : '등록'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {openEvents.length === 0 && !showCreate && (
        <div className="bg-white rounded-2xl shadow-sm text-center py-20">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-500 font-medium">예정된 경기 일정이 없습니다</p>
          {role !== 'admin' && <p className="text-gray-400 text-sm mt-1">운영진이 일정을 등록하면 표시됩니다</p>}
        </div>
      )}

      {/* Event list */}
      <div className="space-y-3">
        {openEvents.map((event) => {
          const attending = event.votes.filter((v) => v.status === 'attending');
          const maybe     = event.votes.filter((v) => v.status === 'maybe');
          const absent    = event.votes.filter((v) => v.status === 'absent');
          const isExpanded = expandedId === event.id;
          const eventDate  = new Date(event.date);
          const voteMap    = new Map(event.votes.map((v) => [v.playerId, v]));
          const unvoted    = players.filter((p) => !voteMap.has(p.id));

          const dayNum = eventDate.getDate();
          const dayName = eventDate.toLocaleDateString('ko-KR', { weekday: 'short' });
          const monthName = eventDate.toLocaleDateString('ko-KR', { month: 'short' });

          return (
            <div key={event.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="p-4">
                <div className="flex gap-3.5 items-start">
                  {/* Date column */}
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex flex-col items-center justify-center shadow-sm">
                      <span className="text-white text-lg font-black leading-none">{dayNum}</span>
                      <span className="text-green-200 text-[9px] font-bold leading-none mt-0.5">{monthName} {dayName}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-gray-900 leading-tight">{event.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {eventDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          {event.location && <span> · {event.location}</span>}
                          <span className="ml-1.5 bg-stone-100 text-gray-500 font-bold px-1.5 py-0.5 rounded-md text-[10px]">{event.totalQuarters}Q</span>
                        </p>
                      </div>
                      {role === 'admin' && (
                        <button onClick={() => removeEvent(event.id)} className="text-gray-200 hover:text-red-400 transition p-0.5 shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>

                    {/* Vote chips */}
                    <div className="flex gap-1.5 mt-2.5">
                      <span className="bg-green-100 text-green-700 font-bold text-xs px-2.5 py-1 rounded-lg">✅ {attending.length}</span>
                      <span className="bg-yellow-100 text-yellow-700 font-bold text-xs px-2.5 py-1 rounded-lg">🤔 {maybe.length}</span>
                      <span className="bg-red-100 text-red-600 font-bold text-xs px-2.5 py-1 rounded-lg">❌ {absent.length}</span>
                      {unvoted.length > 0 && (
                        <span className="bg-stone-100 text-gray-400 font-bold text-xs px-2.5 py-1 rounded-lg">미투표 {unvoted.length}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quarter summary */}
                {attending.length > 0 && (
                  <div className="mt-3.5">
                    <QuarterSummary event={event} playerCount={players.length} />
                  </div>
                )}
              </div>

              {/* Expand toggle */}
              <button onClick={() => setExpandedId(isExpanded ? null : event.id)}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-3 border-t border-stone-50 transition bg-stone-50/50 font-medium">
                {isExpanded ? '▲ 접기' : '▼ 투표하기 · 명단 보기'}
              </button>

              {/* Expanded voter list */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 space-y-0.5">
                  {players.length === 0 ? (
                    <p className="text-xs text-gray-400 py-3 text-center">팀 탭에서 선수를 먼저 등록해주세요</p>
                  ) : (
                    [...players].sort((a, b) => a.name.localeCompare(b.name)).map((p) => {
                      const myVote = voteMap.get(p.id);
                      const selKey = `${event.id}:${p.id}`;
                      const selQuarters = quarterSelections[selKey] ?? [];
                      return (
                        <div key={p.id} className="py-2.5 border-b border-stone-50 last:border-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-bold text-gray-900 truncate">{p.name}</span>
                              <TierBadge tier={p.tier} status={p.status} />
                              {myVote?.status === 'attending' && (
                                <QuarterBadge quarters={myVote.quarters} total={event.totalQuarters} />
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {STATUS_CONFIG.map(({ status, label, base, active }) => (
                                <button key={status}
                                  onClick={() => handleVote(event.id, p.id, p.name, status)}
                                  className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition ${myVote?.status === status ? active : base}`}>
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                          {myVote?.status === 'attending' && (
                            <QuarterGrid
                              totalQuarters={event.totalQuarters}
                              selected={selQuarters}
                              onChange={(q) => {
                                setQuarterSelections(prev => ({ ...prev, [selKey]: q }));
                                vote(event.id, p.id, p.name, 'attending', q.length > 0 ? q : undefined);
                              }}
                            />
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* 팀 나누기 */}
                  {attending.length >= 2 && (
                    <div className="pt-3 border-t border-stone-100 space-y-3 mt-1">
                      <div className="flex gap-2">
                        <input className="flex-1 bg-stone-50 border-0 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-400"
                          value={teamAName} onChange={(e) => setTeamAName(e.target.value)} />
                        <span className="self-center text-gray-300 text-xs font-bold">vs</span>
                        <input className="flex-1 bg-stone-50 border-0 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-400"
                          value={teamBName} onChange={(e) => setTeamBName(e.target.value)} />
                      </div>
                      <button onClick={() => handleBalance(event)}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold py-2.5 rounded-xl transition">
                        ⚡ 참석자 {attending.length}명 팀 나누기
                      </button>
                      {teamResults[event.id] && <InlineTeamResult teams={teamResults[event.id]} />}
                    </div>
                  )}

                  {role === 'admin' && (
                    <div className="flex gap-2 mt-3 pt-1">
                      <Link href={`/lineup/${event.id}`}
                        className="flex-1 text-xs text-green-700 font-bold hover:bg-green-50 py-2.5 bg-green-50 rounded-xl transition text-center">
                        🗒️ 라인업 설정
                      </Link>
                      <button onClick={() => closeEvent(event.id)}
                        className="flex-1 text-xs text-gray-400 hover:text-gray-600 py-2.5 bg-stone-50 rounded-xl transition font-medium">
                        투표 마감
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Closed events */}
      {closedEvents.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">마감된 일정</p>
          <div className="space-y-2">
            {closedEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl shadow-sm px-4 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-gray-400">{new Date(event.date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-gray-500">{event.title}</span>
                  <p className="text-xs text-gray-400">{new Date(event.date).toLocaleDateString('ko-KR')}</p>
                </div>
                <div className="flex items-center gap-2 text-xs shrink-0">
                  <span className="text-green-600 font-bold">✅ {event.votes.filter(v => v.status === 'attending').length}</span>
                  {role === 'admin' && (
                    <button onClick={() => removeEvent(event.id)} className="text-gray-200 hover:text-red-400 ml-1 transition">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
