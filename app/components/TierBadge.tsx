'use client';
import { Tier, TIER_LABELS, PlayerStatus } from '../types';

const GROUP_COLOR: Record<string, string> = {
  beginner:  'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  amateur:   'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  'semi-pro':'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  pro:       'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  rookie:    'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
};

function groupOf(tier: Tier): string {
  if (tier.startsWith('beginner')) return 'beginner';
  if (tier.startsWith('amateur')) return 'amateur';
  if (tier.startsWith('semi-pro')) return 'semi-pro';
  return 'pro';
}

export function TierBadge({ tier, status }: { tier: Tier; status?: PlayerStatus }) {
  if (status === 'measuring') {
    return (
      <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 ring-1 ring-gray-200">
        루키
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${GROUP_COLOR[groupOf(tier)]}`}>
      {TIER_LABELS[tier]}
    </span>
  );
}
