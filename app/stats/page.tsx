'use client';
import { useSoccerStore } from '../store/useSoccerStore';
import { TIER_LABELS, Tier } from '../types';
import { TierBadge } from '../components/TierBadge';

const TIER_GROUPS: { key: string; label: string; tiers: Tier[]; bar: string }[] = [
  { key: 'beginner',  label: '비기너',  tiers: ['beginner-1','beginner-2','beginner-3'],   bar: 'bg-sky-400' },
  { key: 'amateur',   label: '아마추어', tiers: ['amateur-1','amateur-2','amateur-3'],      bar: 'bg-indigo-400' },
  { key: 'semi-pro',  label: '세미프로', tiers: ['semi-pro-1','semi-pro-2','semi-pro-3'],   bar: 'bg-purple-400' },
  { key: 'pro',       label: '프로',    tiers: ['pro'],                                    bar: 'bg-amber-400' },
];

export default function StatsPage() {
  const { players, events } = useSoccerStore();

  // 출석 횟수 계산 (전체 이벤트 기준)
  const attendMap = new Map<string, number>();
  events.forEach((e) => {
    e.votes.filter((v) => v.status === 'attending').forEach((v) => {
      attendMap.set(v.playerId, (attendMap.get(v.playerId) ?? 0) + 1);
    });
  });

  const playersWithAttend = [...players]
    .map((p) => ({ ...p, attendCount: attendMap.get(p.id) ?? 0 }))
    .sort((a, b) => b.attendCount - a.attendCount || b.score - a.score);

  const confirmedPlayers = players.filter((p) => p.status === 'confirmed');
  const avgScore = confirmedPlayers.length
    ? +(confirmedPlayers.reduce((s, p) => s + p.score, 0) / confirmedPlayers.length).toFixed(1)
    : 0;

  const totalAttendances = [...attendMap.values()].reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">통계</h1>
        <p className="text-gray-500 text-sm mt-0.5">팀 현황 및 참석 데이터</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: players.length, label: '등록 선수', color: 'text-gray-900' },
          { value: events.filter(e => e.isOpen).length, label: '진행중 일정', color: 'text-green-600' },
          { value: avgScore || '—', label: '평균 실력', color: 'text-purple-600' },
        ].map(({ value, label, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* 출석 랭킹 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">출석 랭킹</h2>
        {playersWithAttend.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">선수 데이터가 없습니다</p>
        ) : (
          <div className="space-y-2">
            {playersWithAttend.map((p, i) => {
              const pct = totalAttendances > 0 ? Math.round((p.attendCount / Math.max(...playersWithAttend.map(x => x.attendCount), 1)) * 100) : 0;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-sm font-black w-6 text-center text-gray-300">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-gray-300">{i + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 truncate">{p.name}</span>
                        <TierBadge tier={p.tier} status={p.status} />
                      </div>
                      <span className="text-sm font-bold text-gray-700 ml-2 flex-shrink-0">{p.attendCount}회</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 티어 분포 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">티어 분포</h2>
        {players.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">선수 데이터가 없습니다</p>
        ) : (
          <div className="space-y-3">
            {TIER_GROUPS.map(({ key, label, tiers, bar }) => {
              const count = players.filter((p) => tiers.includes(p.tier as Tier)).length;
              const pct = players.length ? Math.round((count / players.length) * 100) : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs w-14 text-gray-600 font-medium">{label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right font-semibold">{count}명</span>
                </div>
              );
            })}
            {/* 루키 */}
            {(() => {
              const count = players.filter((p) => p.status === 'measuring').length;
              const pct = players.length ? Math.round((count / players.length) * 100) : 0;
              return (
                <div className="flex items-center gap-3">
                  <span className="text-xs w-14 text-gray-600 font-medium">루키</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-gray-300 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right font-semibold">{count}명</span>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 선수 실력 랭킹 (확정 선수만) */}
      {confirmedPlayers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">실력 랭킹</h2>
          <div className="space-y-2">
            {[...confirmedPlayers].sort((a, b) => b.score - a.score).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm font-black w-6 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-gray-300 text-xs">{i + 1}</span>}
                </span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-semibold text-gray-900 text-sm truncate">{p.name}</span>
                  <TierBadge tier={p.tier} status={p.status} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-100 rounded-full h-1.5">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${p.score * 10}%` }} />
                  </div>
                  <span className="text-sm font-black text-gray-700 w-4">{p.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
