'use client';
import { useState } from 'react';
import { useSoccerStore } from '../store/useSoccerStore';
import { PlayerCard } from '../components/PlayerCard';
import { PlayerForm } from '../components/PlayerForm';
import { Modal } from '../components/Modal';
import { TIER_LABELS, Tier } from '../types';

const TIERS: Tier[] = ['pro', 'semi-pro', 'amateur', 'beginner'];

export default function PlayersPage() {
  const players = useSoccerStore((s) => s.players);
  const [showAdd, setShowAdd] = useState(false);
  const [filterTier, setFilterTier] = useState<Tier | 'all'>('all');

  const filtered = filterTier === 'all' ? players : players.filter((p) => p.tier === filterTier);
  const sorted = [...filtered].sort((a, b) => b.score - a.score);

  const tierCounts = {
    pro: players.filter((p) => p.tier === 'pro').length,
    'semi-pro': players.filter((p) => p.tier === 'semi-pro').length,
    amateur: players.filter((p) => p.tier === 'amateur').length,
    beginner: players.filter((p) => p.tier === 'beginner').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">선수 관리</h1>
          <p className="text-gray-500 text-sm mt-1">총 {players.length}명 등록</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-xl transition shadow"
        >
          + 선수 추가
        </button>
      </div>

      {/* Tier summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { tier: 'pro' as Tier, label: '프로', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { tier: 'semi-pro' as Tier, label: '세미프로', color: 'bg-purple-50 border-purple-200 text-purple-700' },
          { tier: 'amateur' as Tier, label: '아마추어', color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { tier: 'beginner' as Tier, label: '비기너', color: 'bg-gray-50 border-gray-200 text-gray-600' },
        ].map(({ tier, label, color }) => (
          <button
            key={tier}
            onClick={() => setFilterTier(filterTier === tier ? 'all' : tier)}
            className={`rounded-xl border p-3 text-center transition ${color} ${filterTier === tier ? 'ring-2 ring-offset-1 ring-current' : ''}`}
          >
            <div className="text-2xl font-bold">{tierCounts[tier]}</div>
            <div className="text-xs mt-1">{label}</div>
          </button>
        ))}
      </div>

      {/* Player list */}
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">⚽</div>
            <p>선수가 없습니다. 선수를 추가해보세요!</p>
          </div>
        ) : (
          sorted.map((p) => <PlayerCard key={p.id} player={p} />)
        )}
      </div>

      {showAdd && (
        <Modal title="선수 추가" onClose={() => setShowAdd(false)}>
          <PlayerForm onClose={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  );
}
