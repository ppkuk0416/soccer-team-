'use client';
import { useSoccerStore } from '../store/useSoccerStore';
import { TIER_LABELS } from '../types';

function StarDisplay({ value }: { value: number }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`text-sm ${s <= rounded ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
      ))}
      <span className="text-xs text-gray-500 ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

export default function StatsPage() {
  const { players, matches } = useSoccerStore();

  // Compute team-based stats from match history
  const teamStatMap = new Map<string, {
    name: string;
    matches: number; wins: number; draws: number; losses: number;
    goalsFor: number; goalsAgainst: number;
    skillRating: number;
    mannerTotal: number; mannerCount: number;
  }>();

  function ensureTeam(id: string, name: string, skillRating: number) {
    if (!teamStatMap.has(id)) {
      teamStatMap.set(id, { name, matches: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, skillRating, mannerTotal: 0, mannerCount: 0 });
    }
  }

  for (const m of matches) {
    ensureTeam(m.teamA.id, m.teamA.name, m.teamA.avgScore);
    ensureTeam(m.teamB.id, m.teamB.name, m.teamB.avgScore);
    const a = teamStatMap.get(m.teamA.id)!;
    const b = teamStatMap.get(m.teamB.id)!;

    a.matches++; b.matches++;
    a.goalsFor += m.scoreA; a.goalsAgainst += m.scoreB;
    b.goalsFor += m.scoreB; b.goalsAgainst += m.scoreA;
    if (m.scoreA > m.scoreB) { a.wins++; b.losses++; }
    else if (m.scoreA < m.scoreB) { a.losses++; b.wins++; }
    else { a.draws++; b.draws++; }
    a.mannerTotal += m.mannerRatingA; a.mannerCount++;
    b.mannerTotal += m.mannerRatingB; b.mannerCount++;
  }

  const teamStats = [...teamStatMap.values()].map((t) => ({
    ...t,
    winRate: t.matches ? Math.round((t.wins / t.matches) * 100) : 0,
    mannerRating: t.mannerCount ? +(t.mannerTotal / t.mannerCount).toFixed(1) : 0,
  })).sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);

  // Player stats
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const avgScore = players.length ? +(players.reduce((s, p) => s + p.score, 0) / players.length).toFixed(1) : 0;

  const tierDist = { pro: 0, 'semi-pro': 0, amateur: 0, beginner: 0 };
  players.forEach((p) => tierDist[p.tier]++);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">통계 & 팀 레이팅</h1>
        <p className="text-gray-500 text-sm mt-1">경기 데이터 기반 팀/선수 분석</p>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-100">
          <div className="text-3xl font-black text-green-600">{players.length}</div>
          <div className="text-xs text-green-700 mt-1">등록 선수</div>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100">
          <div className="text-3xl font-black text-blue-600">{matches.length}</div>
          <div className="text-xs text-blue-700 mt-1">총 경기</div>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 text-center border border-purple-100">
          <div className="text-3xl font-black text-purple-600">{avgScore}</div>
          <div className="text-xs text-purple-700 mt-1">평균 실력</div>
        </div>
      </div>

      {/* Tier distribution */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
        <h2 className="font-bold text-gray-700 mb-4">티어 분포</h2>
        {players.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">선수 데이터가 없습니다</p>
        ) : (
          <div className="space-y-3">
            {(['pro', 'semi-pro', 'amateur', 'beginner'] as const).map((tier) => {
              const count = tierDist[tier];
              const pct = players.length ? Math.round((count / players.length) * 100) : 0;
              const colors = {
                pro: 'bg-yellow-400',
                'semi-pro': 'bg-purple-400',
                amateur: 'bg-blue-400',
                beginner: 'bg-gray-300',
              };
              return (
                <div key={tier} className="flex items-center gap-3">
                  <span className="text-sm w-16 text-gray-600">{TIER_LABELS[tier]}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className={`h-full rounded-full ${colors[tier]} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-gray-500 w-10 text-right">{count}명</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Team ratings table */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
        <h2 className="font-bold text-gray-700 mb-4">팀 레이팅 (경기 기록 기반)</h2>
        {teamStats.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">🏆</div>
            <p className="text-sm">경기를 기록하면 팀 레이팅이 쌓입니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teamStats.map((t, i) => (
              <div key={t.name} className="flex items-start gap-4 p-3 rounded-xl bg-gray-50">
                <div className="text-2xl font-black text-gray-300 w-6 text-center">{i + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-800">{t.name}</span>
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                      t.winRate >= 60 ? 'bg-green-100 text-green-700' :
                      t.winRate >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>{t.winRate}% 승률</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 mb-2">
                    <span>{t.matches}경기</span>
                    <span className="text-green-600">{t.wins}승</span>
                    <span className="text-gray-400">{t.draws}무</span>
                    <span className="text-red-400">{t.losses}패</span>
                    <span>{t.goalsFor}:{t.goalsAgainst}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">실력</span>
                      <span className="font-bold text-purple-600">{t.skillRating}/10</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">매너</span>
                      <StarDisplay value={t.mannerRating} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top players */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
        <h2 className="font-bold text-gray-700 mb-4">선수 실력 랭킹</h2>
        {sortedPlayers.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">선수가 없습니다</p>
        ) : (
          <div className="space-y-2">
            {sortedPlayers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className={`text-sm font-bold w-6 text-center ${i < 3 ? 'text-yellow-500' : 'text-gray-300'}`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </span>
                <span className="flex-1 text-gray-800 font-medium">{p.name}</span>
                {p.position && <span className="text-xs text-gray-400">{p.position}</span>}
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-100 rounded-full h-2">
                    <div className="h-full rounded-full bg-green-400" style={{ width: `${p.score * 10}%` }} />
                  </div>
                  <span className="font-bold text-gray-600 w-4">{p.score}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
