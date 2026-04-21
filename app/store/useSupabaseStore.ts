'use client';
import { create } from 'zustand';
import { createClient } from '../lib/supabase';
import * as db from '../lib/db';
import { Player, MatchEvent, MatchRecord, Lineup, EvalRequest, Tier, VoteStatus, LineupSlot, AppNotification, Due, TeamChallenge } from '../types';

interface SupabaseStore {
  // Data
  teamId: string | null;
  teamName: string | null;
  teamInviteCode: string | null;
  role: 'admin' | 'member';
  players: Player[];
  events: MatchEvent[];
  matchRecords: MatchRecord[];
  lineups: Lineup[];
  evalRequests: EvalRequest[];
  dues: Due[];
  challenges: TeamChallenge[];

  // Notifications (local only for now)
  notifications: AppNotification[];
  markAllRead: () => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;

  // State
  loading: boolean;
  initialized: boolean;

  // Compat: team object for existing pages
  team: { id: string; name: string; description?: string; inviteCode: string; createdAt: string } | null;

  // Init
  init: () => Promise<void>;
  refresh: () => Promise<void>;

  // Role (local override for dev; in prod comes from profile)
  setRole: (role: 'admin' | 'member') => void;

  // Team
  setTeam: (name: string, description?: string) => Promise<void>;

  // Players
  addPlayer: (name: string, score: number, position?: string) => Promise<void>;
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<void>;
  removePlayer: (id: string) => Promise<void>;
  confirmTier: (playerId: string, score: number) => Promise<void>;
  incrementMatchCount: (playerIds: string[]) => Promise<void>;

  // Events
  addEvent: (title: string, date: string, location?: string, totalQuarters?: number) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  vote: (eventId: string, playerId: string, playerName: string, status: VoteStatus, quarters?: number[]) => Promise<void>;
  closeEvent: (id: string) => Promise<void>;

  // Lineups
  saveLineup: (eventId: string, formationId: string, slots: LineupSlot[], notes?: string) => Promise<void>;
  publishLineup: (eventId: string) => Promise<void>;

  // Match records
  addMatchRecord: (record: { title: string; date: string; teamAName: string; teamBName: string; scoreA: number; scoreB: number; playerIds: string[]; notes?: string }) => Promise<void>;
  removeMatchRecord: (id: string) => Promise<void>;
  voteForMvp: (matchId: string, voterId: string, mvpPlayerId: string, mvpPlayerName: string) => Promise<void>;
  closeMvpVoting: (matchId: string) => Promise<void>;

  // Eval
  submitEvalRequest: (req: { playerId: string; playerName: string; currentTier: Tier; suggestedTier: Tier; reason?: string }) => Promise<void>;
  resolveEvalRequest: (reqId: string, approved: boolean) => Promise<void>;

  // Dues
  addDue: (playerId: string | null, playerName: string, month: string, amount: number) => Promise<void>;
  markDuePaid: (dueId: string, paid: boolean) => Promise<void>;
  removeDue: (dueId: string) => Promise<void>;
  initMonthlyDues: (month: string, amount: number) => Promise<void>;

  // Team Challenges
  searchTeams: (query: string) => Promise<{ id: string; name: string; createdAt: string }[]>;
  sendChallenge: (targetTeamId: string, targetTeamName: string, proposedDate?: string, location?: string, message?: string) => Promise<void>;
  respondChallenge: (challengeId: string, status: 'accepted' | 'rejected') => Promise<void>;
}

function mapPlayer(row: Record<string, unknown>): Player {
  return {
    id: row.id as string,
    name: row.name as string,
    score: row.score as number,
    tier: row.tier as Tier,
    status: row.status as 'measuring' | 'confirmed',
    position: row.position as string | undefined,
    officialMatchCount: (row.official_match_count as number) ?? 0,
    createdAt: row.created_at as string,
  };
}

