import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSoccerStore } from '../../store/useSoccerStore';
import { SoccerTeam } from '../../types';
import { TierBadge } from '../../components/TierBadge';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TeamScreen() {
  const router = useRouter();
  const { team, setTeam, players, role, events, matchRecords } = useSoccerStore();
  const [editingTeam, setEditingTeam] = useState(!team);
  const [teamName, setTeamName] = useState(team?.name ?? '');
  const [teamDesc, setTeamDesc] = useState(team?.description ?? '');

  const confirmed = players.filter((p) => p.status === 'confirmed');
  const avgScore = confirmed.length
    ? +(confirmed.reduce((s, p) => s + p.score, 0) / confirmed.length).toFixed(1) : 0;
  const wins = matchRecords.filter((m) => m.scoreA > m.scoreB).length;
  const draws = matchRecords.filter((m) => m.scoreA === m.scoreB).length;
  const losses = matchRecords.filter((m) => m.scoreA < m.scoreB).length;

  const attendMap = new Map<string, number>();
  events.forEach((e) => e.votes.filter(v => v.status === 'attending').forEach(v => {
    attendMap.set(v.playerId, (attendMap.get(v.playerId) ?? 0) + 1);
  }));
  const topAttender = [...players].sort((a, b) => (attendMap.get(b.id) ?? 0) - (attendMap.get(a.id) ?? 0))[0];

  function handleSave() {
    if (!teamName.trim()) return;
    setTeam(teamName.trim(), teamDesc.trim() || undefined);
    setEditingTeam(false);
  }

  const tierGroups = [
    { label: '비기너', count: players.filter(p => p.tier.startsWith('beginner')).length, color: '#38bdf8' },
    { label: '아마추어', count: players.filter(p => p.tier.startsWith('amateur')).length, color: '#818cf8' },
    { label: '세미프로', count: players.filter(p => p.tier.startsWith('semi-pro')).length, color: '#c084fc' },
    { label: '프로', count: players.filter(p => p.tier === 'pro').length, color: '#fbbf24' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚽ 팀매처</Text>
        </View>

        {editingTeam || !team ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{team ? '팀 정보 수정' : '팀 만들기'}</Text>
            <TextInput
              style={styles.input}
              value={teamName}
              onChangeText={setTeamName}
              placeholder="팀 이름 (예: 화요일 FC)"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              value={teamDesc}
              onChangeText={setTeamDesc}
              placeholder="팀 소개 (선택)"
              placeholderTextColor="#9ca3af"
              multiline
            />
            <View style={styles.row}>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleSave}>
                <Text style={styles.btnPrimaryText}>저장</Text>
              </TouchableOpacity>
              {team && (
                <TouchableOpacity style={styles.btnGhost} onPress={() => setEditingTeam(false)}>
                  <Text style={styles.btnGhostText}>취소</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <>
            {/* Club hero */}
            <View style={styles.hero}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroSub}>클럽</Text>
                  <Text style={styles.heroName}>{team.name}</Text>
                  {team.description && <Text style={styles.heroDesc}>{team.description}</Text>}
                </View>
                {role === 'admin' && (
                  <TouchableOpacity onPress={() => { setTeamName(team.name); setTeamDesc(team.description ?? ''); setEditingTeam(true); }}
                    style={styles.editBtn}>
                    <Text style={styles.editBtnText}>수정</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.heroStats}>
                {[
                  { label: '선수', value: players.length },
                  { label: '경기', value: matchRecords.length },
                  { label: '평균실력', value: avgScore || '—' },
                  { label: '승/무/패', value: `${wins}/${draws}/${losses}` },
                ].map(({ label, value }) => (
                  <View key={label} style={styles.statItem}>
                    <Text style={styles.statValue}>{value}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Strength analysis */}
            {players.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>⚡ 클럽 전력 분석</Text>
                {tierGroups.map(({ label, count, color }) => {
                  const pct = players.length ? count / players.length : 0;
                  return (
                    <View key={label} style={styles.tierRow}>
                      <Text style={styles.tierLabel}>{label}</Text>
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: `${pct * 100}%` as `${number}%`, backgroundColor: color }]} />
                      </View>
                      <Text style={styles.tierCount}>{count}명</Text>
                    </View>
                  );
                })}
                {topAttender && (
                  <View style={styles.topAttend}>
                    <Text style={styles.topAttendLabel}>최다 출석</Text>
                    <View style={styles.row}>
                      <Text style={styles.topAttendName}>{topAttender.name}</Text>
                      <TierBadge tier={topAttender.tier} status={topAttender.status} />
                      <Text style={styles.topAttendCount}>{attendMap.get(topAttender.id) ?? 0}회</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Player list */}
        {team && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>선수 명단 <Text style={styles.sectionCount}>({players.length}명)</Text></Text>
            {players.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>⚽</Text>
                <Text style={styles.emptyText}>선수가 없습니다</Text>
              </View>
            ) : (
              [...players].sort((a, b) => b.score - a.score).map((p) => (
                <TouchableOpacity key={p.id} style={styles.playerCard} onPress={() => router.push(`/player/${p.id}`)}>
                  <View style={styles.playerLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{p.name.charAt(0)}</Text>
                    </View>
                    <View>
                      <View style={styles.row}>
                        <Text style={styles.playerName}>{p.name}</Text>
                        {p.position && <Text style={styles.playerPos}>{p.position}</Text>}
                      </View>
                      <TierBadge tier={p.tier} status={p.status} />
                    </View>
                  </View>
                  <View style={styles.row}>
                    <Text style={[styles.playerScore, p.status === 'measuring' && styles.scoreGray]}>
                      {p.status === 'measuring' ? '—' : p.score}
                    </Text>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#16a34a' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', gap: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  textarea: { height: 72, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnPrimary: { flex: 1, backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnGhost: { paddingHorizontal: 16, backgroundColor: '#f3f4f6', borderRadius: 12, paddingVertical: 12 },
  btnGhostText: { color: '#6b7280', fontSize: 14 },
  hero: { backgroundColor: '#16a34a', borderRadius: 16, padding: 20 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  heroSub: { fontSize: 11, color: '#bbf7d0', marginBottom: 2 },
  heroName: { fontSize: 24, fontWeight: '900', color: '#fff' },
  heroDesc: { fontSize: 13, color: '#dcfce7', marginTop: 2 },
  editBtn: { borderWidth: 1, borderColor: '#4ade80', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  editBtnText: { color: '#bbf7d0', fontSize: 12 },
  heroStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)', paddingTop: 12, gap: 4 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 9, color: '#86efac', marginTop: 2 },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierLabel: { fontSize: 11, color: '#6b7280', width: 50 },
  barBg: { flex: 1, height: 8, backgroundColor: '#f3f4f6', borderRadius: 99, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99 },
  tierCount: { fontSize: 11, fontWeight: '600', color: '#374151', width: 28, textAlign: 'right' },
  topAttend: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topAttendLabel: { fontSize: 11, color: '#9ca3af' },
  topAttendName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  topAttendCount: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
  section: { gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sectionCount: { fontWeight: '400', color: '#9ca3af', fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  playerCard: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  playerName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  playerPos: { fontSize: 11, color: '#9ca3af' },
  playerScore: { fontSize: 20, fontWeight: '900', color: '#374151' },
  scoreGray: { color: '#e5e7eb' },
  chevron: { fontSize: 18, color: '#d1d5db' },
});
