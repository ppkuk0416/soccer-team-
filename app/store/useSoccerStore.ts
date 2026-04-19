'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Player, MatchResult, Tier, TIER_SCORE_RANGE } from '../types';

interface SoccerStore {
  players: Player[];
  matches: MatchResult[];
  addPlayer: (name: string, score: number, position?: string) => void;
  updatePlayer: (id: string, updates: Partial<Omit<Player, 'id' | 'createdAt'>>) => void;
  removePlayer: (id: string) => void;
  addMatch: (match: MatchResult) => void;
  removeMatch: (id: string) => void;
}

function scoreToTier(score: number): Tier {
  if (score <= 3) return 'beginner';
  if (score <= 5) return 'amateur';
  if (score <= 8) return 'semi-pro';
  return 'pro';
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const useSoccerStore = create<SoccerStore>()(
  persist(
    (set) => ({
      players: [],
      matches: [],

      addPlayer: (name, score, position) =>
        set((s) => ({
          players: [
            ...s.players,
            {
              id: genId(),
              name,
              score,
              tier: scoreToTier(score),
              position,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updatePlayer: (id, updates) =>
        set((s) => ({
          players: s.players.map((p) => {
            if (p.id !== id) return p;
            const newScore = updates.score ?? p.score;
            return { ...p, ...updates, tier: scoreToTier(newScore) };
          }),
        })),

      removePlayer: (id) =>
        set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

      addMatch: (match) =>
        set((s) => ({ matches: [match, ...s.matches] })),

      removeMatch: (id) =>
        set((s) => ({ matches: s.matches.filter((m) => m.id !== id) })),
    }),
    { name: 'soccer-store' }
  )
);
