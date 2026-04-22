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

  // Notifications
  notifications: AppNotification[];
  markAllRead: () => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;

  // UI state
  loading: boolean;
  initialized: boolean;
  actionLoading: string | null; // which action is running
  error: string | null;
  success: string | null;
  clearMessages: () => void;

  // Compat
  team: { id: string; name: string; description?: string; inviteCode: string; createdAt: string } | null;

  // Init
  init: () => Promise<void>;
  refresh: () => Promise<void>;

  // Role
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

// ── Mappers ──────────────────────────────────────────────────────

function mapPlayer(row: Record<string, unknown>): Player {
  return {
    id: row.id as string, name: row.name as string,
    score: row.score as number, tier: row.tier as Tier,
    status: row.status as 'measuring' | 'confirmed',
    position: row.position as string | undefined,
    officialMatchCount: (row.official_match_count as number) ?? 0,
    createdAt: row.created_at as string,
  };
}

function mapEvent(row: Record<string, unknown>): MatchEvent {
  const votes = (row.attend_votes as Record<string, unknown>[] | null) ?? [];
  return {
    id: row.id as string, title: row.title as string,
    date: row.date as string, location: row.location as string | undefined,
    totalQuarters: (row.total_quarters as number) ?? 4,
    isOpen: row.is_open as boolean, createdAt: row.created_at as string,
    votes: votes.map((v) => ({
      playerId: v.player_id as string, playerName: v.player_name as string,
      status: v.status as VoteStatus, quarters: v.quarters as number[] | undefined,
      votedAt: v.voted_at as string,
    })),
  };
}

function mapMatchRecord(row: Record<string, unknown>): MatchRecord {
  const participants = (row.match_participants as { player_id: string }[] | null) ?? [];
  const mvpVotes = (row.mvp_votes as Record<string, unknown>[] | null) ?? [];
  return {
    id: row.id as string, title: row.title as string,
    date: row.date as string, teamAName: row.team_a_name as string,
    teamBName: row.team_b_name as string, scoreA: row.score_a as number,
    scoreB: row.score_b as number, notes: row.notes as string | undefined,
    mvpOpen: row.mvp_open as boolean,
    playerIds: participants.map((p) => p.player_id),
    mvpVotes: mvpVotes.map((v) => ({
      voterId: v.voter_id as string, mvpPlayerId: v.mvp_player_id as string,
      mvpPlayerName: v.mvp_player_name as string,
    })),
  };
}

function mapEvalRequest(row: Record<string, unknown>): EvalRequest {
  return {
    id: row.id as string, playerId: row.player_id as string,
    playerName: row.player_name as string, currentTier: row.current_tier as Tier,
    suggestedTier: row.suggested_tier as Tier, reason: row.reason as string | undefined,
    status: row.status as 'pending' | 'approved' | 'rejected',
    requestedAt: row.requested_at as string,
  };
}

