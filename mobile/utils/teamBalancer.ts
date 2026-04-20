import { Player, Team } from '../types';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function balanceTeams(players: Player[], nameA = 'A팀', nameB = 'B팀'): [Team, Team] {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const teamA: Player[] = [];
  const teamB: Player[] = [];
  let sumA = 0, sumB = 0;

  for (const p of sorted) {
    if (sumA <= sumB) { teamA.push(p); sumA += p.score; }
    else              { teamB.push(p); sumB += p.score; }
  }

  return [
    { id: genId(), name: nameA, players: teamA, totalScore: sumA },
    { id: genId(), name: nameB, players: teamB, totalScore: sumB },
  ];
}
