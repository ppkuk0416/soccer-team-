'use client';
import { useState } from 'react';
import { Player } from '../types';
import { TierBadge } from './TierBadge';
import { PlayerForm } from './PlayerForm';
import { useSoccerStore } from '../store/useSupabaseStore';

export function PlayerCard({ player, selectable, selected, onToggle }: {
  player: Player;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const { removePlayer, role } = useSoccerStore();

  if (editing) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <PlayerForm editPlayer={player} onClose={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div
      onClick={selectable ? onToggle : undefined}
      className={`bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between gap-3 border transition
        ${selectable ? 'cursor-pointer select-none' : ''}
        ${selected ? 'border-green-400 bg-green-50' : 'border-gray-100'}
      `}
    >
      <div className="flex items-center gap-3 min-w-0">
        {selectable && (
          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
            ${selected ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
            {selected && <span className="text-white text-[10px] font-bold">✓</span>}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{player.name}</span>
            {player.position && <span className="text-xs text-gray-400">{player.position}</span>}
          </div>
          <div className="mt-0.5">
            <TierBadge tier={player.tier} status={player.status} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xl font-black tabular-nums ${player.status === 'measuring' ? 'text-gray-200' : 'text-gray-700'}`}>
          {player.status === 'measuring' ? '—' : player.score}
        </span>
        {!selectable && role === 'admin' && (
          <div className="flex gap-0.5">
            <button onClick={() => setEditing(true)} className="p-1.5 text-gray-300 hover:text-gray-600 transition rounded-lg hover:bg-gray-50">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button onClick={() => removePlayer(player.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition rounded-lg hover:bg-red-50">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
