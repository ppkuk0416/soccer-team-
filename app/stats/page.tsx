'use client';
import { useSupabaseStore } from '../store/useSupabaseStore';
import { TIER_LABELS, Tier } from '../types';
import { TierBadge, tierAvatarColors } from '../components/TierBadge';

const TIER_GROUPS: { key: string; label: string; tiers: Tier[]; bar: string }[] = [
  { key: 'beginner',  label: '비기너',  tiers: ['beginner-1','beginner-2','beginner-3'],  bar: 'bg-sky-400' },
  { key: 'amateur',   label: '아마추어', tiers: ['amateur-1','amateur-2','amateur-3'],     bar: 'bg-indigo-400' },
  { key: 'semi-pro',  label: '세미프로', tiers: ['semi-pro-1','semi-pro-2','semi-pro-3'],  bar: 'bg-purple-400' },
  { key: 'pro',       label: '프로',    tiers: ['pro'],                                   bar: 'bg-amber-400' },
];

function getMvpId(votes: { voterId: string; mvpPlayerId: string }[]): string | null {
  if (!votes.length) return null;
  const counts = new Map<string, number>();
  votes.forEach((v) => counts.set(v.mvpPlayerId, (counts.get(v.mvpPlayerId) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export default function StatsPage() {
  const { players, events, matchRecords } = useSupabaseStore();

  const attendMap = new Map<string, number>();
  events.forEach((e) => {
    e.votes.filter((v) => v.status === 'attending').forEach((v) => {
      attendMap.set(v.playerId, (attendMap.get(v.playerId) ?? 0) + 1);
    });
  });

  const mvpMap = new Map<string, number>();
  matchRecords.forEach((m) => {
    const topId = getMvpId(m.mvpVotes);
    if (topId) mvpMap.set(topId, (mvpMap.get(topId) ?? 0) + 1);
  });

  const confirmedPlayers = players.filter((p) => p.status === 'confirmed');
  const avgScore = confirmedPlayers.length
    ? +(confirmedPlayers.reduce((s, p) => s + p.score, 0) / confirmedPlayers.length).toFixed(1)
    : 0;

  const totalEvents = events.length;
  const totalAttend = [...attendMap.values()].reduce((s, n) => s + n, 0);
  const avgAttendRate = players.length && totalEvents > 0
    ? Math.round((totalAttend / (players.length * totalEvents)) * 100)
    : 0;

  const playersRanked = [...players]
    .map((p) => ({ ...p, attendCount: attendMap.get(p.id) ?? 0, mvpCount: mvpMap.get(p.id) ?? 0 }))
    .sort((a, b) => b.attendCount - a.attendCount || b.score - a.score);

  const maxAttend = Math.max(...playersRanked.map((p) => p.attendCount), 1);

  const topMvp = [...players]
    .map((p) => ({ ...p, mvpCount: mvpMap.get(p.id) ?? 0 }))
    .filter((p) => p.mvpCount > 0)
    .sort((a, b) => b.mvpCount - a.mvpCount)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-gray-900">통계</h1>
        <p className="text-sm text-gray-400 mt-0.5">팀 현황 및 활동 데이터</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="text-2xl font-black text-gray-900">{players.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">등록 선수</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="text-2xl font-black text-indigo-600">{matchRecords.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">공식 경기</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="text-2xl font-black text-green-600">{avgAttendRate}%</div>
          <div className="text-xs text-gray-400 mt-0.5">평균 출석률</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="text-2xl font-black text-purple-600">{avgScore || '—'}</div>
          <div className="text-xs text-gray-400 mt-0.5">평균 실력</div>
        </div>
      </div>

      {/* 출석 랭킹 */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">출석 랭킹</h2>
        {playersRanked.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">선수 데이터가 없습니다</p>
        ) : (
          <div className="space-y-3">
            {playersRanked.map((p, i) => {
              const pct = Math.round((p.attendCount / maxAttend) * 100);
              const rate = totalEvents > 0 ? Math.round((p.attendCount / totalEvents) * 100) : 0;
              const avatarCls = tierAvatarColors(p.tier, p.status);
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-sm w-6 text-center flex-shrink-0">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (
                      <span className="text-xs text-gray-300 font-bold">{i + 1}</span>
                    )}
                  </span>
                  <div className={`w-8 h-8 rounded-xl ${avatarCls} flex items-center justify-center text-xs font-black flex-shrink-0`}>
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-semibold text-gray-900 truncate">{p.name}</span>
                        <TierBadge tier={p.tier} status={p.status} />
                      </div>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <span className="text-xs font-bold text-gray-700">{p.attendCount}회</span>
                        <span className="text-[10px] text-gray-300">({rate}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MVP 랭킹 */}
      {topMvp.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">MVP 랭킹</h2>
          <div className="space-y-2.5">
            {topMvp.map((p, i) => {
              const avatarCls = tierAvatarColors(p.tier, p.status);
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-sm w-6 text-center flex-shrink-0">
                    {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : (
                      <span className="text-xs text-gray-300 font-bold">{i + 1}</span>
                    )}
                  </span>
                  <div className={`w-8 h-8 rounded-xl ${avatarCls} flex items-center justify-center text-xs font-black flex-shrink-0`}>
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                      <TierBadge tier={p.tier} status={p.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: p.mvpCount }).map((_, k) => (
                      <span key={k} className="text-amber-400 text-xs">★</span>
                    ))}
                    <span className="text-xs font-bold text-amber-600 ml-0.5">{p.mvpCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 티어 분포 */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">티어 분포</h2>
        {players.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">선수 데이터가 없습니다</p>
        ) : (
          <div className="space-y-3">
            {TIER_GROUPS.map(({ key, label, tiers, bar }) => {
              const count = players.filter((p) => tiers.includes(p.tier as Tier) && p.status === 'confirmed').length;
              const pct = players.length ? Math.round((count / players.length) * 100) : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs w-14 text-gray-500 font-medium">{label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right font-bold">{count}명</span>
                </div>
              );
            })}
            {(() => {
              const count = players.filter((p) => p.status === 'measuring').length;
              const pct = players.length ? Math.round((count / players.length) * 100) : 0;
              return (
                <div className="flex items-center gap-3">
                  <span className="text-xs w-14 text-gray-400 font-medium">루키</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-gray-300 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right font-bold">{count}명</span>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 실력 랭킹 */}
      {confirmedPlayers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">실력 랭킹</h2>
          <div className="space-y-0">
            {[...confirmedPlayers].sort((a, b) => b.score - a.score).map((p, i) => {
              const avatarCls = tierAvatarColors(p.tier, p.status);
              const barColor =
                p.score <= 3 ? 'bg-sky-400' :
                p.score <= 6 ? 'bg-indigo-400' :
                p.score <= 9 ? 'bg-purple-400' : 'bg-amber-400';
              return (
                <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm w-6 text-center flex-shrink-0">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (
                      <span className="text-xs text-gray-300 font-bold">{i + 1}</span>
                    )}
                  </span>
                  <div className={`w-8 h-8 rounded-xl ${avatarCls} flex items-center justify-center text-xs font-black flex-shrink-0`}>
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="font-semibold text-gray-900 text-sm truncate">{p.name}</span>
                    <TierBadge tier={p.tier} status={p.status} />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-16 bg-gray-100 rounded-full h-1.5">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${p.score * 10}%` }} />
                    </div>
                    <span className="text-sm font-black text-gray-700 w-4 text-right">{p.score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
