'use client';
import { Tier, TIER_LABELS } from '../types';

const colors: Record<Tier, string> = {
  beginner: 'bg-gray-200 text-gray-700',
  amateur: 'bg-blue-100 text-blue-700',
  'semi-pro': 'bg-purple-100 text-purple-700',
  pro: 'bg-yellow-100 text-yellow-800',
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[tier]}`}>
      {TIER_LABELS[tier]}
    </span>
  );
}
