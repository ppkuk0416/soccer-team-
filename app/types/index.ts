export type Tier = 'beginner' | 'amateur' | 'semi-pro' | 'pro';

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

export interface Player {
  id: string;
  name: string;
  score: number; // 1-10
  tier: Tier;
  position?: string;
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
  mannerRatingA: number; // 1-5
  mannerRatingB: number; // 1-5
  notes?: string;
}

export interface TeamStats {
  teamId: string;
  teamName: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  skillRating: number;  // 1-10 avg score of players
  mannerRating: number; // 1-5 avg from match ratings
}
