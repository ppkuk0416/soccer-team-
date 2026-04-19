'use client';
import { useState } from 'react';
import { useSoccerStore } from '../store/useSoccerStore';
import { Player } from '../types';

interface Props {
  editPlayer?: Player;
  onClose: () => void;
}

export function PlayerForm({ editPlayer, onClose }: Props) {
  const { addPlayer, updatePlayer } = useSoccerStore();
  const [name, setName] = useState(editPlayer?.name ?? '');
  const [score, setScore] = useState(editPlayer?.score ?? 5);
  const [position, setPosition] = useState(editPlayer?.position ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (editPlayer) {
      updatePlayer(editPlayer.id, { name: name.trim(), score, position: position.trim() || undefined });
    } else {
      addPlayer(name.trim(), score, position.trim() || undefined);
    }
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="선수 이름"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          실력 점수: <span className="text-green-600 font-bold">{score}점</span>
        </label>
        <input
          type="range" min={1} max={10} value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="w-full accent-green-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1 (비기너)</span><span>5 (아마추어)</span><span>8 (세미프로)</span><span>10 (프로)</span>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">포지션 (선택)</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="FW, MF, DF, GK"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition">
          {editPlayer ? '수정' : '추가'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg transition">
          취소
        </button>
      </div>
    </form>
  );
}
