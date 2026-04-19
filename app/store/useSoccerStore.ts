'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Player, EvalRequest, Tier, UserRole, SoccerTeam, MatchEvent, VoteStatus, SCORE_TO_TIER, TIER_TO_SCORE } from '../types';

interface SoccerStore {
  role: UserRole;
  team: SoccerTeam | null;
  players: Player[];
  evalRequests: EvalRequest[];
  events: MatchEvent[];

  setRole: (role: UserRole) => void;
  setTeam: (name: string, description?: string) => void;
  addPlayer: (name: string, score: number, position?: string) => void;
  updatePlayer: (id: string, updates: Partial<Omit<Player, 'id' | 'createdAt'>>) => void;
  removePlayer: (id: string) => void;
  confirmTier: (playerId: string, score: number) => void;
  incrementMatchCount: (playerIds: string[]) => void;
  submitEvalRequest: (req: Omit<EvalRequest, 'id' | 'requestedAt' | 'status'>) => void;
  resolveEvalRequest: (reqId: string, approved: boolean) => void;
  addEvent: (title: string, date: string, location?: string) => void;
  removeEvent: (id: string) => void;
  vote: (eventId: string, playerId: string, playerName: string, status: VoteStatus) => void;
  closeEvent: (id: string) => void;
}

function scoreToTier(score: number): Tier {
  const s = Math.min(10, Math.max(1, Math.round(score)));
  return SCORE_TO_TIER[s] ?? 'beginner-1';
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const useSoccerStore = create<SoccerStore>()(
  persist(
    (set) => ({
      role: 'member',
      team: null,
      players: [],
      evalRequests: [],
      events: [],

      setRole: (role) => set({ role }),

      setTeam: (name, description) =>
        set((s) => ({
          team: s.team
            ? { ...s.team, name, description }
            : { id: genId(), name, description, createdAt: new Date().toISOString() },
        })),

      addPlayer: (name, score, position) =>
        set((s) => ({
          players: [
            ...s.players,
            {
              id: genId(), name, score,
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
            p.id !== playerId ? p : { ...p, score, tier: scoreToTier(score), status: 'confirmed' }
          ),
        })),

      incrementMatchCount: (playerIds) =>
        set((s) => ({
          players: s.players.map((p) =>
            playerIds.includes(p.id) ? { ...p, officialMatchCount: p.officialMatchCount + 1 } : p
          ),
        })),

      submitEvalRequest: (req) =>
        set((s) => ({
          evalRequests: [
            { ...req, id: genId(), requestedAt: new Date().toISOString(), status: 'pending' },
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
          const newScore = TIER_TO_SCORE[req.suggestedTier];
          const updatedPlayers = s.players.map((p) =>
            p.id !== req.playerId ? p
              : { ...p, score: newScore, tier: req.suggestedTier, status: 'confirmed' as const }
          );
          return { evalRequests: updatedRequests, players: updatedPlayers };
        }),

      addEvent: (title, date, location) =>
        set((s) => ({
          events: [
            { id: genId(), title, date, location, votes: [], isOpen: true, createdAt: new Date().toISOString() },
            ...s.events,
          ],
        })),

      removeEvent: (id) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      vote: (eventId, playerId, playerName, status) =>
        set((s) => ({
          events: s.events.map((e) => {
            if (e.id !== eventId) return e;
            const filtered = e.votes.filter((v) => v.playerId !== playerId);
            return { ...e, votes: [...filtered, { playerId, playerName, status, votedAt: new Date().toISOString() }] };
          }),
        })),

      closeEvent: (id) =>
        set((s) => ({
          events: s.events.map((e) => e.id === id ? { ...e, isOpen: false } : e),
        })),
    }),
    { name: 'soccer-store' }
  )
);
