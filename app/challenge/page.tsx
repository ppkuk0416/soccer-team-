'use client';
import { useState, useEffect, useRef } from 'react';
import { useSoccerStore } from '../store/useSupabaseStore';
import { TeamSearchResult } from '../types';

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-500 border-red-200',
};
const STATUS_LABEL: Record<string, string> = {
  pending: '대기중', accepted: '수락됨', rejected: '거절됨',
};

export default function ChallengePage() {
  const { teamId, teamName, challenges, sendChallenge, respondChallenge, searchTeams } = useSoccerStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TeamSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<TeamSearchResult | null>(null);
  const [proposedDate, setProposedDate] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) { setResults([]); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true);
      const data = await searchTeams(query.trim());
      setResults(data.filter((t) => t.id !== teamId));
      setSearching(false);
    }, 400);
  }, [query, teamId, searchTeams]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSending(true);
    await sendChallenge(selected.id, selected.name, proposedDate || undefined, location || undefined, message || undefined);
    setSending(false);
    setSent(true);
    setSelected(null);
    setQuery('');
    setResults([]);
    setProposedDate('');
    setLocation('');
    setMessage('');
    setTimeout(() => setSent(false), 3000);
  }

  const incoming = challenges.filter((c) => c.targetTeamId === teamId && c.status === 'pending');
  const outgoing = challenges.filter((c) => c.requesterTeamId === teamId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">팀 매칭</h1>
        <p className="text-gray-500 text-sm mt-0.5">다른 팀을 찾아 경기를 신청하세요</p>
      </div>

      {/* 팀 검색 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">팀 검색</p>
        <input
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          placeholder="팀 이름으로 검색..."
        />

        {searching && <p className="text-xs text-gray-400 text-center py-2">검색 중...</p>}

        {!searching && results.length > 0 && !selected && (
          <div className="space-y-1.5">
            {results.map((team) => (
              <button key={team.id} onClick={() => { setSelected(team); setResults([]); }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 hover:border-green-300 hover:bg-green-50 transition text-left">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{team.name}</p>
                  <p className="text-xs text-gray-400">가입 {new Date(team.createdAt).toLocaleDateString('ko-KR')}</p>
                </div>
                <span className="text-xs text-green-600 font-semibold">선택 →</span>
              </button>
            ))}
          </div>
        )}

        {!searching && query.trim().length >= 2 && results.length === 0 && !selected && (
          <p className="text-xs text-gray-400 text-center py-2">검색 결과가 없습니다</p>
        )}
      </div>

      {/* 경기 신청 폼 */}
      {selected && (
        <form onSubmit={handleSend} className="bg-white rounded-2xl border border-green-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              <span className="text-green-600">{selected.name}</span>에 경기 신청
            </p>
            <button type="button" onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-500 text-xs">취소</button>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
            <span className="font-semibold">{teamName}</span> vs <span className="font-semibold">{selected.name}</span>
          </div>

          <input type="datetime-local"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
            value={proposedDate}
            onChange={(e) => {
              const d = new Date(e.target.value);
              if (!isNaN(d.getTime())) {
                d.setMinutes(Math.round(d.getMinutes() / 10) * 10, 0, 0);
                setProposedDate(d.toISOString().slice(0, 16));
              } else setProposedDate(e.target.value);
            }}
            placeholder="희망 날짜·시간 (선택)"
          />
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
            value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="희망 장소 (선택)"
          />
          <textarea rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="메시지 (선택) — 예: 친선 경기 제안합니다!"
          />
          <button type="submit" disabled={sending}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-2.5 rounded-xl text-sm transition">
            {sending ? '전송 중...' : '⚡ 경기 신청'}
          </button>
        </form>
      )}

      {sent && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-semibold text-center">
          경기 신청을 보냈습니다! 상대 팀의 수락을 기다리세요.
        </div>
      )}

      {/* 들어온 신청 */}
      {incoming.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">받은 경기 신청 ({incoming.length})</p>
          <div className="space-y-3">
            {incoming.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-orange-200 shadow-sm p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{c.requesterTeamName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">신청 {new Date(c.createdAt).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-200 font-semibold px-2 py-0.5 rounded-full">신청 받음</span>
                </div>
                {c.proposedDate && (
                  <p className="text-xs text-gray-500 mb-1">📅 {new Date(c.proposedDate).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                )}
                {c.location && <p className="text-xs text-gray-500 mb-1">📍 {c.location}</p>}
                {c.message && <p className="text-xs text-gray-600 italic mb-2">"{c.message}"</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => respondChallenge(c.id, 'accepted')}
                    className="flex-1 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl transition">
                    ✅ 수락
                  </button>
                  <button onClick={() => respondChallenge(c.id, 'rejected')}
                    className="flex-1 text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 py-2 rounded-xl transition">
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 보낸 신청 */}
      {outgoing.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">보낸 신청</p>
          <div className="space-y-2">
            {outgoing.map((c) => (
              <div key={c.id} className={`bg-white rounded-2xl border shadow-sm px-4 py-3 ${STATUS_STYLE[c.status]}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{c.targetTeamName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.proposedDate && new Date(c.proposedDate).toLocaleDateString('ko-KR') + ' · '}
                      {new Date(c.createdAt).toLocaleDateString('ko-KR')} 신청
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
                {c.message && <p className="text-xs text-gray-400 italic mt-1">"{c.message}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {incoming.length === 0 && outgoing.length === 0 && !selected && (
        <div className="text-center py-8">
          <p className="text-3xl mb-3">🤝</p>
          <p className="text-gray-500 text-sm">아직 경기 신청 내역이 없습니다</p>
          <p className="text-gray-400 text-xs mt-1">팀 이름으로 검색해서 경기를 신청해보세요</p>
        </div>
      )}
    </div>
  );
}
