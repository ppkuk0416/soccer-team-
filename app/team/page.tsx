'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSoccerStore } from '../store/useSupabaseStore';
import { PlayerForm } from '../components/PlayerForm';
import { Modal } from '../components/Modal';
import { TierBadge } from '../components/TierBadge';

function StrengthBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}

export default function TeamPage() {
  const { team, setTeam, players, role, events, matchRecords } = useSoccerStore();
  const [editingTeam, setEditingTeam] = useState(!team);
  const [teamName, setTeamName] = useState(team?.name ?? '');
  const [teamDesc, setTeamDesc] = useState(team?.description ?? '');
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const confirmed = players.filter((p) => p.status === 'confirmed');
  const measuring = players.filter((p) => p.status === 'measuring');
  const avgScore = confirmed.length
    ? +(confirmed.reduce((s, p) => s + p.score, 0) / confirmed.length).toFixed(1) : 0;

  const wins   = matchRecords.filter((m) => m.scoreA > m.scoreB).length;
  const draws  = matchRecords.filter((m) => m.scoreA === m.scoreB).length;
  const losses = matchRecords.filter((m) => m.scoreA < m.scoreB).length;

  // Tier group distribution
  const tierGroups = [
    { label: '비기너',  count: players.filter(p => p.tier.startsWith('beginner')).length,  color: 'bg-sky-400' },
    { label: '아마추어', count: players.filter(p => p.tier.startsWith('amateur')).length,   color: 'bg-indigo-400' },
    { label: '세미프로', count: players.filter(p => p.tier.startsWith('semi-pro')).length,  color: 'bg-purple-400' },
    { label: '프로',    count: players.filter(p => p.tier === 'pro').length,                color: 'bg-amber-400' },
  ];

  const attendMap = new Map<string, number>();
  events.forEach((e) => e.votes.filter(v => v.status === 'attending').forEach(v => {
    attendMap.set(v.playerId, (attendMap.get(v.playerId) ?? 0) + 1);
  }));
  const topAttender = [...players].sort((a, b) => (attendMap.get(b.id) ?? 0) - (attendMap.get(a.id) ?? 0))[0];

  function handleSaveTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setTeam(teamName.trim(), teamDesc.trim() || undefined);
    setEditingTeam(false);
  }

  return (
    <div className="space-y-5">
      {/* Team card or form */}
      {editingTeam || !team ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">{team ? '팀 정보 수정' : '팀 만들기'}</h2>
          <form onSubmit={handleSaveTeam} className="space-y-3">
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="팀 이름 (예: 화요일 FC)" required />
            <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none h-20"
              value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)} placeholder="팀 소개 (예: 매주 화요일 저녁 7시)" />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition text-sm">저장</button>
              {team && <button type="button" onClick={() => setEditingTeam(false)} className="px-4 bg-gray-100 text-gray-600 rounded-xl text-sm">취소</button>}
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Club profile hero */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-green-200 mb-0.5">클럽</p>
                <h1 className="text-2xl font-black">{team.name}</h1>
                {team.description && <p className="text-sm text-green-100 mt-0.5">{team.description}</p>}
              </div>
              {role === 'admin' && (
                <button onClick={() => { setTeamName(team.name); setTeamDesc(team.description ?? ''); setEditingTeam(true); }}
                  className="text-green-200 hover:text-white transition text-xs border border-green-400 rounded-lg px-2 py-1">수정</button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-green-500/40">
              {[
                { label: '선수', value: players.length },
                { label: '경기', value: matchRecords.length },
                { label: '평균실력', value: avgScore || '—' },
                { label: '승/무/패', value: `${wins}/${draws}/${losses}` },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-lg font-black">{value}</div>
                  <div className="text-[10px] text-green-200 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Strength analysis */}
          {players.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
              <h2 className="font-bold text-gray-900 text-sm">⚡ 클럽 전력 분석</h2>
              <div className="space-y-2.5">
                {tierGroups.map(({ label, count, color }) => {
                  const pct = players.length ? Math.round((count / players.length) * 100) : 0;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-14">{label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 w-8 text-right">{count}명</span>
                    </div>
                  );
                })}
                {measuring.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-14">루키</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-gray-300 rounded-full" style={{ width: `${Math.round((measuring.length / players.length) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 w-8 text-right">{measuring.length}명</span>
                  </div>
                )}
              </div>
              {topAttender && (
                <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-400">최다 출석 선수</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{topAttender.name}</span>
                    <TierBadge tier={topAttender.tier} status={topAttender.status} />
                    <span className="text-xs text-green-600 font-semibold">{attendMap.get(topAttender.id) ?? 0}회</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Player list */}
      {team && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-gray-900">선수 명단 <span className="text-gray-400 font-normal text-sm">({players.length}명)</span></h2>
            {role === 'admin' && (
              <button onClick={() => setShowAddPlayer(true)}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-1.5 rounded-xl transition">
                + 추가
              </button>
            )}
          </div>

          {players.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-3xl mb-3">⚽</p>
              <p className="text-gray-400 text-sm">선수가 없습니다</p>
              {role === 'admin' && (
                <button onClick={() => setShowAddPlayer(true)} className="mt-3 text-green-600 text-sm font-medium">첫 선수 추가하기</button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {[...players].sort((a, b) => b.score - a.score).map((p) => (
                <Link key={p.id} href={`/player/${p.id}`}>
                  <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-center justify-between gap-3 hover:border-green-200 transition cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">{p.name}</span>
                          {p.position && <span className="text-xs text-gray-400">{p.position}</span>}
                        </div>
                        <div className="mt-0.5">
                          <TierBadge tier={p.tier} status={p.status} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-black ${p.status === 'measuring' ? 'text-gray-200' : 'text-gray-700'}`}>
                        {p.status === 'measuring' ? '—' : p.score}
                      </span>
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </Link>
              ))}
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
