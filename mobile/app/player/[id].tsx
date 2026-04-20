import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSoccerStore } from '../../store/useSoccerStore';
import { TierBadge } from '../../components/TierBadge';
import { PlayerForm } from '../../components/PlayerForm';
import { TIER_LABELS } from '../../types';

function getMvpId(votes: { voterId: string; mvpPlayerId: string }[]): string | null {
  if (!votes.length) return null;
  const counts = new Map<string, number>();
  votes.forEach((v) => counts.set(v.mvpPlayerId, (counts.get(v.mvpPlayerId) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { players, events, matchRecords, role, removePlayer } = useSoccerStore();
  const [editing, setEditing] = useState(false);

  const player = players.find((p) => p.id === id);
  if (!player) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>선수를 찾을 수 없습니다</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backLink}>← 돌아가기</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const attendCount = events.reduce((n, e) => {
    const v = e.votes.find((v) => v.playerId === id);
    return v?.status === 'attending' ? n + 1 : n;
  }, 0);
  const mvpCount = matchRecords.reduce((n, m) => getMvpId(m.mvpVotes) === id ? n + 1 : n, 0);
  const matchParticipation = matchRecords.filter((m) => m.playerIds.includes(id!));
  const recentEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const scoreColor = player.score <= 3 ? '#0284c7' : player.score <= 6 ? '#4f46e5' : player.score <= 9 ? '#7c3aed' : '#d97706';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹ 팀으로</Text>
        </TouchableOpacity>

        {/* Profile hero */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.profileLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{player.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.playerName}>{player.name}</Text>
                <View style={styles.badgeRow}>
                  <TierBadge tier={player.tier} status={player.status} />
                  {player.position && <View style={styles.posBadge}><Text style={styles.posBadgeText}>{player.position}</Text></View>}
                </View>
              </View>
            </View>
            <View style={styles.scoreBlock}>
              <Text style={[styles.scoreNum, player.status === 'measuring' ? styles.scoreGray : { color: scoreColor }]}>
                {player.status === 'measuring' ? '?' : player.score}
              </Text>
              <Text style={styles.scoreLabel}>실력 점수</Text>
            </View>
          </View>

          {player.status === 'measuring' && (
            <View style={styles.rookieBanner}>
              <Text style={styles.rookieBannerText}>루키 — 운영진 등급 확정 대기 중 ({player.officialMatchCount}경기 참여)</Text>
            </View>
          )}

          {role === 'admin' && (
            <View style={styles.adminBtns}>
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                <Text style={styles.editBtnText}>정보 수정</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => {
                Alert.alert('선수 삭제', `${player.name}을(를) 삭제하시겠습니까?`, [
                  { text: '취소' },
                  { text: '삭제', style: 'destructive', onPress: () => { removePlayer(player.id); router.push('/'); } },
                ]);
              }}>
                <Text style={styles.deleteBtnText}>삭제</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats grid */}
        <View style={styles.statsRow}>
          {[
            { label: '출석', value: attendCount, color: '#16a34a' },
            { label: '경기 참가', value: matchParticipation.length, color: '#4f46e5' },
            { label: 'MVP', value: mvpCount, color: '#d97706' },
          ].map(({ label, value, color }) => (
            <View key={label} style={styles.statCard}>
              <Text style={[styles.statValue, { color }]}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Skill bar */}
        {player.status === 'confirmed' && (
          <View style={styles.card}>
            <View style={styles.skillHeader}>
              <Text style={styles.cardTitle}>실력 지수</Text>
              <Text style={styles.tierLabel}>{TIER_LABELS[player.tier]}</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${player.score * 10}%` as any }]} />
            </View>
            <View style={styles.barLabels}>
              <Text style={styles.barLabelText}>1</Text>
              <Text style={styles.barLabelText}>5</Text>
              <Text style={styles.barLabelText}>10</Text>
            </View>
          </View>
        )}

        {/* Recent attendance */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>최근 출석 현황</Text>
          {recentEvents.length === 0 ? (
            <Text style={styles.emptyText}>경기 일정이 없습니다</Text>
          ) : (
            recentEvents.map((e) => {
              const v = e.votes.find((v) => v.playerId === id);
              const label = v?.status === 'attending' ? '✅ 참석' : v?.status === 'absent' ? '❌ 불참' : v?.status === 'maybe' ? '🤔 미정' : '— 미투표';
              const color = v?.status === 'attending' ? '#16a34a' : v?.status === 'absent' ? '#dc2626' : '#9ca3af';
              return (
                <View key={e.id} style={styles.attendRow}>
                  <View>
                    <Text style={styles.attendTitle}>{e.title}</Text>
                    <Text style={styles.attendDate}>{e.date}</Text>
                  </View>
                  <Text style={[styles.attendStatus, { color }]}>{label}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* MVP history */}
        {mvpCount > 0 && (
          <View style={styles.mvpCard}>
            <Text style={styles.mvpTitle}>🏆 MVP 수상</Text>
            {matchRecords.filter((m) => getMvpId(m.mvpVotes) === id).map((m) => (
              <View key={m.id} style={styles.mvpRow}>
                <Text style={styles.mvpMatchTitle}>{m.title}</Text>
                <Text style={styles.mvpDate}>{m.date}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={editing} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>선수 정보 수정</Text>
            <TouchableOpacity onPress={() => setEditing(false)}>
              <Text style={styles.modalClose}>닫기</Text>
            </TouchableOpacity>
          </View>
          <PlayerForm editPlayer={player} onClose={() => setEditing(false)} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { color: '#9ca3af', fontSize: 15 },
  backLink: { color: '#16a34a', fontSize: 14 },
  backBtn: { paddingVertical: 4 },
  backBtnText: { color: '#9ca3af', fontSize: 14 },
  profileCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', gap: 12 },
  profileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  profileLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 60, height: 60, borderRadius: 14, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#fff' },
  playerName: { fontSize: 20, fontWeight: '900', color: '#111827' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 4, alignItems: 'center' },
  posBadge: { backgroundColor: '#f3f4f6', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  posBadgeText: { fontSize: 10, color: '#6b7280', fontWeight: '500' },
  scoreBlock: { alignItems: 'flex-end' },
  scoreNum: { fontSize: 36, fontWeight: '900' },
  scoreGray: { color: '#e5e7eb' },
  scoreLabel: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  rookieBanner: { backgroundColor: '#fff7ed', borderRadius: 10, padding: 10 },
  rookieBannerText: { fontSize: 11, color: '#ea580c' },
  adminBtns: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#f9fafb', paddingTop: 12 },
  editBtn: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  editBtnText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  deleteBtn: { paddingHorizontal: 16, borderWidth: 1, borderColor: '#fee2e2', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  deleteBtnText: { fontSize: 13, color: '#ef4444' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  skillHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  tierLabel: { fontSize: 12, color: '#9ca3af' },
  barBg: { height: 12, backgroundColor: '#f3f4f6', borderRadius: 99, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#16a34a', borderRadius: 99 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabelText: { fontSize: 9, color: '#d1d5db' },
  emptyText: { color: '#9ca3af', fontSize: 12 },
  attendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  attendTitle: { fontSize: 13, fontWeight: '500', color: '#374151' },
  attendDate: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  attendStatus: { fontSize: 11, fontWeight: '600' },
  mvpCard: { backgroundColor: '#fffbeb', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fef3c7', gap: 8 },
  mvpTitle: { fontSize: 14, fontWeight: '700', color: '#92400e' },
  mvpRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  mvpMatchTitle: { fontSize: 13, color: '#b45309' },
  mvpDate: { fontSize: 11, color: '#d97706' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  modalClose: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
});
