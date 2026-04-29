'use client';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseStore } from '../../store/useSupabaseStore';
import { TierBadge, tierAvatarColors } from '../../components/TierBadge';
import { PlayerForm } from '../../components/PlayerForm';
import { Modal } from '../../components/Modal';
import { TIER_LABELS } from '../../types';

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { players, events, matchRecords, role, removePlayer } = useSupabaseStore();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const player = players.find((p) => p.id === id);
  if (!player) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-sm">선수를 찾을 수 없습니다</p>
        <button onClick={() => router.back()} className="mt-4 text-green-600 text-sm font-medium">← 돌아가기</button>
      </div>
    );
  }

  const totalEvents = events.length;
  const attendCount = events.reduce((n, e) => {
    const v = e.votes.find((v) => v.playerId === id);
    return v?.status === 'attending' ? n + 1 : n;
  }, 0);
  const attendRate = totalEvents > 0 ? Math.round((attendCount / totalEvents) * 100) : 0;

  const totalMatches = matchRecords.length;
  const matchParticipation = matchRecords.filter((m) => m.playerIds.includes(id));
  const matchRate = totalMatches > 0 ? Math.round((matchParticipation.length / totalMatches) * 100) : 0;

  const mvpWins = matchRecords.filter((m) => getMvpId(m.mvpVotes) === id);
  const mvpCount = mvpWins.length;

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const avatarCls = tierAvatarColors(player.tier, player.status);

  const scoreGradient =
    player.score <= 3 ? 'from-sky-400 to-sky-500' :
    player.score <= 6 ? 'from-indigo-400 to-indigo-500' :
    player.score <= 9 ? 'from-purple-400 to-purple-500' :
    'from-amber-400 to-amber-500';

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-gray-400 text-sm hover:text-gray-600 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        팀으로
      </button>

      {/* Hero card */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-2xl ${avatarCls} flex items-center justify-center text-2xl font-black flex-shrink-0`}>
            {player.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-xl font-black text-gray-900">{player.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <TierBadge tier={player.tier} status={player.status} />
                  {player.position && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                      {player.position}
                    </span>
                  )}
                </div>
              </div>
              {player.status === 'confirmed' && (
                <div className="text-right flex-shrink-0">
                  <div className={`text-3xl font-black bg-gradient-to-br ${scoreGradient} bg-clip-text text-transparent`}>
                    {player.score}
                  </div>
                  <div className="text-[10px] text-gray-400">실력</div>
                </div>
              )}
            </div>

            {player.status === 'measuring' && (
              <div className="mt-2 bg-orange-50 rounded-xl px-3 py-2 text-xs text-orange-600 font-medium">
                루키 — 등급 확정 대기 ({player.officialMatchCount}경기 참여)
              </div>
            )}
          </div>
        </div>

        {/* Skill bar */}
        {player.status === 'confirmed' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-500">실력 지수</span>
              <span className="text-xs text-gray-400">{TIER_LABELS[player.tier]}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${scoreGradient} rounded-full transition-all duration-500`}
                style={{ width: `${player.score * 10}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-gray-300 mt-1">
              <span>1</span><span>5</span><span>10</span>
            </div>
          </div>
        )}

        {role === 'admin' && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <button onClick={() => setEditing(true)}
              className="flex-1 text-sm bg-gray-50 text-gray-700 rounded-xl py-2.5 hover:bg-gray-100 transition font-semibold">
              정보 수정
            </button>
            {confirmDelete ? (
              <div className="flex gap-2 flex-1">
                <button onClick={() => { removePlayer(player.id); router.push('/team'); }}
                  className="flex-1 text-sm bg-red-500 text-white rounded-xl py-2.5 font-semibold">
                  확인 삭제
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="px-3 text-sm bg-gray-100 text-gray-500 rounded-xl py-2.5">
                  취소
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="px-4 text-sm bg-red-50 text-red-400 rounded-xl py-2.5 hover:bg-red-100 transition">
                삭제
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <div className="text-2xl font-black text-green-600">{attendCount}</div>
          <div className="text-xs text-gray-400 mt-0.5">출석</div>
          <div className="text-[10px] text-gray-300 mt-0.5">{attendRate}%</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <div className="text-2xl font-black text-indigo-600">{matchParticipation.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">경기 참가</div>
          <div className="text-[10px] text-gray-300 mt-0.5">{matchRate}%</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <div className="text-2xl font-black text-amber-500">{mvpCount}</div>
          <div className="text-xs text-gray-400 mt-0.5">MVP</div>
          <div className="text-[10px] text-gray-300 mt-0.5">&nbsp;</div>
        </div>
      </div>

      {/* Recent attendance */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-bold text-gray-900 text-sm mb-3">최근 출석 현황</h2>
        {recentEvents.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">일정이 없습니다</p>
        ) : (
          <div className="space-y-0">
            {recentEvents.map((e) => {
              const v = e.votes.find((v) => v.playerId === id);
              const statusMap = {
                attending: { label: '참석', cls: 'bg-green-50 text-green-600' },
                absent:    { label: '불참', cls: 'bg-red-50 text-red-500' },
                maybe:     { label: '미정', cls: 'bg-yellow-50 text-yellow-600' },
              };
              const s = v?.status && statusMap[v.status as keyof typeof statusMap];
              const d = new Date(e.date);
              return (
                <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-black text-gray-700 leading-none">{d.getDate()}</span>
                      <span className="text-[9px] text-gray-400">{d.getMonth() + 1}월</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">{e.title}</span>
                  </div>
                  {s ? (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                  ) : (
                    <span className="text-xs text-gray-300">미투표</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MVP history */}
      {mvpCount > 0 && (
        <div className="bg-amber-50 rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-amber-800 text-sm mb-3">MVP 수상 내역</h2>
          <div className="space-y-0">
            {mvpWins.map((m) => (
              <div key={m.id} className="flex justify-between items-center py-2 border-b border-amber-100 last:border-0">
                <span className="text-sm text-amber-700 font-medium">{m.title}</span>
                <span className="text-xs text-amber-400">{new Date(m.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
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
