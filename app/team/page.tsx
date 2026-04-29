'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSupabaseStore } from '../store/useSupabaseStore';
import { PlayerForm } from '../components/PlayerForm';
import { Modal } from '../components/Modal';
import { TierBadge, tierAvatarColors } from '../components/TierBadge';

export default function TeamPage() {
  const { team, teamInviteCode, setTeam, players, role, events, matchRecords, dues } = useSupabaseStore();
  const [editingTeam, setEditingTeam] = useState(!team);
  const [teamName, setTeamName] = useState(team?.name ?? '');
  const [teamDesc, setTeamDesc] = useState(team?.description ?? '');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Derived stats
  const confirmed = players.filter((p) => p.status === 'confirmed');
  const avgScore = confirmed.length
    ? +(confirmed.reduce((s, p) => s + p.score, 0) / confirmed.length).toFixed(1) : 0;
  const wins   = matchRecords.filter((m) => m.scoreA > m.scoreB).length;
  const draws  = matchRecords.filter((m) => m.scoreA === m.scoreB).length;
  const losses = matchRecords.filter((m) => m.scoreA < m.scoreB).length;

  // Attendance map
  const attendMap = new Map<string, number>();
  events.forEach((e) => e.votes.filter(v => v.status === 'attending').forEach(v => {
    attendMap.set(v.playerId, (attendMap.get(v.playerId) ?? 0) + 1);
  }));

  // Next upcoming open event
  const now = new Date();
  const nextEvent = [...events.filter((e) => e.isOpen)]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .find((e) => new Date(e.date) >= now) ??
    events.filter((e) => e.isOpen)[0] ?? null;

  // Unpaid dues this month
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const unpaidCount = dues.filter((d) => d.month === thisMonth && !d.paid).length;

  function handleSaveTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setTeam(teamName.trim(), teamDesc.trim() || undefined);
    setEditingTeam(false);
  }

  async function copyInviteCode() {
    if (!teamInviteCode) return;
    await navigator.clipboard.writeText(teamInviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  if (editingTeam || !team) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-black text-gray-900 text-xl mb-1">{team ? '팀 정보 수정' : '팀 만들기'}</h2>
          <p className="text-sm text-gray-400 mb-5">팀을 만들면 초대코드가 발급됩니다</p>
          <form onSubmit={handleSaveTeam} className="space-y-3">
            <input
              className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:text-gray-400"
              value={teamName} onChange={(e) => setTeamName(e.target.value)}
              placeholder="팀 이름 (예: 화요일 FC)" required />
            <textarea
              className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none h-20 placeholder:text-gray-400"
              value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)}
              placeholder="팀 소개 (예: 매주 화요일 저녁 7시)" />
            <div className="flex gap-2 pt-1">
              <button type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition text-sm">
                저장
              </button>
              {team && (
                <button type="button" onClick={() => setEditingTeam(false)}
                  className="px-5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold transition hover:bg-gray-200">
                  취소
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Days until next event
  let daysLabel = '';
  let isToday = false;
  if (nextEvent) {
    const eventDate = new Date(nextEvent.date);
    const diffMs = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) { isToday = true; daysLabel = '오늘'; }
    else if (diffDays === 1) daysLabel = '내일';
    else daysLabel = `D-${diffDays}`;
  }
  const nextAttending = nextEvent?.votes.filter(v => v.status === 'attending').length ?? 0;

  return (
    <div className="space-y-3">

      {/* ── Hero Card ──────────────────────────────────── */}
      <div className="bg-[#1C1C1E] rounded-3xl p-5 text-white relative overflow-hidden">
        {/* Subtle field pattern */}
        <div className="absolute right-0 top-0 w-40 h-40 opacity-[0.04]">
          <svg viewBox="0 0 100 100" fill="none" stroke="white" strokeWidth="1">
            <circle cx="50" cy="50" r="30" />
            <line x1="50" y1="0" x2="50" y2="100" />
            <rect x="10" y="30" width="20" height="40" />
            <rect x="70" y="30" width="20" height="40" />
          </svg>
        </div>

        <div className="flex justify-between items-start mb-5 relative">
          <div>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">MY CLUB</p>
            <h1 className="text-2xl font-black leading-tight">{team.name}</h1>
            {team.description && (
              <p className="text-gray-400 text-sm mt-1 leading-relaxed">{team.description}</p>
            )}
          </div>
          {role === 'admin' && (
            <button
              onClick={() => { setTeamName(team.name); setTeamDesc(team.description ?? ''); setEditingTeam(true); }}
              className="shrink-0 text-gray-500 hover:text-white text-xs border border-[#3A3A3C] hover:border-gray-1000 rounded-lg px-2.5 py-1.5 transition ml-3">
              수정
            </button>
          )}
        </div>

        {/* Record row */}
        <div className="flex items-center gap-0 border-t border-[#2C2C2E] pt-4 relative">
          <div className="flex-1 text-center">
            <div className="text-2xl font-black text-green-400">{wins}</div>
            <div className="text-gray-600 text-[10px] font-bold mt-0.5">승</div>
          </div>
          <div className="w-px h-8 bg-[#2C2C2E]" />
          <div className="flex-1 text-center">
            <div className="text-2xl font-black text-gray-400">{draws}</div>
            <div className="text-gray-600 text-[10px] font-bold mt-0.5">무</div>
          </div>
          <div className="w-px h-8 bg-[#2C2C2E]" />
          <div className="flex-1 text-center">
            <div className="text-2xl font-black text-red-400">{losses}</div>
            <div className="text-gray-600 text-[10px] font-bold mt-0.5">패</div>
          </div>
          <div className="w-px h-8 bg-[#2C2C2E]" />
          <div className="flex-1 text-center">
            <div className="text-2xl font-black text-white">{players.length}</div>
            <div className="text-gray-600 text-[10px] font-bold mt-0.5">선수</div>
          </div>
          <div className="w-px h-8 bg-[#2C2C2E]" />
          <div className="flex-1 text-center">
            <div className="text-2xl font-black text-white">{avgScore || '—'}</div>
            <div className="text-gray-600 text-[10px] font-bold mt-0.5">평균</div>
          </div>
        </div>

        {/* Invite code */}
        {teamInviteCode && (
          <button onClick={copyInviteCode}
            className="mt-4 w-full flex items-center justify-between bg-[#2C2C2E] hover:bg-[#3A3A3C] rounded-2xl px-4 py-3 transition relative">
            <div className="text-left">
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">초대 코드</p>
              <p className="text-white font-black text-lg tracking-[0.3em] mt-0.5">{teamInviteCode}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${copiedCode ? 'bg-green-600 text-white' : 'bg-[#3A3A3C] text-gray-400'}`}>
              {copiedCode ? '복사됨' : '복사'}
            </span>
          </button>
        )}
      </div>

      {/* ── Next Match Card ────────────────────────────── */}
      {nextEvent && (
        <Link href="/attend">
          <div className={`rounded-2xl p-4 text-white relative overflow-hidden ${
            isToday ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-green-600 to-green-700'
          }`}>
            {isToday && (
              <div className="absolute top-3 right-3 bg-white/20 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
                경기 당일
              </div>
            )}
            <p className="text-green-200 text-[10px] font-bold uppercase tracking-widest mb-2">
              {isToday ? '⚡ 오늘 경기' : '다음 경기'}
            </p>
            <div className="flex items-end justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black leading-tight truncate">{nextEvent.title}</p>
                <p className="text-green-200 text-sm mt-1">
                  {new Date(nextEvent.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                  {' · '}
                  {new Date(nextEvent.date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {nextEvent.location && (
                  <p className="text-green-200/80 text-xs mt-0.5">{nextEvent.location}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-3xl font-black">{daysLabel}</div>
                <div className="text-green-200 text-xs mt-0.5">참석 {nextAttending}명</div>
              </div>
            </div>
            {/* Attendance bar */}
            {players.length > 0 && (
              <div className="mt-3">
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${Math.min(100, (nextAttending / players.length) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        </Link>
      )}

      {/* ── Quick stat pills ───────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        <Link href="/attend">
          <div className="bg-white rounded-2xl shadow-sm p-3.5 text-center hover:shadow-md transition">
            <div className="text-xl font-black text-gray-900">
              {events.filter(e => e.isOpen).length}
            </div>
            <div className="text-[10px] text-gray-400 font-semibold mt-0.5">열린 일정</div>
          </div>
        </Link>
        <Link href="/dues">
          <div className="bg-white rounded-2xl shadow-sm p-3.5 text-center hover:shadow-md transition">
            <div className={`text-xl font-black ${unpaidCount > 0 ? 'text-red-500' : 'text-gray-900'}`}>
              {unpaidCount}
            </div>
            <div className="text-[10px] text-gray-400 font-semibold mt-0.5">이번달 미납</div>
          </div>
        </Link>
        <Link href="/stats">
          <div className="bg-white rounded-2xl shadow-sm p-3.5 text-center hover:shadow-md transition">
            <div className="text-xl font-black text-gray-900">{matchRecords.length}</div>
            <div className="text-[10px] text-gray-400 font-semibold mt-0.5">총 경기</div>
          </div>
        </Link>
      </div>

      {/* ── Player list ────────────────────────────────── */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-black text-gray-900 text-base">
            선수 명단
            <span className="text-gray-400 font-normal text-sm ml-1.5">({players.length}명)</span>
          </h2>
          <div className="flex gap-2">
            {role === 'admin' && (
              <Link href="/admin"
                className="text-xs text-gray-400 hover:text-gray-700 font-semibold px-3 py-1.5 rounded-lg bg-white shadow-sm hover:shadow transition">
                평가 관리
              </Link>
            )}
            {role === 'admin' && (
              <button onClick={() => setShowAddPlayer(true)}
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition shadow-sm">
                + 추가
              </button>
            )}
          </div>
        </div>

        {players.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-bold">선수가 없습니다</p>
            <p className="text-gray-400 text-sm mt-1">첫 선수를 추가해보세요</p>
            {role === 'admin' && (
              <button onClick={() => setShowAddPlayer(true)}
                className="mt-4 bg-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-green-700 transition">
                + 선수 추가
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {[...players].sort((a, b) => b.score - a.score).map((p, i) => {
              const avatarColor = tierAvatarColors(p.tier, p.status);
              const attendCount = attendMap.get(p.id) ?? 0;
              return (
                <Link key={p.id} href={`/player/${p.id}`}>
                  <div className="bg-white rounded-2xl shadow-sm px-4 py-3.5 flex items-center gap-3 active:scale-[0.99] transition-all cursor-pointer">
                    <span className="text-[11px] font-bold text-gray-300 w-4 text-center shrink-0">{i + 1}</span>
                    <div className={`w-10 h-10 rounded-xl ${avatarColor} flex items-center justify-center text-base font-black shrink-0`}>
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{p.name}</span>
                        {p.position && (
                          <span className="text-[10px] text-gray-400 font-semibold bg-gray-100 px-1.5 py-0.5 rounded-md">
                            {p.position}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <TierBadge tier={p.tier} status={p.status} />
                        {attendCount > 0 && (
                          <span className="text-[10px] text-gray-400">출석 {attendCount}회</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-2xl font-black ${p.status === 'measuring' ? 'text-gray-200' : 'text-gray-800'}`}>
                        {p.status === 'measuring' ? '—' : p.score}
                      </span>
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {showAddPlayer && (
        <Modal title="선수 추가" onClose={() => setShowAddPlayer(false)}>
          <PlayerForm onClose={() => setShowAddPlayer(false)} />
        </Modal>
      )}
    </div>
  );
}
