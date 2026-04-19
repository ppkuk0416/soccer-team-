'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Player, EvalRequest, MatchResult, Tier, UserRole } from '../types';

interface SoccerStore {
  role: UserRole;
  players: Player[];
  matches: MatchResult[];
  evalRequests: EvalRequest[];

  setRole: (role: UserRole) => void;
  addPlayer: (name: string, score: number, position?: string) => void;
  updatePlayer: (id: string, updates: Partial<Omit<Player, 'id' | 'createdAt'>>) => void;
  removePlayer: (id: string) => void;
  confirmTier: (playerId: string, score: number) => void; // 운영진 확정
  incrementMatchCount: (playerIds: string[]) => void;
  addMatch: (match: MatchResult) => void;
  removeMatch: (id: string) => void;
  submitEvalRequest: (req: Omit<EvalRequest, 'id' | 'requestedAt' | 'status'>) => void;
  resolveEvalRequest: (reqId: string, approved: boolean) => void;
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
      role: 'member',
      players: [],
      matches: [],
      evalRequests: [],

      setRole: (role) => set({ role }),

      addPlayer: (name, score, position) =>
        set((s) => ({
          players: [
            ...s.players,
            {
              id: genId(),
              name,
              score,
              tier: scoreToTier(score),
              status: 'measuring',
              officialMatchCount: 0,
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

      confirmTier: (playerId, score) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id !== playerId
              ? p
              : { ...p, score, tier: scoreToTier(score), status: 'confirmed' }
          ),
        })),

      incrementMatchCount: (playerIds) =>
        set((s) => ({
          players: s.players.map((p) => {
            if (!playerIds.includes(p.id)) return p;
            const newCount = p.officialMatchCount + 1;
            return { ...p, officialMatchCount: newCount };
          }),
        })),

      addMatch: (match) =>
        set((s) => ({ matches: [match, ...s.matches] })),

      removeMatch: (id) =>
        set((s) => ({ matches: s.matches.filter((m) => m.id !== id) })),

      submitEvalRequest: (req) =>
        set((s) => ({
          evalRequests: [
            {
              ...req,
              id: genId(),
              requestedAt: new Date().toISOString(),
              status: 'pending',
            },
            ...s.evalRequests,
          ],
        })),

      resolveEvalRequest: (reqId, approved) =>
        set((s) => {
          const req = s.evalRequests.find((r) => r.id === reqId);
          if (!req) return s;
          const updatedRequests = s.evalRequests.map((r) =>
            r.id === reqId ? { ...r, status: approved ? 'approved' : 'rejected' } as EvalRequest : r
          );
          if (!approved) return { evalRequests: updatedRequests };
          // 승인 시 해당 선수 티어 반영
          const updatedPlayers = s.players.map((p) => {
            if (p.id !== req.playerId) return p;
            const tierScoreMap: Record<Tier, number> = {
              beginner: 2, amateur: 5, 'semi-pro': 7, pro: 10,
            };
            const newScore = tierScoreMap[req.suggestedTier];
            return { ...p, score: newScore, tier: req.suggestedTier, status: 'confirmed' as const };
          });
          return { evalRequests: updatedRequests, players: updatedPlayers };
        }),
    }),
    { name: 'soccer-store' }
  )
);
