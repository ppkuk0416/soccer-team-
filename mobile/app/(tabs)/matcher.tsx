import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSoccerStore } from '../../store/useSoccerStore';
import { balanceTeams } from '../../utils/teamBalancer';
import { Player, Team } from '../../types';
import { TierBadge } from '../../components/TierBadge';

export default function MatcherScreen() {
  const { players } = useSoccerStore();
  const [teamAName, setTeamAName] = useState('A팀');
  const [teamBName, setTeamBName] = useState('B팀');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<[Team, Team] | null>(null);
  const [newName, setNewName] = useState('');
  const [newScore, setNewScore] = useState('5');

  const [guestPlayers, setGuestPlayers] = useState<Player[]>([]);
  const [tab, setTab] = useState<'registered' | 'guest'>('registered');

  const allPlayers = tab === 'registered' ? players : guestPlayers;

  function togglePlayer(id: string) {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function addGuest() {
    if (!newName.trim()) return;
    const id = Date.now().toString();
    setGuestPlayers((prev) => [...prev, {
      id, name: newName.trim(), score: Number(newScore),
      tier: 'amateur-2', status: 'confirmed', officialMatchCount: 0, createdAt: new Date().toISOString(),
    }]);
    setNewName('');
  }

  function handleBalance() {
    const selected = allPlayers.filter((p) => selectedIds.has(p.id));
    if (selected.length < 2) { Alert.alert('최소 2명 이상 선택해주세요'); return; }
    setResult(balanceTeams(selected, teamAName, teamBName));
  }

  const diff = result ? Math.abs(result[0].totalScore - result[1].totalScore) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>팀 매칭</Text>

        {/* Tab */}
        <View style={styles.tabRow}>
          {(['registered', 'guest'] as const).map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => { setTab(t); setSelectedIds(new Set()); setResult(null); }}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'registered' ? '등록 선수' : '번개전'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Guest add */}
        {tab === 'guest' && (
          <View style={styles.card}>
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1 }]} value={newName} onChangeText={setNewName} placeholder="이름" placeholderTextColor="#9ca3af" />
              <TextInput style={[styles.input, { width: 64 }]} value={newScore} onChangeText={setNewScore} placeholder="점수" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
              <TouchableOpacity style={styles.addBtn} onPress={addGuest}>
                <Text style={styles.addBtnText}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Player list */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>선수 선택 ({selectedIds.size}/{allPlayers.length})</Text>
          {allPlayers.length === 0 && <Text style={styles.emptyText}>선수가 없습니다</Text>}
          <View style={styles.grid}>
            {allPlayers.map((p) => (
              <TouchableOpacity key={p.id} style={[styles.playerChip, selectedIds.has(p.id) && styles.playerChipActive]}
                onPress={() => togglePlayer(p.id)}>
                <Text style={[styles.playerChipName, selectedIds.has(p.id) && styles.playerChipNameActive]}>{p.name}</Text>
                <Text style={styles.playerChipScore}>{p.status === 'measuring' ? '—' : p.score}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Team names */}
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1 }]} value={teamAName} onChangeText={setTeamAName} />
          <Text style={styles.vs}>vs</Text>
          <TextInput style={[styles.input, { flex: 1 }]} value={teamBName} onChangeText={setTeamBName} />
        </View>

        <TouchableOpacity style={[styles.balanceBtn, selectedIds.size < 2 && styles.balanceBtnDisabled]} onPress={handleBalance}>
          <Text style={styles.balanceBtnText}>⚡ {selectedIds.size}명 팀 나누기</Text>
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>팀 구성 결과</Text>
              <View style={[styles.diffBadge, { backgroundColor: diff <= 1 ? '#f0fdf4' : '#fffbeb' }]}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: diff <= 1 ? '#15803d' : '#a16207' }}>점수 차 {diff}</Text>
              </View>
            </View>
            <View style={styles.teamsRow}>
              {result.map((team, i) => (
                <View key={team.id} style={[styles.teamBlock, i === 0 ? styles.teamA : styles.teamB]}>
                  <View style={styles.teamBlockHeader}>
                    <Text style={[styles.teamBlockName, { color: i === 0 ? '#1d4ed8' : '#b91c1c' }]}>{team.name}</Text>
                    <Text style={styles.teamBlockScore}>{team.totalScore}점</Text>
                  </View>
                  {[...team.players].sort((a, b) => b.score - a.score).map((p) => (
                    <View key={p.id} style={styles.teamPlayer}>
                      <Text style={styles.teamPlayerName}>{p.name}</Text>
                      <Text style={styles.teamPlayerScore}>{p.status === 'measuring' ? '—' : p.score}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
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
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  tabRow: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  tabTextActive: { color: '#111827', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', gap: 10 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#374151' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  addBtn: { backgroundColor: '#16a34a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  playerChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  playerChipActive: { borderColor: '#4ade80', backgroundColor: '#f0fdf4' },
  playerChipName: { fontSize: 13, color: '#6b7280' },
  playerChipNameActive: { color: '#15803d', fontWeight: '600' },
  playerChipScore: { fontSize: 11, color: '#9ca3af' },
  vs: { color: '#d1d5db', fontWeight: '700' },
  balanceBtn: { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  balanceBtnDisabled: { backgroundColor: '#d1fae5' },
  balanceBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyText: { color: '#9ca3af', fontSize: 13 },
  resultCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', gap: 12 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  teamsRow: { flexDirection: 'row', gap: 10 },
  teamBlock: { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1 },
  teamA: { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' },
  teamB: { borderColor: '#fecaca', backgroundColor: '#fef2f2' },
  teamBlockHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  teamBlockName: { fontSize: 12, fontWeight: '700' },
  teamBlockScore: { fontSize: 11, color: '#6b7280' },
  teamPlayer: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  teamPlayerName: { fontSize: 12, color: '#374151' },
  teamPlayerScore: { fontSize: 11, color: '#9ca3af' },
});
