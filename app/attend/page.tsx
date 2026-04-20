'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSoccerStore } from '../store/useSoccerStore';
import { VoteStatus, MatchEvent, Player } from '../types';
import { TierBadge } from '../components/TierBadge';
import { balanceTeams } from '../utils/teamBalancer';
import { Team } from '../types';

const VOTES: { status: VoteStatus; label: string; color: string; active: string }[] = [
  { status: 'attending', label: '참석', color: 'text-gray-500 bg-gray-50 border-gray-200', active: 'text-green-700 bg-green-50 border-green-400 font-bold' },
  { status: 'maybe',    label: '미정',  color: 'text-gray-500 bg-gray-50 border-gray-200', active: 'text-yellow-700 bg-yellow-50 border-yellow-400 font-bold' },
  { status: 'absent',   label: '불참', color: 'text-gray-500 bg-gray-50 border-gray-200', active: 'text-red-600 bg-red-50 border-red-400 font-bold' },
];

function InlineTeamResult({ teams }: { teams: [Team, Team] }) {
  const diff = Math.abs(teams[0].totalScore - teams[1].totalScore);
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500">팀 구성 결과</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diff <= 1 ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
          점수 차 {diff}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {teams.map((team, i) => (
          <div key={team.id} className={`rounded-xl p-3 border ${i === 0 ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-bold ${i === 0 ? 'text-blue-700' : 'text-red-700'}`}>{team.name}</span>
              <span className="text-xs text-gray-500">{team.totalScore}점</span>
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [teamResults, setTeamResults] = useState<Record<string, [Team, Team]>>({});
  const [teamAName, setTeamAName] = useState('A팀');
  const [teamBName, setTeamBName] = useState('B팀');

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    addEvent(title.trim(), date, location.trim() || undefined);
    setTitle(''); setDate(''); setLocation('');
    setShowCreate(false);
  }

  function handleBalance(event: MatchEvent) {
    const attendingIds = event.votes.filter((v) => v.status === 'attending').map((v) => v.playerId);
    const attendingPlayers = players.filter((p) => attendingIds.includes(p.id));
    if (attendingPlayers.length < 2) return;
    const result = balanceTeams(attendingPlayers, teamAName, teamBName);
    setTeamResults((prev) => ({ ...prev, [event.id]: result }));
  }

  const openEvents   = events.filter((e) => e.isOpen);
  const closedEvents = events.filter((e) => !e.isOpen);

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">출석 투표</h1>
          <p className="text-gray-500 text-sm mt-0.5">경기 전 참석 여부를 확인하세요</p>
        </div>
        {role === 'admin' && (
          <button onClick={() => setShowCreate(!showCreate)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-2 rounded-xl transition text-sm">
            {showCreate ? '취소' : '+ 일정'}
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">새 경기 일정</p>
          <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900"
            value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 (예: 5월 3일 정기전)" required />
          <input type="datetime-local" step="600"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900"
            value={date} onChange={(e) => setDate(e.target.value)} required />
          <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900"
            value={location} onChange={(e) => setLocation(e.target.value)} placeholder="장소 (선택)" />
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl transition text-sm">
            등록
          </button>
        </form>
      )}

      {openEvents.length === 0 && !showCreate && (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">📅</p>
          <p className="text-gray-500 text-sm">예정된 경기 일정이 없습니다</p>
          {role !== 'admin' && <p className="text-gray-400 text-xs mt-1">운영진이 일정을 등록하면 표시됩니다</p>}
        </div>
      )}

      <div className="space-y-4">
        {openEvents.map((event) => {
          const attending = event.votes.filter((v) => v.status === 'attending');
          const isExpanded = expandedId === event.id;
          const eventDate = new Date(event.date);
          const voteMap = new Map(event.votes.map((v) => [v.playerId, v.status]));
          const unvoted = players.filter((p) => !voteMap.has(p.id));

          return (
            <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{event.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {eventDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}{' '}
                      {eventDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      {event.location && <span> · {event.location}</span>}
                    </p>
                  </div>
                  {role === 'admin' && (
                    <button onClick={() => removeEvent(event.id)} className="text-gray-300 hover:text-red-400 transition p-1">✕</button>
                  )}
                </div>

                {/* Vote summary chips */}
                <div className="flex gap-2 text-xs">
                  <span className="bg-green-50 text-green-700 font-semibold px-2.5 py-1 rounded-full">✅ {attending.length}</span>
                  <span className="bg-yellow-50 text-yellow-700 font-semibold px-2.5 py-1 rounded-full">🤔 {event.votes.filter(v=>v.status==='maybe').length}</span>
                  <span className="bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-full">❌ {event.votes.filter(v=>v.status==='absent').length}</span>
                  <span className="bg-gray-50 text-gray-500 font-semibold px-2.5 py-1 rounded-full">미투표 {unvoted.length}</span>
                </div>
              </div>

              {/* Expand toggle */}
              <button onClick={() => setExpandedId(isExpanded ? null : event.id)}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-2.5 border-t border-gray-50 transition bg-gray-50/50">
                {isExpanded ? '▲ 접기' : '▼ 투표하기 / 명단 보기'}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-3 space-y-2">
                  {/* All players vote list */}
                  {players.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">팀 탭에서 선수를 먼저 등록해주세요</p>
                  ) : (
                    [...players].sort((a, b) => a.name.localeCompare(b.name)).map((p) => {
                      const myVote = voteMap.get(p.id);
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate">{p.name}</span>
                            <TierBadge tier={p.tier} status={p.status} />
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {VOTES.map(({ status, label, color, active }) => (
                              <button key={status}
                                onClick={() => vote(event.id, p.id, p.name, status)}
                                className={`text-xs px-2.5 py-1 rounded-lg border transition ${myVote === status ? active : color}`}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Team balance */}
                  {attending.length >= 2 && (
                    <div className="pt-3 border-t border-gray-100 space-y-3">
                      <div className="flex gap-2">
                        <input className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-400"
                          value={teamAName} onChange={(e) => setTeamAName(e.target.value)} />
                        <span className="self-center text-gray-300 text-xs">vs</span>
                        <input className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-400"
                          value={teamBName} onChange={(e) => setTeamBName(e.target.value)} />
                      </div>
                      <button onClick={() => handleBalance(event)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition">
                        ⚡ 참석자 {attending.length}명 팀 나누기
                      </button>
                      {teamResults[event.id] && <InlineTeamResult teams={teamResults[event.id]} />}
                    </div>
                  )}

                  {role === 'admin' && (
                    <div className="flex gap-2 mt-1">
                      <Link href={`/lineup/${event.id}`}
                        className="flex-1 text-xs text-green-600 font-semibold hover:bg-green-50 py-2 border border-green-200 rounded-xl transition text-center">
                        🗒️ 라인업 설정
                      </Link>
                      <button onClick={() => closeEvent(event.id)}
                        className="flex-1 text-xs text-gray-400 hover:text-gray-600 py-2 border border-gray-100 rounded-xl transition">
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

      {closedEvents.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">마감된 일정</p>
          <div className="space-y-2">
            {closedEvents.map((event) => (
              <div key={event.id} className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-gray-600">{event.title}</span>
                  <p className="text-xs text-gray-400">{new Date(event.date).toLocaleDateString('ko-KR')}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-600 font-semibold">✅ {event.votes.filter(v=>v.status==='attending').length}</span>
                  {role === 'admin' && (
                    <button onClick={() => removeEvent(event.id)} className="text-gray-300 hover:text-red-400 ml-1">✕</button>
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
