export type Tier =
  | 'beginner-1' | 'beginner-2' | 'beginner-3'
  | 'amateur-1'  | 'amateur-2'  | 'amateur-3'
  | 'semi-pro-1' | 'semi-pro-2' | 'semi-pro-3'
  | 'pro';

export type PlayerStatus = 'measuring' | 'confirmed';
export type UserRole = 'admin' | 'member';
export type VoteStatus = 'attending' | 'absent' | 'maybe';

export const TIER_LABELS: Record<Tier, string> = {
  'beginner-1': '비기너1', 'beginner-2': '비기너2', 'beginner-3': '비기너3',
  'amateur-1':  '아마추어1', 'amateur-2': '아마추어2', 'amateur-3': '아마추어3',
  'semi-pro-1': '세미프로1', 'semi-pro-2': '세미프로2', 'semi-pro-3': '세미프로3',
  'pro': '프로',
};

// score 1-10 → tier
export const SCORE_TO_TIER: Record<number, Tier> = {
  1: 'beginner-1', 2: 'beginner-2', 3: 'beginner-3',
  4: 'amateur-1',  5: 'amateur-2',  6: 'amateur-3',
  7: 'semi-pro-1', 8: 'semi-pro-2', 9: 'semi-pro-3',
  10: 'pro',
};

export const TIER_TO_SCORE: Record<Tier, number> = {
  'beginner-1': 1, 'beginner-2': 2, 'beginner-3': 3,
  'amateur-1':  4, 'amateur-2':  5, 'amateur-3':  6,
  'semi-pro-1': 7, 'semi-pro-2': 8, 'semi-pro-3': 9,
  'pro': 10,
};

export const ALL_TIERS: Tier[] = [
  'beginner-1', 'beginner-2', 'beginner-3',
  'amateur-1',  'amateur-2',  'amateur-3',
  'semi-pro-1', 'semi-pro-2', 'semi-pro-3',
  'pro',
];

export interface SoccerTeam {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Player {
  id: string;
  name: string;
  score: number; // 1-10
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
  date: string;
  location?: string;
  votes: AttendanceVote[];
  isOpen: boolean;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  totalScore: number;
  avgScore: number;
}

export interface QuickPlayer {
  id: string;
  name: string;
  score: number | null;
}
