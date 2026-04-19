'use client';
import { useState } from 'react';
import { useSoccerStore } from '../store/useSoccerStore';
import { Tier, TIER_LABELS, EvalRequest } from '../types';
import { TierBadge } from '../components/TierBadge';

const TIERS: Tier[] = ['beginner', 'amateur', 'semi-pro', 'pro'];
const TIER_SCORE: Record<Tier, number> = {
  beginner: 2, amateur: 4, 'semi-pro': 7, pro: 10,
};
const TIER_COLOR: Record<Tier, string> = {
  beginner: 'border-gray-300 text-gray-600',
  amateur: 'border-blue-300 text-blue-600',
  'semi-pro': 'border-purple-300 text-purple-600',
  pro: 'border-yellow-400 text-yellow-600',
};

export default function AdminPage() {
  const { role, players, evalRequests, setRole, confirmTier, resolveEvalRequest, submitEvalRequest } = useSoccerStore();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier>('amateur');
  // eval request form
  const [reqPlayerId, setReqPlayerId] = useState('');
  const [reqTier, setReqTier] = useState<Tier>('semi-pro');
  const [reqReason, setReqReason] = useState('');

  const measuring = players.filter((p) => p.status === 'measuring');
  const pendingRequests = evalRequests.filter((r) => r.status === 'pending');
  const resolvedRequests = evalRequests.filter((r) => r.status !== 'pending');

  function handleConfirm(playerId: string) {
    confirmTier(playerId, TIER_SCORE[selectedTier]);
    setConfirmingId(null);
  }

  function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    const player = players.find((p) => p.id === reqPlayerId);
    if (!player) return;
    submitEvalRequest({
      playerId: player.id,
      playerName: player.name,
      currentTier: player.tier,
      suggestedTier: reqTier,
      reason: reqReason.trim() || undefined,
    });
    setReqPlayerId('');
    setReqReason('');
  }

  return (
    <div className="space-y-6">
      {/* Role switcher */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">평가 관리</h1>
        <div className="flex gap-2 mt-3">
          {(['admin', 'member'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition
                ${role === r ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-500 border-gray-200'}`}
            >
              {r === 'admin' ? '🛡️ 운영진 모드' : '👤 팀원 모드'}
            </button>
          ))}
        </div>
        {role === 'admin' && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2 border border-amber-200">
            운영진 모드입니다. 티어 확정 및 재평가 승인 권한이 있습니다.
          </p>
        )}
      </div>

      {/* ADMIN: 측정중 선수 티어 확정 */}
      {role === 'admin' && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
          <h2 className="font-bold text-gray-700 mb-1">🕐 측정중 선수</h2>
          <p className="text-xs text-gray-400 mb-4">경기 참여 후 운영진이 공식 티어를 확정합니다</p>
          {measuring.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">측정중인 선수가 없습니다</p>
          ) : (
            <div className="space-y-3">
              {measuring.map((p) => (
                <div key={p.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-gray-800">{p.name}</span>
                      <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                        측정중 ({p.officialMatchCount}/3경기)
                      </span>
                    </div>
                  </div>
                  {confirmingId === p.id ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">티어 선택 후 확정</p>
                      <div className="flex flex-wrap gap-1.5">
                        {TIERS.map((t) => (
                          <button
                            key={t}
                            onClick={() => setSelectedTier(t)}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition
                              ${selectedTier === t ? TIER_COLOR[t] + ' bg-white ring-2 ring-offset-1 ring-current' : 'border-gray-200 text-gray-400'}`}
                          >
                            {TIER_LABELS[t]}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirm(p.id)}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-1.5 rounded-lg transition"
                        >
                          확정
                        </button>
                        <button
                          onClick={() => setConfirmingId(null)}
                          className="px-4 bg-gray-100 text-gray-500 text-sm rounded-lg hover:bg-gray-200 transition"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConfirmingId(p.id); setSelectedTier(p.tier); }}
                      className="w-full text-sm border border-green-300 text-green-600 rounded-lg py-1.5 hover:bg-green-50 transition font-medium"
                    >
                      티어 확정하기
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADMIN: 재평가 요청 처리 */}
      {role === 'admin' && pendingRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
          <h2 className="font-bold text-gray-700 mb-4">📬 재평가 요청 ({pendingRequests.length}건)</h2>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="border border-orange-100 bg-orange-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800">{req.playerName}</span>
                  <TierBadge tier={req.currentTier} />
                  <span className="text-gray-400 text-sm">→</span>
                  <TierBadge tier={req.suggestedTier} />
                </div>
                {req.reason && <p className="text-xs text-gray-500 mb-2">"{req.reason}"</p>}
                <p className="text-xs text-gray-400 mb-2">{new Date(req.requestedAt).toLocaleDateString('ko-KR')}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => resolveEvalRequest(req.id, true)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-1.5 rounded-lg transition"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => resolveEvalRequest(req.id, false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-600 text-sm font-semibold py-1.5 rounded-lg transition"
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MEMBER: 재평가 요청 제출 */}
      {role === 'member' && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
          <h2 className="font-bold text-gray-700 mb-1">📝 재평가 요청</h2>
          <p className="text-xs text-gray-400 mb-4">실력이 달라진 것 같은 선수를 운영진에게 재평가 요청합니다</p>
          {players.filter((p) => p.status === 'confirmed').length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">확정된 선수가 없습니다</p>
          ) : (
            <form onSubmit={handleSubmitRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">선수 선택</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={reqPlayerId}
                  onChange={(e) => setReqPlayerId(e.target.value)}
                  required
                >
                  <option value="">선수 선택...</option>
                  {players.filter((p) => p.status === 'confirmed').map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({TIER_LABELS[p.tier]})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">제안 티어</label>
                <div className="flex gap-2 flex-wrap">
                  {TIERS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setReqTier(t)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition
                        ${reqTier === t ? TIER_COLOR[t] + ' bg-white ring-2 ring-offset-1 ring-current' : 'border-gray-200 text-gray-400'}`}
                    >
                      {TIER_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">이유 (선택)</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="예: 최근 3경기 퍼포먼스가 세미프로 수준"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-xl transition"
              >
                요청 보내기
              </button>
            </form>
          )}
        </div>
      )}

      {/* 처리된 요청 내역 */}
      {resolvedRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
          <h2 className="font-bold text-gray-700 mb-3">처리 내역</h2>
          <div className="space-y-2">
            {resolvedRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">{req.playerName}</span>
                  <span className="text-gray-400 text-xs">{TIER_LABELS[req.currentTier]} → {TIER_LABELS[req.suggestedTier]}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${req.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {req.status === 'approved' ? '승인' : '거절'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
