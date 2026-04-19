'use client';
import { useState } from 'react';
import { useSoccerStore } from '../store/useSoccerStore';
import { PlayerCard } from '../components/PlayerCard';
import { PlayerForm } from '../components/PlayerForm';
import { Modal } from '../components/Modal';

export default function TeamPage() {
  const { team, setTeam, players, role } = useSoccerStore();
  const [editingTeam, setEditingTeam] = useState(!team);
  const [teamName, setTeamName] = useState(team?.name ?? '');
  const [teamDesc, setTeamDesc] = useState(team?.description ?? '');
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  function handleSaveTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setTeam(teamName.trim(), teamDesc.trim() || undefined);
    setEditingTeam(false);
  }

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const confirmedCount = players.filter((p) => p.status === 'confirmed').length;
  const measuringCount = players.filter((p) => p.status === 'measuring').length;

  return (
    <div className="space-y-6">
      {/* Team card */}
      {editingTeam || !team ? (
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
          <h2 className="font-bold text-gray-700 mb-4">{team ? '팀 정보 수정' : '팀 만들기'}</h2>
          <form onSubmit={handleSaveTeam} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">팀 이름</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="예: 화요일 FC"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">팀 소개 (선택)</label>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none h-20"
                value={teamDesc}
                onChange={(e) => setTeamDesc(e.target.value)}
                placeholder="예: 매주 화요일 저녁 7시, 상암 풋살장"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-xl transition"
              >
                저장
              </button>
              {team && (
                <button
                  type="button"
                  onClick={() => setEditingTeam(false)}
                  className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition"
                >
                  취소
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs opacity-75 mb-1">내 팀</div>
              <h1 className="text-2xl font-black">{team.name}</h1>
              {team.description && (
                <p className="text-sm opacity-80 mt-1">{team.description}</p>
              )}
            </div>
            {role === 'admin' && (
              <button
                onClick={() => { setTeamName(team.name); setTeamDesc(team.description ?? ''); setEditingTeam(true); }}
                className="text-white/60 hover:text-white text-sm transition"
              >
                ✏️
              </button>
            )}
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <div className="text-2xl font-black">{players.length}</div>
              <div className="text-xs opacity-70">전체 선수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black">{confirmedCount}</div>
              <div className="text-xs opacity-70">확정 선수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black">{measuringCount}</div>
              <div className="text-xs opacity-70">측정중</div>
            </div>
          </div>
        </div>
      )}

      {/* Players section */}
      {team && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-gray-700">선수 명단 ({players.length}명)</h2>
            {role === 'admin' && (
              <button
                onClick={() => setShowAddPlayer(true)}
                className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-3 py-1.5 rounded-xl transition"
              >
                + 선수 추가
              </button>
            )}
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">⚽</div>
              <p className="text-sm">아직 선수가 없습니다</p>
              {role === 'admin' && (
                <button
                  onClick={() => setShowAddPlayer(true)}
                  className="mt-3 text-green-500 font-medium text-sm hover:underline"
                >
                  첫 선수 추가하기
                </button>
              )}
            </div>
          ) : (
            sorted.map((p) => <PlayerCard key={p.id} player={p} />)
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