function mapDue(row: Record<string, unknown>): Due {
  return {
    id: row.id as string, playerId: row.player_id as string | null,
    playerName: row.player_name as string, month: row.month as string,
    amount: row.amount as number, paid: row.paid as boolean,
    paidAt: row.paid_at as string | undefined, notes: row.notes as string | undefined,
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

// ── Helper: wrap async action with error handling ─────────────────

function withError<T extends unknown[]>(
  key: string,
  fn: (...args: T) => Promise<void>,
  setFn: (updater: Partial<SupabaseStore> | ((s: SupabaseStore) => Partial<SupabaseStore>)) => void
) {
  return async (...args: T) => {
    setFn({ actionLoading: key, error: null });
    try {
      await fn(...args);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '오류가 발생했습니다';
      setFn({ error: msg });
      setTimeout(() => setFn({ error: null }), 4000);
    } finally {
      setFn({ actionLoading: null });
    }
  };
}

// ── Store ─────────────────────────────────────────────────────────

export const useSupabaseStore = create<SupabaseStore>((set, get) => {

  // Reusable data refresh helpers
  async function reloadPlayers(teamId: string) {
    const data = await db.getPlayers(teamId);
    set({ players: (data ?? []).map(mapPlayer) });
  }
  async function reloadEvents(teamId: string) {
    const data = await db.getEvents(teamId);
    set({ events: (data ?? []).map(mapEvent) });
  }
  async function reloadMatchRecords(teamId: string) {
    const data = await db.getMatchRecords(teamId);
    set({ matchRecords: (data ?? []).map(mapMatchRecord) });
  }
  async function reloadEvalRequests(teamId: string) {
    const data = await db.getEvalRequests(teamId);
    set({ evalRequests: (data ?? []).map(mapEvalRequest) });
  }
  async function reloadDues(teamId: string) {
    const data = await db.getDues(teamId);
    set({ dues: (data ?? []).map(mapDue) });
  }
  async function reloadChallenges(teamId: string) {
    const data = await db.getChallenges(teamId);
    set({ challenges: (data ?? []).map(mapChallenge) });
  }

  return {
    teamId: null, teamName: null, teamInviteCode: null,
    role: 'member', players: [], events: [], matchRecords: [],
    lineups: [], evalRequests: [], dues: [], challenges: [],
    team: null, notifications: [], loading: false, initialized: false,
    actionLoading: null, error: null, success: null,

    clearMessages: () => set({ error: null, success: null }),
    setRole: (role) => set({ role }),

    markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    addNotification: (n) => set((s) => ({
      notifications: [{ ...n, id: Date.now().toString(36), createdAt: new Date().toISOString(), read: false }, ...s.notifications],
    })),

    // ── Init ───────────────────────────────────────────────────

    init: async () => {
      set({ loading: true, error: null });
      try {
        const profile = await db.getProfile();
        if (!profile || !profile.team_id) {
          set({ loading: false, initialized: true });
          return;
        }

        const teamId = profile.team_id as string;
        const team = profile.teams as Record<string, unknown> | null;

        const [players, events, matchRecords, evalRequests, dues, challenges] = await Promise.all([
          db.getPlayers(teamId), db.getEvents(teamId), db.getMatchRecords(teamId),
          db.getEvalRequests(teamId), db.getDues(teamId), db.getChallenges(teamId),
        ]);

        const teamName = team?.name as string ?? '';
        const inviteCode = team?.invite_code as string ?? '';
        set({
          teamId, teamName, teamInviteCode: inviteCode,
          team: teamName ? { id: teamId, name: teamName, inviteCode, createdAt: team?.created_at as string ?? '' } : null,
          role: profile.role as 'admin' | 'member',
          players: (players ?? []).map(mapPlayer),
          events: (events ?? []).map(mapEvent),
          matchRecords: (matchRecords ?? []).map(mapMatchRecord),
          evalRequests: (evalRequests ?? []).map(mapEvalRequest),
          dues: (dues ?? []).map(mapDue),
          challenges: (challenges ?? []).map(mapChallenge),
          initialized: true, loading: false,
        });

        // ── Realtime subscriptions (all tables) ─────────────────
        const sb = createClient();
        sb.channel('team-realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `team_id=eq.${teamId}` },
            () => reloadPlayers(teamId))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `team_id=eq.${teamId}` },
            () => reloadEvents(teamId))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'attend_votes' },
            () => reloadEvents(teamId))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'match_records', filter: `team_id=eq.${teamId}` },
            () => reloadMatchRecords(teamId))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'mvp_votes' },
            () => reloadMatchRecords(teamId))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'dues', filter: `team_id=eq.${teamId}` },
            () => reloadDues(teamId))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'team_challenges' },
            async () => {
              const prev = get().challenges;
              await reloadChallenges(teamId);
              const next = get().challenges;
              // Notify on new incoming pending challenge
              const newIncoming = next.filter(c =>
                c.targetTeamId === teamId &&
                c.status === 'pending' &&
                !prev.find(p => p.id === c.id)
              );
              newIncoming.forEach(c => {
                get().addNotification({
                  type: 'event',
                  title: '경기 신청 도착',
                  message: `${c.requesterTeamName}에서 경기를 신청했습니다`,
                  link: '/challenge',
                });
              });
            })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'eval_requests', filter: `team_id=eq.${teamId}` },
            () => reloadEvalRequests(teamId))
          .subscribe();

      } catch (e) {
        const msg = e instanceof Error ? e.message : '초기화 중 오류가 발생했습니다';
        set({ loading: false, initialized: true, error: msg });
      }
    },

    refresh: async () => {
      const { teamId } = get();
      if (!teamId) return;
      await Promise.all([
        reloadPlayers(teamId), reloadEvents(teamId), reloadMatchRecords(teamId),
        reloadEvalRequests(teamId), reloadDues(teamId), reloadChallenges(teamId),
      ]);
    },

    // ── Team ──────────────────────────────────────────────────

    setTeam: async (name, description) => {
      const { teamId, teamInviteCode } = get();
      if (!teamId) return;
      set({ actionLoading: 'setTeam' });
      try {
        await db.updateTeam(teamId, name, description);
        set({ teamName: name, team: { id: teamId, name, description, inviteCode: teamInviteCode ?? '', createdAt: '' }, success: '팀 정보가 저장되었습니다' });
        setTimeout(() => set({ success: null }), 3000);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '저장 실패' });
        setTimeout(() => set({ error: null }), 4000);
      } finally {
        set({ actionLoading: null });
      }
    },

    // ── Players ───────────────────────────────────────────────

    addPlayer: async (name, score, position) => {
      const { teamId } = get();
      if (!teamId) return;
      set({ actionLoading: 'addPlayer' });
      try {
        await db.addPlayer(teamId, name, score, position);
        await reloadPlayers(teamId);
        set({ success: `${name} 선수가 추가되었습니다` });
        setTimeout(() => set({ success: null }), 3000);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '선수 추가 실패' });
        setTimeout(() => set({ error: null }), 4000);
      } finally {
        set({ actionLoading: null });
      }
    },

    updatePlayer: async (id, updates) => {
      set({ actionLoading: 'updatePlayer' });
      try {
        await db.updatePlayer(id, updates);
        const { teamId } = get();
        if (teamId) await reloadPlayers(teamId);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '수정 실패' });
        setTimeout(() => set({ error: null }), 4000);
      } finally {
        set({ actionLoading: null });
      }
    },

    removePlayer: async (id) => {
      set((s) => ({ players: s.players.filter((p) => p.id !== id) })); // optimistic
      try {
        await db.removePlayer(id);
      } catch (e) {
        const { teamId } = get();
        if (teamId) await reloadPlayers(teamId); // revert
        set({ error: e instanceof Error ? e.message : '삭제 실패' });
        setTimeout(() => set({ error: null }), 4000);
      }
    },

    confirmTier: async (playerId, score) => {
      set({ actionLoading: 'confirmTier' });
      try {
        await db.confirmTier(playerId, score);
        const { teamId } = get();
        if (teamId) await reloadPlayers(teamId);
        set({ success: '티어가 확정되었습니다' });
        setTimeout(() => set({ success: null }), 3000);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '확정 실패' });
        setTimeout(() => set({ error: null }), 4000);
      } finally {
        set({ actionLoading: null });
      }
    },

    incrementMatchCount: async (playerIds) => {
      try {
        await db.incrementMatchCount(playerIds);
      } catch {
        // Non-critical, silently fail
      }
    },

    // ── Events ────────────────────────────────────────────────

    addEvent: async (title, date, location, totalQuarters = 4) => {
      const { teamId } = get();
      if (!teamId) return;
      set({ actionLoading: 'addEvent' });
      try {
        await db.addEvent(teamId, title, date, location, totalQuarters);
        await reloadEvents(teamId);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '일정 등록 실패' });
        setTimeout(() => set({ error: null }), 4000);
      } finally {
        set({ actionLoading: null });
      }
    },

    removeEvent: async (id) => {
      set((s) => ({ events: s.events.filter((e) => e.id !== id) })); // optimistic
      try {
        await db.removeEvent(id);
      } catch (e) {
        const { teamId } = get();
        if (teamId) await reloadEvents(teamId);
        set({ error: e instanceof Error ? e.message : '삭제 실패' });
        setTimeout(() => set({ error: null }), 4000);
      }
    },

    vote: async (eventId, playerId, playerName, status, quarters) => {
      // Optimistic update
      set((s) => ({
        events: s.events.map((e) => {
          if (e.id !== eventId) return e;
          const filtered = e.votes.filter(v => v.playerId !== playerId);
          return { ...e, votes: [...filtered, { playerId, playerName, status, quarters, votedAt: new Date().toISOString() }] };
        }),
      }));
      try {
        await db.voteAttend(eventId, playerId, playerName, status, quarters);
      } catch (e) {
        const { teamId } = get();
        if (teamId) await reloadEvents(teamId); // revert
        set({ error: e instanceof Error ? e.message : '투표 실패' });
        setTimeout(() => set({ error: null }), 4000);
      }
    },

    closeEvent: async (id) => {
      set((s) => ({ events: s.events.map((e) => e.id === id ? { ...e, isOpen: false } : e) }));
      try {
        await db.closeEvent(id);
      } catch (e) {
        const { teamId } = get();
        if (teamId) await reloadEvents(teamId);
        set({ error: e instanceof Error ? e.message : '마감 실패' });
        setTimeout(() => set({ error: null }), 4000);
      }
    },

    // ── Lineups ───────────────────────────────────────────────

    saveLineup: async (eventId, formationId, slots, notes) => {
      set({ actionLoading: 'saveLineup' });
      try {
        await db.saveLineup(eventId, formationId, slots, notes);
        set({ success: '라인업이 저장되었습니다' });
        setTimeout(() => set({ success: null }), 3000);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '저장 실패' });
        setTimeout(() => set({ error: null }), 4000);
      } finally {
        set({ actionLoading: null });
      }
    },

    publishLineup: async (eventId) => {
      set({ actionLoading: 'publishLineup' });
      try {
        await db.publishLineup(eventId);
        get().addNotification({ type: 'lineup', title: '라인업 공개', message: '라인업이 공개되었습니다', link: `/lineup/${eventId}` });
        set({ success: '라인업이 공개되었습니다' });
        setTimeout(() => set({ success: null }), 3000);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '공개 실패' });
        setTimeout(() => set({ error: null }), 4000);
      } finally {
        set({ actionLoading: null });
      }
    },

    // ── Match records ─────────────────────────────────────────

    addMatchRecord: async (record) => {
      const { teamId } = get();
      if (!teamId) return;
      set({ actionLoading: 'addMatchRecord' });
      try {
        await db.addMatchRecord(teamId, record);
        await Promise.all([
          db.incrementMatchCount(record.playerIds).catch(() => {}),
          reloadMatchRecords(teamId),
        ]);
        set({ success: '경기 기록이 저장되었습니다' });
        setTimeout(() => set({ success: null }), 3000);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '저장 실패' });
        setTimeout(() => set({ error: null }), 4000);
      } finally {
        set({ actionLoading: null });
      }
    },

    removeMatchRecord: async (id) => {
      set((s) => ({ matchRecords: s.matchRecords.filter((m) => m.id !== id) }));
      try {
        await db.removeMatchRecord(id);
      } catch (e) {
        const { teamId } = get();
        if (teamId) await reloadMatchRecords(teamId);
        set({ error: e instanceof Error ? e.message : '삭제 실패' });
        setTimeout(() => set({ error: null }), 4000);
      }
    },

    voteForMvp: async (matchId, voterId, mvpPlayerId, mvpPlayerName) => {
      set({ actionLoading: 'voteForMvp' });
      try {
        await db.voteForMvp(matchId, voterId, mvpPlayerId, mvpPlayerName);
        const { teamId } = get();
        if (teamId) await reloadMatchRecords(teamId);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : 'MVP 투표 실패' });
        setTimeout(() => set({ error: null }), 4000);
      } finally {
        set({ actionLoading: null });
      }
    },

    closeMvpVoting: async (matchId) => {
      set((s) => ({ matchRecords: s.matchRecords.map((m) => m.id === matchId ? { ...m, mvpOpen: false } : m) }));
      try {
        await db.closeMvpVoting(matchId);
      } catch (e) {
        const { teamId } = get();
        if (teamId) await reloadMatchRecords(teamId);
        set({ error: e instanceof Error ? e.message : '마감 실패' });
        setTimeout(() => set({ error: null }), 4000);
      }
    },

    // ── Eval ─────────────────────────────────────────────────

    submitEvalRequest: async (req) => {
      const { teamId } = get();
      if (!teamId) return;
      set({ actionLoading: 'submitEvalRequest' });
      try {
        await db.submitEvalRequest(teamId, req);
        await reloadEvalRequests(teamId);
        set({ success: '평가 요청이 제출되었습니다' });
        setTimeout(() => set({ success: null }), 3000);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '제출 실패' });
        setTimeout(() => set({ error: null }), 4000);
      } finally {
        set({ actionLoading: null });
      }
    },

    resolveEvalRequest: async (reqId, approved) => {
      set({ actionLoading: 'resolveEvalRequest' });
      try {
        await db.resolveEvalRequest(reqId, approved);
        const { teamId } = get();
        if (teamId) await reloadEvalRequests(teamId);
        set({ success: approved ? '승인되었습니다' : '거절되었습니다' });
        setTimeout(() => set({ success: null }), 3000);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '처리 실패' });
        setTimeout(() => set({ error: null }), 4000);
      } finally {
        set({ actionLoading: null });
      }
    },

    // ── Dues ─────────────────────────────────────────────────

    addDue: async (playerId, playerName, month, amount) => {
      const { teamId } = get();
      if (!teamId) return;
      set({ actionLoading: 'addDue' });
      try {
        await db.addDue(teamId, playerId, playerName, month, amount);
        await reloadDues(teamId);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '추가 실패' });
        setTimeout(() => set({ error: null }), 4000);
      } finally {
        set({ actionLoading: null });
      }
    },

    markDuePaid: async (dueId, paid) => {
      // Optimistic
      set((s) => ({ dues: s.dues.map((d) => d.id === dueId ? { ...d, paid, paidAt: paid ? new Date().toISOString() : undefined } : d) }));
      try {
        await db.markDuePaid(dueId, paid);
      } catch (e) {
        const { teamId } = get();
        if (teamId) await reloadDues(teamId);
        set({ error: e instanceof Error ? e.message : '처리 실패' });
        setTimeout(() => set({ error: null }), 4000);
      }
    },

    removeDue: async (dueId) => {
      set((s) => ({ dues: s.dues.filter((d) => d.id !== dueId) }));
      try {
        await db.removeDue(dueId);
      } catch (e) {
        const { teamId } = get();
        if (teamId) await reloadDues(teamId);
        set({ error: e instanceof Error ? e.message : '삭제 실패' });
        setTimeout(() => set({ error: null }), 4000);
      }
    },

    initMonthlyDues: async (month, amount) => {
      const { teamId, players } = get();
      if (!teamId) return;
      set({ actionLoading: 'initMonthlyDues' });
      try {
        await db.initMonthlyDues(teamId, month, amount, players.map((p) => ({ id: p.id, name: p.name })));
        await reloadDues(teamId);
        set({ success: '회비가 일괄 등록되었습니다' });
        setTimeout(() => set({ success: null }), 3000);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '등록 실패' });
        setTimeout(() => set({ error: null }), 4000);
      } finally {
        set({ actionLoading: null });
      }
    },

    // ── Team Challenges ───────────────────────────────────────

    searchTeams: async (query) => {
      try {
        const data = await db.searchTeams(query);
        return (data ?? []).map((r) => ({ id: r.id as string, name: r.name as string, createdAt: r.created_at as string }));
      } catch {
        return [];
      }
    },

    sendChallenge: async (targetTeamId, targetTeamName, proposedDate, location, message) => {
      const { teamId, teamName } = get();
      if (!teamId || !teamName) return;
      set({ actionLoading: 'sendChallenge' });
      try {
        await db.sendChallenge(teamId, teamName, targetTeamId, targetTeamName, proposedDate, location, message);
        await reloadChallenges(teamId);
        set({ success: `${targetTeamName}에 경기 신청을 보냈습니다` });
        setTimeout(() => set({ success: null }), 3000);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '신청 실패' });
        setTimeout(() => set({ error: null }), 4000);
      } finally {
        set({ actionLoading: null });
      }
    },

    respondChallenge: async (challengeId, status) => {
      set({ actionLoading: 'respondChallenge' });
      try {
        await db.respondChallenge(challengeId, status);

        // 수락 시 → 일정 자동 생성
        if (status === 'accepted') {
          const { teamId, challenges } = get();
          const challenge = challenges.find(c => c.id === challengeId);
          if (challenge && teamId) {
            const title = `${challenge.requesterTeamName} vs ${challenge.targetTeamName}`;
            const date = challenge.proposedDate
              ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
            await db.addEvent(teamId, title, date, challenge.location ?? undefined);
            await reloadEvents(teamId);
            get().addNotification({
              type: 'event',
              title: '경기 일정 생성됨',
              message: `${title} 일정이 출석 탭에 추가되었습니다`,
              link: '/attend',
            });
          }
        }

        const { teamId } = get();
        if (teamId) await reloadChallenges(teamId);
        set({ success: status === 'accepted' ? '수락했습니다. 출석 탭에 일정이 추가되었습니다' : '거절했습니다' });
        setTimeout(() => set({ success: null }), 4000);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '처리 실패' });
        setTimeout(() => set({ error: null }), 4000);
      } finally {
        set({ actionLoading: null });
      }
    },
  };
});

export const useSoccerStore = useSupabaseStore;