function mapEvent(row: Record<string, unknown>): MatchEvent {
  const votes = (row.attend_votes as Record<string, unknown>[] | null) ?? [];
  return {
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    location: row.location as string | undefined,
    totalQuarters: (row.total_quarters as number) ?? 4,
    isOpen: row.is_open as boolean,
    createdAt: row.created_at as string,
    votes: votes.map((v) => ({
      playerId: v.player_id as string,
      playerName: v.player_name as string,
      status: v.status as VoteStatus,
      quarters: v.quarters as number[] | undefined,
      votedAt: v.voted_at as string,
    })),
  };
}

function mapMatchRecord(row: Record<string, unknown>): MatchRecord {
  const participants = (row.match_participants as { player_id: string }[] | null) ?? [];
  const mvpVotes = (row.mvp_votes as Record<string, unknown>[] | null) ?? [];
  return {
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    teamAName: row.team_a_name as string,
    teamBName: row.team_b_name as string,
    scoreA: row.score_a as number,
    scoreB: row.score_b as number,
    notes: row.notes as string | undefined,
    mvpOpen: row.mvp_open as boolean,
    playerIds: participants.map((p) => p.player_id),
    mvpVotes: mvpVotes.map((v) => ({
      voterId: v.voter_id as string,
      mvpPlayerId: v.mvp_player_id as string,
      mvpPlayerName: v.mvp_player_name as string,
    })),
  };
}

function mapEvalRequest(row: Record<string, unknown>): EvalRequest {
  return {
    id: row.id as string,
    playerId: row.player_id as string,
    playerName: row.player_name as string,
    currentTier: row.current_tier as Tier,
    suggestedTier: row.suggested_tier as Tier,
    reason: row.reason as string | undefined,
    status: row.status as 'pending' | 'approved' | 'rejected',
    requestedAt: row.requested_at as string,
  };
}

function mapDue(row: Record<string, unknown>): Due {
  return {
    id: row.id as string,
    playerId: row.player_id as string | null,
    playerName: row.player_name as string,
    month: row.month as string,
    amount: row.amount as number,
    paid: row.paid as boolean,
    paidAt: row.paid_at as string | undefined,
    notes: row.notes as string | undefined,
  };
}

function mapChallenge(row: Record<string, unknown>): TeamChallenge {
  return {
    id: row.id as string,
    requesterTeamId: row.requester_team_id as string,
    requesterTeamName: row.requester_team_name as string,
    targetTeamId: row.target_team_id as string,
    targetTeamName: row.target_team_name as string,
    proposedDate: row.proposed_date as string | undefined,
    location: row.location as string | undefined,
    message: row.message as string | undefined,
    status: row.status as 'pending' | 'accepted' | 'rejected',
    createdAt: row.created_at as string,
  };
}

