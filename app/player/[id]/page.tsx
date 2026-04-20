'use client';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useSoccerStore } from '../../store/useSupabaseStore';
import { TierBadge } from '../../components/TierBadge';
import { PlayerForm } from '../../components/PlayerForm';
import { Modal } from '../../components/Modal';
import { useState } from 'react';
import { TIER_LABELS } from '../../types';

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { players, events, matchRecords, role, removePlayer } = useSoccerStore();
  const [editing, setEditing] = useState(false);

  const player = players.find((p) => p.id === id);
  if (!player) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">선수를 찾을 수 없습니다</p>
        <button onClick={() => router.back()} className="mt-4 text-green-600 text-sm">← 돌아가기</button>
      </div>
    );
  }

  // Stats
  const attendCount = events.reduce((n, e) => {
    const v = e.votes.find((v) => v.playerId === id);
    return v?.status === 'attending' ? n + 1 : n;
  }, 0);

  const mvpCount = matchRecords.reduce((n, m) => {
    const topId = getMvpId(m.mvpVotes);
    return topId === id ? n + 1 : n;
  }, 0);

  const matchParticipation = matchRecords.filter((m) => m.playerIds.includes(id));

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const scoreColor =
    player.score <= 3 ? 'text-sky-600' :
    player.score <= 6 ? 'text-indigo-600' :
    player.score <= 9 ? 'text-purple-600' : 'text-amber-500';

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-400 text-sm hover:text-gray-600 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        팀으로
      </button>

      {/* Profile hero */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-black shadow-sm">
              {player.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">{player.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <TierBadge tier={player.tier} status={player.status} />
                {player.position && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{player.position}</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-black ${player.status === 'measuring' ? 'text-gray-200' : scoreColor}`}>
              {player.status === 'measuring' ? '?' : player.score}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">실력 점수</div>
          </div>
        </div>

        {player.status === 'measuring' && (
          <div className="mt-3 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 text-xs text-orange-600">
            루키 — 운영진 등급 확정 대기 중 ({player.officialMatchCount}경기 참여)
          </div>
        )}

        {role === 'admin' && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
            <button onClick={() => setEditing(true)}
              className="flex-1 text-sm border border-gray-200 text-gray-600 rounded-xl py-2 hover:bg-gray-50 transition font-medium">
              정보 수정
            </button>
            <button onClick={() => { removePlayer(player.id); router.push('/team'); }}
              className="px-4 text-sm border border-red-100 text-red-400 rounded-xl py-2 hover:bg-red-50 transition">
              삭제
            </button>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '출석', value: attendCount, unit: '회', color: 'text-green-600' },
          { label: '경기 참가', value: matchParticipation.length, unit: '회', color: 'text-indigo-600' },
          { label: 'MVP', value: mvpCount, unit: '회', color: 'text-amber-500' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Skill bar */}
      {player.status === 'confirmed' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">실력 지수</span>
            <span className="text-xs text-gray-400">{TIER_LABELS[player.tier]}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
              style={{ width: `${player.score * 10}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>1</span><span>5</span><span>10</span>
          </div>
        </div>
      )}

      {/* Recent attendance */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="font-bold text-gray-900 text-sm mb-3">최근 출석 현황</h2>
        {recentEvents.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">경기 일정이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {recentEvents.map((e) => {
              const v = e.votes.find((v) => v.playerId === id);
              const label = v?.status === 'attending' ? '✅ 참석' : v?.status === 'absent' ? '❌ 불참' : v?.status === 'maybe' ? '🤔 미정' : '— 미투표';
              const color = v?.status === 'attending' ? 'text-green-600' : v?.status === 'absent' ? 'text-red-500' : 'text-gray-400';
              return (
                <div key={e.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="font-medium text-gray-800">{e.title}</span>
                    <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <span className={`text-xs font-semibold ${color}`}>{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MVP history */}
      {mvpCount > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
          <h2 className="font-bold text-amber-800 text-sm mb-2">🏆 MVP 수상</h2>
          {matchRecords.filter((m) => getMvpId(m.mvpVotes) === id).map((m) => (
            <div key={m.id} className="flex justify-between text-sm py-1">
              <span className="text-amber-700">{m.title}</span>
              <span className="text-amber-500 text-xs">{new Date(m.date).toLocaleDateString('ko-KR')}</span>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal title="선수 정보 수정" onClose={() => setEditing(false)}>
          <PlayerForm editPlayer={player} onClose={() => setEditing(false)} />
        </Modal>
      )}
    </div>
  );
}

function getMvpId(votes: { voterId: string; mvpPlayerId: string }[]): string | null {
  if (!votes.length) return null;
  const counts = new Map<string, number>();
  votes.forEach((v) => counts.set(v.mvpPlayerId, (counts.get(v.mvpPlayerId) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
