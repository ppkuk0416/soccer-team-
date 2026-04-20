import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Player, EvalRequest, Tier, UserRole, SoccerTeam,
  MatchEvent, VoteStatus, SCORE_TO_TIER, TIER_TO_SCORE,
  Lineup, LineupSlot, MatchRecord, MvpVote, AppNotification,
} from '../types';

interface SoccerStore {
  role: UserRole;
  team: SoccerTeam | null;
  players: Player[];
  evalRequests: EvalRequest[];
  events: MatchEvent[];
  lineups: Lineup[];
  matchRecords: MatchRecord[];
  notifications: AppNotification[];

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
  saveLineup: (eventId: string, formationId: string, slots: LineupSlot[], notes?: string) => void;
  publishLineup: (eventId: string) => void;
  addMatchRecord: (record: Omit<MatchRecord, 'id' | 'mvpVotes' | 'mvpOpen'>) => void;
  removeMatchRecord: (id: string) => void;
  voteForMvp: (matchId: string, voterId: string, mvpPlayerId: string, mvpPlayerName: string) => void;
  closeMvpVoting: (matchId: string) => void;
  markAllRead: () => void;
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
    (set, get) => ({
      role: 'member',
      team: null,
      players: [],
      evalRequests: [],
      events: [],
      lineups: [],
      matchRecords: [],
      notifications: [],

      setRole: (role) => set({ role }),
      setTeam: (name, description) =>
        set((s) => ({
          team: s.team
            ? { ...s.team, name, description }
            : { id: genId(), name, description, createdAt: new Date().toISOString() },
        })),
      addPlayer: (name, score, position) =>
        set((s) => ({
          players: [...s.players, { id: genId(), name, score, tier: scoreToTier(score), status: 'measuring', officialMatchCount: 0, position, createdAt: new Date().toISOString() }],
        })),
      updatePlayer: (id, updates) =>
        set((s) => ({
          players: s.players.map((p) => p.id !== id ? p : { ...p, ...updates, tier: scoreToTier(updates.score ?? p.score) }),
        })),
      removePlayer: (id) => set((s) => ({ players: s.players.filter((p) => p.id !== id) })),
      confirmTier: (playerId, score) =>
        set((s) => ({
          players: s.players.map((p) => p.id !== playerId ? p : { ...p, score, tier: scoreToTier(score), status: 'confirmed' }),
        })),
      incrementMatchCount: (playerIds) =>
        set((s) => ({
          players: s.players.map((p) => playerIds.includes(p.id) ? { ...p, officialMatchCount: p.officialMatchCount + 1 } : p),
        })),
      submitEvalRequest: (req) =>
        set((s) => ({
          evalRequests: [{ ...req, id: genId(), requestedAt: new Date().toISOString(), status: 'pending' }, ...s.evalRequests],
        })),
      resolveEvalRequest: (reqId, approved) =>
        set((s) => {
          const req = s.evalRequests.find((r) => r.id === reqId);
          if (!req) return s;
          const updated = s.evalRequests.map((r) => r.id === reqId ? { ...r, status: approved ? 'approved' : 'rejected' } as EvalRequest : r);
          if (!approved) return { evalRequests: updated };
          const newScore = TIER_TO_SCORE[req.suggestedTier];
          return { evalRequests: updated, players: s.players.map((p) => p.id !== req.playerId ? p : { ...p, score: newScore, tier: req.suggestedTier, status: 'confirmed' as const }) };
        }),
      addEvent: (title, date, location) =>
        set((s) => ({
          events: [{ id: genId(), title, date, location, votes: [], isOpen: true, createdAt: new Date().toISOString() }, ...s.events],
          notifications: [{ id: genId(), type: 'event', title: '새 경기 일정', message: `${title} 일정이 등록됐습니다. 출석 투표해주세요!`, createdAt: new Date().toISOString(), read: false, link: 'attend' }, ...s.notifications],
        })),
      removeEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
      vote: (eventId, playerId, playerName, status) =>
        set((s) => ({
          events: s.events.map((e) => {
            if (e.id !== eventId) return e;
            const filtered = e.votes.filter((v) => v.playerId !== playerId);
            return { ...e, votes: [...filtered, { playerId, playerName, status, votedAt: new Date().toISOString() }] };
          }),
        })),
      closeEvent: (id) => set((s) => ({ events: s.events.map((e) => e.id === id ? { ...e, isOpen: false } : e) })),
      saveLineup: (eventId, formationId, slots, notes) =>
        set((s) => {
          const existing = s.lineups.find((l) => l.eventId === eventId);
          if (existing) return { lineups: s.lineups.map((l) => l.eventId === eventId ? { ...l, formationId, slots, notes } : l) };
          return { lineups: [...s.lineups, { id: genId(), eventId, formationId, slots, isPublished: false, notes, createdAt: new Date().toISOString() }] };
        }),
      publishLineup: (eventId) =>
        set((s) => {
          const event = s.events.find((e) => e.id === eventId);
          return {
            lineups: s.lineups.map((l) => l.eventId === eventId ? { ...l, isPublished: true } : l),
            notifications: [{ id: genId(), type: 'lineup', title: '라인업 공개', message: `${event?.title ?? '경기'} 라인업이 공개됐습니다!`, createdAt: new Date().toISOString(), read: false, link: `lineup/${eventId}` }, ...s.notifications],
          };
        }),
      addMatchRecord: (record) =>
        set((s) => ({
          matchRecords: [{ ...record, id: genId(), mvpVotes: [], mvpOpen: true }, ...s.matchRecords],
          notifications: [{ id: genId(), type: 'mvp', title: 'MVP 투표 시작', message: `${record.title} MVP를 선정해주세요!`, createdAt: new Date().toISOString(), read: false, link: 'matches' }, ...s.notifications],
        })),
      removeMatchRecord: (id) => set((s) => ({ matchRecords: s.matchRecords.filter((m) => m.id !== id) })),
      voteForMvp: (matchId, voterId, mvpPlayerId, mvpPlayerName) =>
        set((s) => ({
          matchRecords: s.matchRecords.map((m) => {
            if (m.id !== matchId) return m;
            const filtered = m.mvpVotes.filter((v) => v.voterId !== voterId);
            return { ...m, mvpVotes: [...filtered, { voterId, mvpPlayerId, mvpPlayerName }] };
          }),
        })),
      closeMvpVoting: (matchId) => set((s) => ({ matchRecords: s.matchRecords.map((m) => m.id === matchId ? { ...m, mvpOpen: false } : m) })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    }),
    {
      name: 'soccer-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