export const useSupabaseStore = create<SupabaseStore>((set, get) => ({
  teamId: null,
  teamName: null,
  teamInviteCode: null,
  role: 'member',
  players: [],
  events: [],
  matchRecords: [],
  lineups: [],
  evalRequests: [],
  dues: [],
  challenges: [],
  team: null,
  notifications: [],
  loading: false,
  initialized: false,

  setRole: (role) => set({ role }),

  markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  addNotification: (n) => set((s) => ({
    notifications: [{ ...n, id: Date.now().toString(36), createdAt: new Date().toISOString(), read: false }, ...s.notifications],
  })),

  init: async () => {
    set({ loading: true });
    try {
      const profile = await db.getProfile();
      if (!profile || !profile.team_id) { set({ loading: false, initialized: true }); return; }

      const teamId = profile.team_id as string;
      const team = profile.teams as Record<string, unknown> | null;

      const [players, events, matchRecords, evalRequests, dues, challenges] = await Promise.all([
        db.getPlayers(teamId),
        db.getEvents(teamId),
        db.getMatchRecords(teamId),
        db.getEvalRequests(teamId),
        db.getDues(teamId),
        db.getChallenges(teamId),
      ]);

      const teamName = team?.name as string ?? '';
      const inviteCode = team?.invite_code as string ?? '';
      set({
        teamId,
        teamName,
        teamInviteCode: inviteCode,
        team: teamName ? { id: teamId, name: teamName, inviteCode, createdAt: team?.created_at as string ?? '' } : null,
        role: profile.role as 'admin' | 'member',
        players: (players ?? []).map(mapPlayer),
        events: (events ?? []).map(mapEvent),
        matchRecords: (matchRecords ?? []).map(mapMatchRecord),
        evalRequests: (evalRequests ?? []).map(mapEvalRequest),
        dues: (dues ?? []).map(mapDue),
        challenges: (challenges ?? []).map(mapChallenge),
        initialized: true,
        loading: false,
      });

      // Realtime subscriptions
      const sb = createClient();
      sb.channel('team-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `team_id=eq.${teamId}` },
          async () => { const data = await db.getPlayers(teamId); set({ players: (data ?? []).map(mapPlayer) }); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attend_votes' },
          async () => { const data = await db.getEvents(teamId); set({ events: (data ?? []).map(mapEvent) }); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'mvp_votes' },
          async () => { const data = await db.getMatchRecords(teamId); set({ matchRecords: (data ?? []).map(mapMatchRecord) }); })
        .subscribe();
    } catch {
      set({ loading: false, initialized: true });
    }
  },

  refresh: async () => {
    const { teamId } = get();
    if (!teamId) return;
    const [players, events, matchRecords, evalRequests, dues, challenges] = await Promise.all([
      db.getPlayers(teamId), db.getEvents(teamId), db.getMatchRecords(teamId), db.getEvalRequests(teamId),
      db.getDues(teamId), db.getChallenges(teamId),
    ]);
    set({
      players: (players ?? []).map(mapPlayer),
      events: (events ?? []).map(mapEvent),
      matchRecords: (matchRecords ?? []).map(mapMatchRecord),
      evalRequests: (evalRequests ?? []).map(mapEvalRequest),
      dues: (dues ?? []).map(mapDue),
      challenges: (challenges ?? []).map(mapChallenge),
    });
  },

  setTeam: async (name, description) => {
    const { teamId, teamInviteCode } = get();
    if (!teamId) return;
    await db.updateTeam(teamId, name, description);
    set({ teamName: name, team: { id: teamId, name, description, inviteCode: teamInviteCode ?? '', createdAt: '' } });
  },

  addPlayer: async (name, score, position) => {
    const { teamId } = get();
    if (!teamId) return;
    await db.addPlayer(teamId, name, score, position);
    const data = await db.getPlayers(teamId);
    set({ players: (data ?? []).map(mapPlayer) });
  },

  updatePlayer: async (id, updates) => {
    await db.updatePlayer(id, updates);
    const { teamId } = get();
    if (!teamId) return;
    const data = await db.getPlayers(teamId);
    set({ players: (data ?? []).map(mapPlayer) });
  },

  removePlayer: async (id) => {
    await db.removePlayer(id);
    set((s) => ({ players: s.players.filter((p) => p.id !== id) }));
  },

  confirmTier: async (playerId, score) => {
    await db.confirmTier(playerId, score);
    const { teamId } = get();
    if (!teamId) return;
    const data = await db.getPlayers(teamId);
    set({ players: (data ?? []).map(mapPlayer) });
  },

  incrementMatchCount: async (playerIds) => {
    await db.incrementMatchCount(playerIds);
  },

  addEvent: async (title, date, location, totalQuarters = 4) => {
    const { teamId } = get();
    if (!teamId) return;
    await db.addEvent(teamId, title, date, location, totalQuarters);
    const data = await db.getEvents(teamId);
    set({ events: (data ?? []).map(mapEvent) });
  },

  removeEvent: async (id) => {
    await db.removeEvent(id);
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },

  vote: async (eventId, playerId, playerName, status, quarters) => {
    await db.voteAttend(eventId, playerId, playerName, status, quarters);
    const { teamId } = get();
    if (!teamId) return;
    const data = await db.getEvents(teamId);
    set({ events: (data ?? []).map(mapEvent) });
  },

  closeEvent: async (id) => {
    await db.closeEvent(id);
    set((s) => ({ events: s.events.map((e) => e.id === id ? { ...e, isOpen: false } : e) }));
  },

  saveLineup: async (eventId, formationId, slots, notes) => {
    await db.saveLineup(eventId, formationId, slots, notes);
  },

  publishLineup: async (eventId) => {
    await db.publishLineup(eventId);
  },

  addMatchRecord: async (record) => {
    const { teamId } = get();
    if (!teamId) return;
    await db.addMatchRecord(teamId, record);
    await db.incrementMatchCount(record.playerIds);
    const data = await db.getMatchRecords(teamId);
    set({ matchRecords: (data ?? []).map(mapMatchRecord) });
  },

  removeMatchRecord: async (id) => {
    await db.removeMatchRecord(id);
    set((s) => ({ matchRecords: s.matchRecords.filter((m) => m.id !== id) }));
  },

  voteForMvp: async (matchId, voterId, mvpPlayerId, mvpPlayerName) => {
    await db.voteForMvp(matchId, voterId, mvpPlayerId, mvpPlayerName);
    const { teamId } = get();
    if (!teamId) return;
    const data = await db.getMatchRecords(teamId);
    set({ matchRecords: (data ?? []).map(mapMatchRecord) });
  },

  closeMvpVoting: async (matchId) => {
    await db.closeMvpVoting(matchId);
    set((s) => ({ matchRecords: s.matchRecords.map((m) => m.id === matchId ? { ...m, mvpOpen: false } : m) }));
  },

  submitEvalRequest: async (req) => {
    const { teamId } = get();
    if (!teamId) return;
    await db.submitEvalRequest(teamId, req);
    const data = await db.getEvalRequests(teamId);
    set({ evalRequests: (data ?? []).map(mapEvalRequest) });
  },

  resolveEvalRequest: async (reqId, approved) => {
    await db.resolveEvalRequest(reqId, approved);
    const { teamId } = get();
    if (!teamId) return;
    const data = await db.getEvalRequests(teamId);
    set({ evalRequests: (data ?? []).map(mapEvalRequest) });
  },

  addDue: async (playerId, playerName, month, amount) => {
    const { teamId } = get();
    if (!teamId) return;
    await db.addDue(teamId, playerId, playerName, month, amount);
    const data = await db.getDues(teamId);
    set({ dues: (data ?? []).map(mapDue) });
  },

  markDuePaid: async (dueId, paid) => {
    await db.markDuePaid(dueId, paid);
    set((s) => ({ dues: s.dues.map((d) => d.id === dueId ? { ...d, paid, paidAt: paid ? new Date().toISOString() : undefined } : d) }));
  },

  removeDue: async (dueId) => {
    await db.removeDue(dueId);
    set((s) => ({ dues: s.dues.filter((d) => d.id !== dueId) }));
  },

  initMonthlyDues: async (month, amount) => {
    const { teamId, players } = get();
    if (!teamId) return;
    await db.initMonthlyDues(teamId, month, amount, players.map((p) => ({ id: p.id, name: p.name })));
    const data = await db.getDues(teamId);
    set({ dues: (data ?? []).map(mapDue) });
  },

  searchTeams: async (query) => {
    const data = await db.searchTeams(query);
    return (data ?? []).map((r) => ({ id: r.id as string, name: r.name as string, createdAt: r.created_at as string }));
  },

  sendChallenge: async (targetTeamId, targetTeamName, proposedDate, location, message) => {
    const { teamId, teamName } = get();
    if (!teamId || !teamName) return;
    await db.sendChallenge(teamId, teamName, targetTeamId, targetTeamName, proposedDate, location, message);
    const data = await db.getChallenges(teamId);
    set({ challenges: (data ?? []).map(mapChallenge) });
  },

  respondChallenge: async (challengeId, status) => {
    await db.respondChallenge(challengeId, status);
    set((s) => ({ challenges: s.challenges.map((c) => c.id === challengeId ? { ...c, status } : c) }));
  },
}));

// Alias for backward compatibility with existing page components
export const useSoccerStore = useSupabaseStore;
