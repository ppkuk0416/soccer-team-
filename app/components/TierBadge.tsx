'use client';
import { Tier, PlayerStatus } from '../types';

const TIER_CONFIG: Record<string, { bg: string; text: string; dot: string; abbr: string }> = {
  'beginner-1': { bg: 'bg-sky-100',    text: 'text-sky-700',    dot: 'bg-sky-400',    abbr: 'B1' },
  'beginner-2': { bg: 'bg-sky-100',    text: 'text-sky-700',    dot: 'bg-sky-400',    abbr: 'B2' },
  'beginner-3': { bg: 'bg-sky-100',    text: 'text-sky-700',    dot: 'bg-sky-400',    abbr: 'B3' },
  'amateur-1':  { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-400', abbr: 'A1' },
  'amateur-2':  { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-400', abbr: 'A2' },
  'amateur-3':  { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-400', abbr: 'A3' },
  'semi-pro-1': { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-400', abbr: 'S1' },
  'semi-pro-2': { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-400', abbr: 'S2' },
  'semi-pro-3': { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-400', abbr: 'S3' },
  'pro':        { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400',  abbr: 'PRO' },
};

export function tierAvatarColors(tier: Tier, status?: PlayerStatus): string {
  if (status === 'measuring') return 'bg-gray-100 text-gray-500';
  if (tier.startsWith('beginner')) return 'bg-sky-100 text-sky-700';
  if (tier.startsWith('amateur')) return 'bg-indigo-100 text-indigo-700';
  if (tier.startsWith('semi-pro')) return 'bg-purple-100 text-purple-700';
  return 'bg-amber-100 text-amber-700';
}

export function TierBadge({ tier, status }: { tier: Tier; status?: PlayerStatus }) {
  if (status === 'measuring') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        신입
      </span>
    );
  }
  const cfg = TIER_CONFIG[tier];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.abbr}
    </span>
  );
}
