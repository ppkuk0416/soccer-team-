'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSoccerStore } from '../store/useSoccerStore';
import { VoteStatus, MatchEvent } from '../types';

const VOTE_OPTIONS: { status: VoteStatus; label: string; emoji: string; color: string; bg: string }[] = [
  { status: 'attending', label: '참석', emoji: '✅', color: 'text-green-600', bg: 'bg-green-50 border-green-300' },
  { status: 'maybe',    label: '미정',  emoji: '🤔', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-300' },
  { status: 'absent',   label: '불참', emoji: '❌', color: 'text-red-500',   bg: 'bg-red-50 border-red-300' },
];

function VoteSummary({ event }: { event: MatchEvent }) {
  const attending = event.votes.filter((v) => v.status === 'attending');
  const maybe     = event.votes.filter((v) => v.status === 'maybe');
  const absent    = event.votes.filter((v) => v.status === 'absent');
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-green-600 font-bold">✅ {attending.length}명</span>
      <span className="text-yellow-500 font-bold">🤔 {maybe.length}명</span>
      <span className="text-red-400 font-bold">❌ {absent.length}명</span>
    </div>
  );
}

export default function AttendPage() {
  const router = useRouter();
  const { players, events, role, addEvent, removeEvent, vote, closeEvent } = useSoccerStore();

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 팀원 선택 — 현재 사용 중인 기기의 선수 (심플하게: 드롭다운으로 본인 선택)
  const [myPlayerId, setMyPlayerId] = useState<string>('');

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    addEvent(title.trim(), date, location.trim() || undefined);
    setTitle(''); setDate(''); setLocation('');
    setShowCreate(false);
  }

  function handleVote(eventId: string, status: VoteStatus) {
    if (!myPlayerId) return;
    const player = players.find((p) => p.id === myPlayerId);
    if (!player) return;
    vote(eventId, player.id, player.name, status);
  }

  function goToMatcher(event: MatchEvent) {
    const attendingIds = event.votes
      .filter((v) => v.status === 'attending')
      .map((v) => v.playerId)
      .join(',');
    router.push(`/matcher?preset=${attendingIds}`);
  }

  const openEvents   = events.filter((e) => e.isOpen);
  const closedEvents = events.filter((e) => !e.isOpen);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">출석 투표</h1>
          <p className="text-gray-500 text-sm mt-1">경기 전 참석 여부를 미리 확인하세요</p>
        </div>
        {role === 'admin' && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-3 py-2 rounded-xl transition shadow text-sm"
          >
            {showCreate ? '취소' : '+ 일정 만들기'}
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 shadow p-4 space-y-3">
          <h2 className="font-bold text-gray-700 text-sm">새 경기 일정</h2>
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목 (예: 5월 3일 정기전)"
            required
          />
          <input
            type="datetime-local"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="장소 (선택)"
          />
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-xl transition text-sm"
          >
            일정 등록
          </button>
        </form>
      )}

      {/* 내 선수 선택 */}
      {players.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <label className="block text-xs font-semibold text-blue-600 mb-1.5">내 선수 선택 (투표용)</label>
          <select
            className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={myPlayerId}
            onChange={(e) => setMyPlayerId(e.target.value)}
          >
            <option value="">선택...</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Open events */}
      {openEvents.length === 0 && !showCreate && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-sm">예정된 경기 일정이 없습니다</p>
          {role !== 'admin' && <p className="text-xs mt-1">운영진이 일정을 등록하면 여기 표시됩니다</p>}
        </div>
      )}

      <div className="space-y-4">
        {openEvents.map((event) => {
          const myVote = event.votes.find((v) => v.playerId === myPlayerId);
          const attending = event.votes.filter((v) => v.status === 'attending');
          const isExpanded = expandedId === event.id;
          const eventDate = new Date(event.date);

          return (
            <div key={event.id} className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
              {/* Event header */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-gray-800">{event.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {eventDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                      {' '}
                      {eventDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      {event.location && ` · ${event.location}`}
                    </p>
                  </div>
                  {role === 'admin' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => removeEvent(event.id)}
                        className="text-gray-300 hover:text-red-400 text-sm transition"
                      >✕</button>
                    </div>
                  )}
                </div>

                <VoteSummary event={event} />

                {/* Vote buttons */}
                {myPlayerId && (
                  <div className="flex gap-2 mt-3">
                    {VOTE_OPTIONS.map(({ status, label, emoji, bg }) => (
                      <button
                        key={status}
                        onClick={() => handleVote(event.id, status)}
                        className={`flex-1 flex flex-col items-center py-2 rounded-xl border-2 transition font-medium text-xs
                          ${myVote?.status === status ? bg + ' scale-105' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
                      >
                        <span className="text-lg">{emoji}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                {!myPlayerId && (
                  <p className="text-xs text-gray-400 mt-3">위에서 내 선수를 선택하면 투표할 수 있습니다</p>
                )}
              </div>

              {/* Attendee list toggle */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : event.id)}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 border-t border-gray-50 transition"
              >
                {isExpanded ? '▲ 접기' : `▼ 참석자 보기 (${event.votes.length}명 응답)`}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-1">
                  {VOTE_OPTIONS.map(({ status, label, emoji }) => {
                    const group = event.votes.filter((v) => v.status === status);
                    if (group.length === 0) return null;
                    return (
                      <div key={status}>
                        <p className="text-xs text-gray-400 mt-2 mb-1">{emoji} {label} ({group.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {group.map((v) => (
                            <span key={v.playerId} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {v.playerName}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* 참석자로 팀 매칭 */}
                  {attending.length >= 2 && role === 'admin' && (
                    <div className="pt-3 border-t border-gray-100 space-y-2">
                      <button
                        onClick={() => goToMatcher(event)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 rounded-xl transition"
                      >
                        ⚡ 참석자 {attending.length}명으로 팀 매칭
                      </button>
                      <button
                        onClick={() => closeEvent(event.id)}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm py-2 rounded-xl transition"
                      >
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
          <p className="text-xs text-gray-400 font-medium mb-2">마감된 일정</p>
          <div className="space-y-2">
            {closedEvents.map((event) => (
              <div key={event.id} className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center opacity-60">
                <div>
                  <span className="text-sm font-medium text-gray-600">{event.title}</span>
                  <p className="text-xs text-gray-400">
                    {new Date(event.date).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <VoteSummary event={event} />
                  {role === 'admin' && (
                    <button onClick={() => removeEvent(event.id)} className="text-gray-300 hover:text-red-400 text-sm ml-1">✕</button>
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
