import { View, Text, StyleSheet } from 'react-native';
import { Tier, PlayerStatus, TIER_LABELS } from '../types';

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: '#e0f2fe', text: '#0369a1' },
  amateur:  { bg: '#e0e7ff', text: '#4338ca' },
  'semi-pro': { bg: '#f3e8ff', text: '#7e22ce' },
  pro:      { bg: '#fef3c7', text: '#92400e' },
};

function getGroup(tier: Tier): string {
  if (tier.startsWith('beginner')) return 'beginner';
  if (tier.startsWith('amateur')) return 'amateur';
  if (tier.startsWith('semi-pro')) return 'semi-pro';
  return 'pro';
}

export function TierBadge({ tier, status }: { tier: Tier; status: PlayerStatus }) {
  if (status === 'measuring') {
    return (
      <View style={[styles.badge, { backgroundColor: '#fff7ed' }]}>
        <Text style={[styles.text, { color: '#ea580c' }]}>루키</Text>
      </View>
    );
  }
  const group = getGroup(tier);
  const colors = TIER_COLORS[group] ?? TIER_COLORS.beginner;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{TIER_LABELS[tier]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  text: { fontSize: 10, fontWeight: '600' },
});
