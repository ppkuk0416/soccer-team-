'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSoccerStore } from '../store/useSupabaseStore';
import { PlayerForm } from '../components/PlayerForm';
import { Modal } from '../components/Modal';
import { TierBadge, tierAvatarColors } from '../components/TierBadge';

const TIER_GROUPS = [
  { key: 'beginner',  label: '비기너',   color: 'bg-sky-400',    light: 'bg-sky-100' },
  { key: 'amateur',   label: '아마추어',  color: 'bg-indigo-400', light: 'bg-indigo-100' },
  { key: 'semi-pro',  label: '세미프로',  color: 'bg-purple-400', light: 'bg-purple-100' },
  { key: 'pro',       label: '프로',      color: 'bg-amber-400',  light: 'bg-amber-100' },
];

export default function TeamPage() {
  const { team, teamInviteCode, setTeam, players, role, events, matchRecords } = useSoccerStore();
  const [editingTeam, setEditingTeam] = useState(!team);
  const [teamName, setTeamName] = useState(team?.name ?? '');
  const [teamDesc, setTeamDesc] = useState(team?.description ?? '');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const confirmed = players.filter((p) => p.status === 'confirmed');
  const avgScore = confirmed.length
    ? +(confirmed.reduce((s, p) => s + p.score, 0) / confirmed.length).toFixed(1) : 0;

  const wins   = matchRecords.filter((m) => m.scoreA > m.scoreB).length;
  const draws  = matchRecords.filter((m) => m.scoreA === m.scoreB).length;
  const losses = matchRecords.filter((m) => m.scoreA < m.scoreB).length;

  const attendMap = new Map<string, number>();
  events.forEach((e) => e.votes.filter(v => v.status === 'attending').forEach(v => {
    attendMap.set(v.playerId, (attendMap.get(v.playerId) ?? 0) + 1);
  }));

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

  return (
    <div className="space-y-4">

      {/* Team create / edit form */}
      {editingTeam || !team ? (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-black text-gray-900 text-lg mb-4">{team ? '팀 정보 수정' : '팀 만들기'}</h2>
          <form onSubmit={handleSaveTeam} className="space-y-3">
            <input
              className="w-full bg-slate-50 border-0 rounded-xl px-3.5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:text-gray-400"
              value={teamName} onChange={(e) => setTeamName(e.target.value)}
              placeholder="팀 이름 (예: 화요일 FC)" required />
            <textarea
              className="w-full bg-slate-50 border-0 rounded-xl px-3.5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none h-20 placeholder:text-gray-400"
              value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)}
              placeholder="팀 소개 (예: 매주 화요일 저녁 7시)" />
            <div className="flex gap-2">
              <button type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition text-sm">
                저장
              </button>
              {team && (
                <button type="button" onClick={() => setEditingTeam(false)}
                  className="px-5 bg-slate-100 text-gray-600 rounded-xl text-sm font-medium">
                  취소
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Hero card */}
          <div className="bg-gradient-to-br from-green-600 via-green-600 to-emerald-700 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-green-300 text-[10px] font-bold uppercase tracking-widest mb-1">클럽</p>
                <h1 className="text-2xl font-black leading-tight">{team.name}</h1>
                {team.description && (
                  <p className="text-green-200 text-sm mt-1">{team.description}</p>
                )}
              </div>
              {role === 'admin' && (
                <button
                  onClick={() => { setTeamName(team.name); setTeamDesc(team.description ?? ''); setEditingTeam(true); }}
                  className="text-green-300 hover:text-white text-xs border border-green-500 hover:border-green-300 rounded-lg px-2.5 py-1.5 transition">
                  수정
                </button>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 py-4 border-t border-white/10">
              {[
                { label: '선수', value: players.length },
                { label: '경기', value: matchRecords.length },
                { label: '평균', value: avgScore || '—' },
                { label: '전적', value: `${wins}-${draws}-${losses}` },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-lg font-black">{value}</div>
                  <div className="text-[10px] text-green-300 mt-0.5 font-medium">{label}</div>
                </div>
              ))}
            </div>

            {/* Invite code */}
            {teamInviteCode && (
              <button onClick={copyInviteCode}
                className="mt-3 w-full flex items-center justify-between bg-white/10 hover:bg-white/20 rounded-xl px-3.5 py-2.5 transition">
                <div className="text-left">
                  <p className="text-[10px] text-green-300 font-medium">초대 코드</p>
                  <p className="text-white font-black text-base tracking-[0.2em]">{teamInviteCode}</p>
                </div>
                <span className="text-green-300 text-xs">
                  {copiedCode ? '✓ 복사됨' : '탭하여 복사'}
                </span>
              </button>
            )}
          </div>

          {/* Tier distribution */}
          {players.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h2 className="font-bold text-gray-900 text-sm mb-3">전력 분포</h2>
              <div className="space-y-2.5">
                {TIER_GROUPS.map(({ key, label, color }) => {
                  const count = players.filter(p => key === 'pro' ? p.tier === 'pro' : p.tier.startsWith(key)).length;
                  const pct = players.length ? Math.round((count / players.length) * 100) : 0;
                  if (count === 0) return null;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-14 shrink-0">{label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-600 w-8 text-right shrink-0">{count}명</span>
                    </div>
                  );
                })}
                {players.filter(p => p.status === 'measuring').length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-14 shrink-0">신입</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-gray-300 rounded-full"
                        style={{ width: `${Math.round((players.filter(p => p.status === 'measuring').length / players.length) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-gray-400 w-8 text-right shrink-0">
                      {players.filter(p => p.status === 'measuring').length}명
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Player list */}
      {team && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-gray-900">
              선수 명단
              <span className="text-gray-400 font-normal text-sm ml-1.5">({players.length}명)</span>
            </h2>
            <div className="flex gap-2">
              {role === 'admin' && (
                <Link href="/admin"
                  className="text-xs text-gray-400 hover:text-gray-600 font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition">
                  평가 관리
                </Link>
              )}
              {role === 'admin' && (
                <button onClick={() => setShowAddPlayer(true)}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                  + 추가
                </button>
              )}
            </div>
          </div>

          {players.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm text-center py-16">
              <p className="text-4xl mb-3">⚽</p>
              <p className="text-gray-400 text-sm font-medium">선수가 없습니다</p>
              {role === 'admin' && (
                <button onClick={() => setShowAddPlayer(true)}
                  className="mt-4 text-green-600 text-sm font-bold border border-green-200 px-4 py-2 rounded-xl hover:bg-green-50 transition">
                  첫 선수 추가하기
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
                    <div className="bg-white rounded-2xl shadow-sm px-4 py-3.5 flex items-center gap-3 hover:shadow-md active:scale-[0.99] transition-all cursor-pointer">
                      {/* Rank + Avatar */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[11px] font-bold text-gray-300 w-4 text-center">{i + 1}</span>
                        <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-base font-black`}>
                          {p.name.charAt(0)}
                        </div>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{p.name}</span>
                          {p.position && (
                            <span className="text-[10px] text-gray-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded-md">
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
                      {/* Score */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-2xl font-black ${p.status === 'measuring' ? 'text-gray-200' : 'text-gray-800'}`}>
                          {p.status === 'measuring' ? '—' : p.score}
                        </span>
                        <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      )}

      {showAddPlayer && (
        <Modal title="선수 추가" onClose={() => setShowAddPlayer(false)}>
          <PlayerForm onClose={() => setShowAddPlayer(false)} />
        </Modal>
      )}
    </div>
  );
}
