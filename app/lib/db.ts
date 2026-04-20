'use client';
import { createClient } from './supabase';
import { Player, MatchEvent, MatchRecord, Lineup, LineupSlot, EvalRequest, AppNotification, Tier, VoteStatus } from '../types';

// ── Auth ────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, inviteCode: string) {
  const sb = createClient();
  const { data: team, error: teamErr } = await sb
    .from('teams')
    .select('id')
    .eq('invite_code', inviteCode.toUpperCase())
    .single();
  if (teamErr || !team) throw new Error('유효하지 않은 초대코드입니다');

  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;

  if (data.user) {
    await sb.from('profiles').upsert({ id: data.user.id, team_id: team.id, role: 'member' });
  }
  return data;
}

export async function signIn(email: string, password: string) {
  const sb = createClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const sb = createClient();
  await sb.auth.signOut();
}

export async function getProfile() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from('profiles').select('*, teams(*)').eq('id', user.id).single();
  return data;
}

// ── Team ────────────────────────────────────────────────────────

export async function createTeam(name: string, description?: string) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const { data: team, error } = await sb
    .from('teams')
    .insert({ name, description })
    .select()
    .single();
  if (error) throw error;

  await sb.from('profiles').upsert({ id: user.id, team_id: team.id, role: 'admin' });
  return team;
}

export async function updateTeam(teamId: string, name: string, description?: string) {
  const sb = createClient();
  const { error } = await sb.from('teams').update({ name, description }).eq('id', teamId);
  if (error) throw error;
}

// ── Players ─────────────────────────────────────────────────────

