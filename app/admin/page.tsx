'use client';
import { useState } from 'react';
import { useSupabaseStore } from '../store/useSupabaseStore';
import { Tier, TIER_LABELS, ALL_TIERS, TIER_TO_SCORE } from '../types';
import { TierBadge, tierAvatarColors } from '../components/TierBadge';

const TIER_GROUPS = [
  { label: '비기너',  tiers: ALL_TIERS.filter(t => t.startsWith('beginner')) as Tier[] },
  { label: '아마추어', tiers: ALL_TIERS.filter(t => t.startsWith('amateur')) as Tier[] },
  { label: '세미프로', tiers: ALL_TIERS.filter(t => t.startsWith('semi-pro')) as Tier[] },
  { label: '프로',    tiers: ['pro' as Tier] },
];

export default function AdminPage() {
  const { role, players, evalRequests, confirmTier, resolveEvalRequest, submitEvalRequest } = useSupabaseStore();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier>('amateur-2');
  const [reqPlayerId, setReqPlayerId] = useState('');
  const [reqTier, setReqTier] = useState<Tier>('amateur-2');
  const [reqReason, setReqReason] = useState('');

  const measuring = players.filter((p) => p.status === 'measuring');
  const pendingRequests  = evalRequests.filter((r) => r.status === 'pending');
  const resolvedRequests = evalRequests.filter((r) => r.status !== 'pending');

  function handleConfirm(playerId: string) {
    confirmTier(playerId, TIER_TO_SCORE[selectedTier]);
    setConfirmingId(null);
  }

  function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    const player = players.find((p) => p.id === reqPlayerId);
    if (!player) return;
    submitEvalRequest({ playerId: player.id, playerName: player.name, currentTier: player.tier, suggestedTier: reqTier, reason: reqReason.trim() || undefined });
    setReqPlayerId(''); setReqReason('');
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-gray-900">평가 관리</h1>
        <p className="text-sm text-gray-400 mt-0.5">루키 등급 확정 및 재평가 요청</p>
      </div>

      {/* Admin-only section */}
      {role === 'admin' && (
        <>
          {/* 루키 → 등급 확정 */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-gray-900">루키 등급 확정</h2>
              {measuring.length > 0 && (
                <span className="text-xs bg-orange-50 text-orange-600 font-bold px-2 py-0.5 rounded-full">
                  {measuring.length}명 대기
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-4">경기를 지켜본 후 공식 등급을 부여하세요</p>

            {measuring.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm text-gray-400">루키 대기 선수가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {measuring.map((p) => {
                  const avatarCls = tierAvatarColors(p.tier, p.status);
                  return (
                    <div key={p.id} className="bg-stone-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${avatarCls} flex items-center justify-center font-black`}>
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.officialMatchCount}경기 참여</p>
                          </div>
                        </div>
                        <TierBadge tier={p.tier} status={p.status} />
                      </div>

                      {confirmingId === p.id ? (
                        <div className="space-y-2">
                          {TIER_GROUPS.map(({ label, tiers }) => (
                            <div key={label}>
                              <p className="text-[10px] text-gray-400 font-semibold mb-1.5 uppercase tracking-wide">{label}</p>
                              <div className="flex gap-1">
                                {tiers.map((t) => (
                                  <button key={t} onClick={() => setSelectedTier(t)}
                                    className={`text-xs px-2 py-1.5 rounded-xl font-bold flex-1 transition ${
                                      selectedTier === t
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white text-gray-500 hover:bg-gray-100'
                                    }`}>
                                    {TIER_LABELS[t]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-2 pt-2">
                            <button onClick={() => handleConfirm(p.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2.5 rounded-xl transition">
                              등급 확정
                            </button>
                            <button onClick={() => setConfirmingId(null)}
                              className="px-4 bg-white text-gray-500 text-sm rounded-xl hover:bg-gray-100 transition">
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setConfirmingId(p.id); setSelectedTier(p.tier); }}
                          className="w-full text-sm bg-white text-gray-700 rounded-xl py-2.5 hover:bg-gray-50 transition font-semibold">
                          등급 확정하기
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 재평가 요청 처리 */}
          {pendingRequests.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">재평가 요청</h2>
                <span className="text-xs bg-red-50 text-red-500 font-bold px-2 py-0.5 rounded-full">
                  {pendingRequests.length}건 대기
                </span>
              </div>
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="bg-stone-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-900 text-sm">{req.playerName}</span>
                      <TierBadge tier={req.currentTier} />
                      <span className="text-gray-300 text-xs">→</span>
                      <TierBadge tier={req.suggestedTier} />
                    </div>
                    {req.reason && (
                      <p className="text-xs text-gray-500 mb-3 bg-white rounded-xl px-3 py-2">
                        &ldquo;{req.reason}&rdquo;
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => resolveEvalRequest(req.id, true)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2.5 rounded-xl transition">
                        승인
                      </button>
                      <button onClick={() => resolveEvalRequest(req.id, false)}
                        className="flex-1 bg-white hover:bg-gray-50 text-gray-600 text-sm font-bold py-2.5 rounded-xl transition">
                        거절
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 팀원: 재평가 요청 제출 */}
      {role === 'member' && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-1">재평가 요청</h2>
          <p className="text-xs text-gray-400 mb-4">실력 변화가 있는 선수를 운영진에 알립니다</p>
          {players.filter((p) => p.status === 'confirmed').length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">확정된 선수가 없습니다</p>
          ) : (
            <form onSubmit={handleSubmitRequest} className="space-y-3">
              <select
                className="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                value={reqPlayerId} onChange={(e) => setReqPlayerId(e.target.value)} required>
                <option value="">선수 선택...</option>
                {players.filter((p) => p.status === 'confirmed').map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({TIER_LABELS[p.tier]})</option>
                ))}
              </select>

              <div className="space-y-2">
                {TIER_GROUPS.map(({ label, tiers }) => (
                  <div key={label}>
                    <p className="text-[10px] text-gray-400 font-semibold mb-1.5 uppercase tracking-wide">{label}</p>
                    <div className="flex gap-1">
                      {tiers.map((t) => (
                        <button key={t} type="button" onClick={() => setReqTier(t)}
                          className={`text-xs px-2 py-1.5 rounded-xl font-bold flex-1 transition ${
                            reqTier === t ? 'bg-gray-900 text-white' : 'bg-stone-50 text-gray-500 hover:bg-stone-100'
                          }`}>
                          {TIER_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <input
                className="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:text-gray-400"
                value={reqReason} onChange={(e) => setReqReason(e.target.value)}
                placeholder="이유 (선택)" />

              <button type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition text-sm">
                요청 보내기
              </button>
            </form>
          )}
        </div>
      )}

      {/* 처리 내역 */}
      {resolvedRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-3">처리 내역</h2>
          <div className="space-y-0">
            {resolvedRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between py-2.5 border-b border-stone-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">{req.playerName}</span>
                  <span className="text-xs text-gray-400">{TIER_LABELS[req.currentTier]} → {TIER_LABELS[req.suggestedTier]}</span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  req.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-stone-100 text-gray-400'
                }`}>
                  {req.status === 'approved' ? '승인' : '거절'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {role === 'admin' && measuring.length === 0 && pendingRequests.length === 0 && resolvedRequests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">🎉</p>
          <p className="font-bold text-gray-700">처리할 항목이 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">루키 선수 등록이나 재평가 요청을 기다리고 있습니다</p>
        </div>
      )}
    </div>
  );
}
