'use client';
import { useState } from 'react';
import { useSoccerStore } from '../store/useSupabaseStore';
import { Tier, TIER_LABELS, ALL_TIERS, TIER_TO_SCORE } from '../types';
import { TierBadge } from '../components/TierBadge';

export default function AdminPage() {
  const { role, players, evalRequests, setRole, confirmTier, resolveEvalRequest, submitEvalRequest } = useSoccerStore();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier>('amateur-2');
  const [reqPlayerId, setReqPlayerId] = useState('');
  const [reqTier, setReqTier] = useState<Tier>('amateur-2');
  const [reqReason, setReqReason] = useState('');

  const measuring = players.filter((p) => p.status === 'measuring');
  const pendingRequests  = evalRequests.filter((r) => r.status === 'pending');
  const resolvedRequests = evalRequests.filter((r) => r.status !== 'pending');

  // Group tiers for display
  const tierGroups = [
    { label: '비기너', tiers: ALL_TIERS.filter(t => t.startsWith('beginner')) as Tier[] },
    { label: '아마추어', tiers: ALL_TIERS.filter(t => t.startsWith('amateur')) as Tier[] },
    { label: '세미프로', tiers: ALL_TIERS.filter(t => t.startsWith('semi-pro')) as Tier[] },
    { label: '프로', tiers: ['pro' as Tier] },
  ];

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
    <div className="space-y-6">
      {/* Role switcher */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">평가 관리</h1>
        <div className="flex gap-2 mt-3">
          {(['admin', 'member'] as const).map((r) => (
            <button key={r} onClick={() => setRole(r)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition
                ${role === r ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200'}`}>
              {r === 'admin' ? '🛡️ 운영진' : '👤 팀원'}
            </button>
          ))}
        </div>
        {role === 'admin' && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mt-2 border border-amber-100">
            운영진 모드 — 티어 확정 및 재평가 승인 권한
          </p>
        )}
      </div>

      {/* 측정중 선수 확정 */}
      {role === 'admin' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-1">루키 → 등급 확정</h2>
          <p className="text-xs text-gray-400 mb-4">경기를 지켜본 후 공식 등급을 부여하세요</p>
          {measuring.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">루키 선수가 없습니다</p>
          ) : (
            <div className="space-y-3">
              {measuring.map((p) => (
                <div key={p.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{p.name}</span>
                      <TierBadge tier={p.tier} status={p.status} />
                    </div>
                    <span className="text-xs text-gray-400">{p.officialMatchCount}경기</span>
                  </div>
                  {confirmingId === p.id ? (
                    <div className="space-y-2">
                      {tierGroups.map(({ label, tiers }) => (
                        <div key={label}>
                          <p className="text-[10px] text-gray-400 mb-1">{label}</p>
                          <div className="flex gap-1">
                            {tiers.map((t) => (
                              <button key={t} onClick={() => setSelectedTier(t)}
                                className={`text-xs px-2.5 py-1.5 rounded-lg border transition flex-1 ${selectedTier === t ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                {TIER_LABELS[t]}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleConfirm(p.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 rounded-xl transition">
                          확정
                        </button>
                        <button onClick={() => setConfirmingId(null)}
                          className="px-4 bg-gray-100 text-gray-600 text-sm rounded-xl hover:bg-gray-200 transition">
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setConfirmingId(p.id); setSelectedTier(p.tier); }}
                      className="w-full text-sm border border-gray-200 text-gray-600 rounded-xl py-2 hover:bg-gray-50 transition font-medium">
                      등급 확정하기
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 재평가 요청 처리 */}
      {role === 'admin' && pendingRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">재평가 요청 ({pendingRequests.length})</h2>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 text-sm">{req.playerName}</span>
                  <TierBadge tier={req.currentTier} />
                  <span className="text-gray-300 text-xs">→</span>
                  <TierBadge tier={req.suggestedTier} />
                </div>
                {req.reason && <p className="text-xs text-gray-500 mb-2 italic">"{req.reason}"</p>}
                <div className="flex gap-2">
                  <button onClick={() => resolveEvalRequest(req.id, true)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-1.5 rounded-xl transition">
                    승인
                  </button>
                  <button onClick={() => resolveEvalRequest(req.id, false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold py-1.5 rounded-xl transition">
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 팀원: 재평가 요청 제출 */}
      {role === 'member' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-1">재평가 요청</h2>
          <p className="text-xs text-gray-400 mb-4">실력이 달라진 선수를 운영진에 알립니다</p>
          {players.filter((p) => p.status === 'confirmed').length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">확정된 선수가 없습니다</p>
          ) : (
            <form onSubmit={handleSubmitRequest} className="space-y-3">
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                value={reqPlayerId} onChange={(e) => setReqPlayerId(e.target.value)} required>
                <option value="">선수 선택...</option>
                {players.filter((p) => p.status === 'confirmed').map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({TIER_LABELS[p.tier]})</option>
                ))}
              </select>
              <div className="space-y-2">
                {tierGroups.map(({ label, tiers }) => (
                  <div key={label}>
                    <p className="text-[10px] text-gray-400 mb-1">{label}</p>
                    <div className="flex gap-1">
                      {tiers.map((t) => (
                        <button key={t} type="button" onClick={() => setReqTier(t)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition flex-1 ${reqTier === t ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500'}`}>
                          {TIER_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                value={reqReason} onChange={(e) => setReqReason(e.target.value)} placeholder="이유 (선택)" />
              <button type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                요청 보내기
              </button>
            </form>
          )}
        </div>
      )}

      {resolvedRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-3">처리 내역</h2>
          <div className="space-y-2">
            {resolvedRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">{req.playerName}</span>
                  <span className="text-xs text-gray-400">{TIER_LABELS[req.currentTier]} → {TIER_LABELS[req.suggestedTier]}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${req.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
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
