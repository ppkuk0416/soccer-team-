export type Tier = 'beginner' | 'amateur' | 'semi-pro' | 'pro';
export type PlayerStatus = 'measuring' | 'confirmed';
export type UserRole = 'admin' | 'member';
export type VoteStatus = 'attending' | 'absent' | 'maybe';

export const TIER_LABELS: Record<Tier, string> = {
  beginner: '비기너',
  amateur: '아마추어',
  'semi-pro': '세미프로',
  pro: '프로',
};

export const TIER_SCORE_RANGE: Record<Tier, [number, number]> = {
  beginner: [1, 3],
  amateur: [4, 5],
  'semi-pro': [6, 8],
  pro: [9, 10],
};

export interface SoccerTeam {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  tier: Tier;
  status: PlayerStatus;
  officialMatchCount: number;
  position?: string;
  createdAt: string;
}

export interface EvalRequest {
  id: string;
  playerId: string;
  playerName: string;
  currentTier: Tier;
  suggestedTier: Tier;
  reason?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AttendanceVote {
  playerId: string;
  playerName: string;
  status: VoteStatus;
  votedAt: string;
}

export interface MatchEvent {
  id: string;
  title: string;
  date: string;       // ISO date string (경기 날짜)
  location?: string;
  votes: AttendanceVote[];
  isOpen: boolean;    // 투표 마감 여부
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  totalScore: number;
  avgScore: number;
}

export interface MatchResult {
  id: string;
  date: string;
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  mannerRatingA: number;
  mannerRatingB: number;
  notes?: string;
}

// 번개전 전용 — 저장 없이 세션에서만 사용
export interface QuickPlayer {
  id: string;
  name: string;
  score: number | null;
}
