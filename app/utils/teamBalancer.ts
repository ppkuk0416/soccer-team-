import { Player, Team } from '../types';

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

// Greedy balanced split: sort by score, alternate assignment
export function balanceTeams(players: Player[], teamAName = 'A팀', teamBName = 'B팀'): [Team, Team] {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const a: Player[] = [];
  const b: Player[] = [];

  sorted.forEach((p, i) => {
    const sumA = a.reduce((s, x) => s + x.score, 0);
    const sumB = b.reduce((s, x) => s + x.score, 0);
    if (sumA <= sumB) a.push(p);
    else b.push(p);
  });

  const makeTeam = (name: string, players: Player[], id: string): Team => ({
    id,
    name,
    players,
    totalScore: players.reduce((s, p) => s + p.score, 0),
    avgScore: players.length ? +(players.reduce((s, p) => s + p.score, 0) / players.length).toFixed(1) : 0,
  });

  return [
    makeTeam(teamAName, a, generateId()),
    makeTeam(teamBName, b, generateId()),
  ];
}

// Score difference for display
export function scoreDiff(teamA: Team, teamB: Team): number {
  return Math.abs(teamA.totalScore - teamB.totalScore);
}