export async function getPlayers(teamId: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('score', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addPlayer(teamId: string, name: string, score: number, position?: string) {
  const sb = createClient();
  const tier = scoreToTier(score);
  const { data, error } = await sb
    .from('players')
    .insert({ team_id: teamId, name, score, tier, status: 'measuring', position, official_match_count: 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlayer(playerId: string, updates: { name?: string; score?: number; tier?: Tier; status?: string; position?: string }) {
  const sb = createClient();
  const payload: Record<string, unknown> = { ...updates };
  if (updates.score !== undefined) payload.tier = scoreToTier(updates.score);
  const { error } = await sb.from('players').update(payload).eq('id', playerId);
  if (error) throw error;
}

export async function removePlayer(playerId: string) {
  const sb = createClient();
  const { error } = await sb.from('players').delete().eq('id', playerId);
  if (error) throw error;
}

export async function confirmTier(playerId: string, score: number) {
  const sb = createClient();
  const { error } = await sb.from('players').update({ score, tier: scoreToTier(score), status: 'confirmed' }).eq('id', playerId);
  if (error) throw error;
}

export async function incrementMatchCount(playerIds: string[]) {
  const sb = createClient();
  for (const id of playerIds) {
    await sb.rpc('increment_match_count', { player_id: id });
  }
}

// ── Events ──────────────────────────────────────────────────────

export async function getEvents(teamId: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from('events')
    .select('*, attend_votes(*)')
    .eq('team_id', teamId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addEvent(teamId: string, title: string, date: string, location?: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from('events')
    .insert({ team_id: teamId, title, date, location })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeEvent(eventId: string) {
  const sb = createClient();
  const { error } = await sb.from('events').delete().eq('id', eventId);
  if (error) throw error;
}

export async function voteAttend(eventId: string, playerId: string, playerName: string, status: VoteStatus) {
  const sb = createClient();
  const { error } = await sb.from('attend_votes').upsert(
    { event_id: eventId, player_id: playerId, player_name: playerName, status },
    { onConflict: 'event_id,player_id' }
  );
  if (error) throw error;
}

export async function closeEvent(eventId: string) {
  const sb = createClient();
  const { error } = await sb.from('events').update({ is_open: false }).eq('id', eventId);
  if (error) throw error;
}

// ── Lineups ─────────────────────────────────────────────────────

export async function saveLineup(eventId: string, formationId: string, slots: LineupSlot[], notes?: string) {
  const sb = createClient();
  const { data: existing } = await sb.from('lineups').select('id').eq('event_id', eventId).single();

  let lineupId: string;
  if (existing) {
    lineupId = existing.id;
    await sb.from('lineups').update({ formation_id: formationId, notes }).eq('id', lineupId);
    await sb.from('lineup_slots').delete().eq('lineup_id', lineupId);
  } else {
    const { data, error } = await sb
      .from('lineups')
      .insert({ event_id: eventId, formation_id: formationId, notes, is_published: false })
      .select()
      .single();
    if (error) throw error;
    lineupId = data.id;
  }

  if (slots.length > 0) {
    await sb.from('lineup_slots').insert(
      slots.map((s) => ({ lineup_id: lineupId, position: s.position, slot_index: s.index, player_id: s.playerId ?? null, player_name: s.playerName ?? null }))
    );
  }
}

export async function publishLineup(eventId: string) {
  const sb = createClient();
  const { error } = await sb.from('lineups').update({ is_published: true }).eq('event_id', eventId);
  if (error) throw error;
}

// ── Match Records ────────────────────────────────────────────────

export async function getMatchRecords(teamId: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from('match_records')
    .select('*, match_participants(player_id), mvp_votes(*)')
    .eq('team_id', teamId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addMatchRecord(teamId: string, record: {
  title: string; date: string; teamAName: string; teamBName: string;
  scoreA: number; scoreB: number; playerIds: string[]; notes?: string;
}) {
  const sb = createClient();
  const { data, error } = await sb
    .from('match_records')
    .insert({ team_id: teamId, title: record.title, date: record.date, team_a_name: record.teamAName, team_b_name: record.teamBName, score_a: record.scoreA, score_b: record.scoreB, notes: record.notes, mvp_open: true })
    .select()
    .single();
  if (error) throw error;

  if (record.playerIds.length > 0) {
    await sb.from('match_participants').insert(record.playerIds.map((pid) => ({ match_id: data.id, player_id: pid })));
  }
  return data;
}

export async function removeMatchRecord(matchId: string) {
  const sb = createClient();
  const { error } = await sb.from('match_records').delete().eq('id', matchId);
  if (error) throw error;
}

export async function voteForMvp(matchId: string, voterId: string, mvpPlayerId: string, mvpPlayerName: string) {
  const sb = createClient();
  const { error } = await sb.from('mvp_votes').upsert(
    { match_id: matchId, voter_id: voterId, mvp_player_id: mvpPlayerId, mvp_player_name: mvpPlayerName },
    { onConflict: 'match_id,voter_id' }
  );
  if (error) throw error;
}

export async function closeMvpVoting(matchId: string) {
  const sb = createClient();
  const { error } = await sb.from('match_records').update({ mvp_open: false }).eq('id', matchId);
  if (error) throw error;
}

// ── Eval Requests ────────────────────────────────────────────────

export async function getEvalRequests(teamId: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from('eval_requests')
    .select('*')
    .eq('team_id', teamId)
    .order('requested_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function submitEvalRequest(teamId: string, req: { playerId: string; playerName: string; currentTier: Tier; suggestedTier: Tier; reason?: string }) {
  const sb = createClient();
  const { error } = await sb.from('eval_requests').insert({
    team_id: teamId, player_id: req.playerId, player_name: req.playerName,
    current_tier: req.currentTier, suggested_tier: req.suggestedTier, reason: req.reason,
  });
  if (error) throw error;
}

export async function resolveEvalRequest(reqId: string, approved: boolean) {
  const sb = createClient();
  const { error } = await sb.from('eval_requests').update({ status: approved ? 'approved' : 'rejected' }).eq('id', reqId);
  if (error) throw error;
}

// ── Helpers ──────────────────────────────────────────────────────

function scoreToTier(score: number): Tier {
  const map: Record<number, Tier> = {
    1: 'beginner-1', 2: 'beginner-2', 3: 'beginner-3',
    4: 'amateur-1',  5: 'amateur-2',  6: 'amateur-3',
    7: 'semi-pro-1', 8: 'semi-pro-2', 9: 'semi-pro-3',
    10: 'pro',
  };
  return map[Math.min(10, Math.max(1, Math.round(score)))] ?? 'beginner-1';
}
