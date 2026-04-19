'use client';
import { useState } from 'react';
import { Player } from '../types';
import { TierBadge } from './TierBadge';
import { PlayerForm } from './PlayerForm';
import { useSoccerStore } from '../store/useSoccerStore';

export function PlayerCard({ player, selectable, selected, onToggle }: {
  player: Player;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const { removePlayer, role } = useSoccerStore();

  const scoreColor =
    player.score <= 3 ? 'text-gray-500' :
    player.score <= 5 ? 'text-blue-500' :
    player.score <= 8 ? 'text-purple-500' : 'text-yellow-500';

  const isMeasuring = player.status === 'measuring';

  if (editing) {
    return (
      <div className="bg-white rounded-xl p-4 shadow border border-green-200">
        <PlayerForm editPlayer={player} onClose={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div
      onClick={selectable ? onToggle : undefined}
      className={`bg-white rounded-xl px-4 py-3 shadow flex items-center justify-between gap-3 border transition
        ${selectable ? 'cursor-pointer' : ''}
        ${selected ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'}
      `}
    >
      <div className="flex items-center gap-3">
        {selectable && (
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
            ${selected ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
            {selected && <span className="text-white text-xs">✓</span>}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">{player.name}</span>
            {isMeasuring && (
              <span className="text-xs bg-orange-100 text-orange-500 px-1.5 py-0.5 rounded-full font-medium">
                측정중 {player.officialMatchCount}/3
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <TierBadge tier={player.tier} />
            {player.position && <span className="text-xs text-gray-400">{player.position}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-2xl font-bold ${isMeasuring ? 'text-gray-300' : scoreColor}`}>
          {isMeasuring ? '?' : player.score}
        </span>
        {!selectable && role === 'admin' && (
          <div className="flex gap-1">
            <button onClick={() => setEditing(true)} className="p-1.5 text-gray-400 hover:text-blue-500 transition text-sm">✏️</button>
            <button onClick={() => removePlayer(player.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition text-sm">🗑️</button>
          </div>
        )}
      </div>
    </div>
  );
}
