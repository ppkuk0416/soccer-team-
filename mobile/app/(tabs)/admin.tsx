import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSoccerStore } from '../../store/useSoccerStore';
import { TierBadge } from '../../components/TierBadge';
import { TIER_LABELS, Tier, SCORE_TO_TIER, TIER_TO_SCORE } from '../../types';
import { PlayerForm } from '../../components/PlayerForm';

const ALL_TIERS_LIST: Tier[] = [
  'beginner-1','beginner-2','beginner-3',
  'amateur-1','amateur-2','amateur-3',
  'semi-pro-1','semi-pro-2','semi-pro-3',
  'pro',
];

export default function AdminScreen() {
  const { role, setRole, players, evalRequests, confirmTier, resolveEvalRequest, submitEvalRequest } = useSoccerStore();
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmScore, setConfirmScore] = useState(5);
  const [requestPlayerId, setRequestPlayerId] = useState('');
  const [requestTier, setRequestTier] = useState<Tier>('amateur-1');
  const [requestReason, setRequestReason] = useState('');

  const pendingEvals = evalRequests.filter((r) => r.status === 'pending');
  const measuringPlayers = players.filter((p) => p.status === 'measuring');

  function handleConfirmTier() {
    if (confirmingId) {
      confirmTier(confirmingId, confirmScore);
      setConfirmingId(null);
    }
  }

  function handleSubmitRequest() {
    if (!requestPlayerId) return;
    const player = players.find(p => p.id === requestPlayerId);
    if (!player) return;
    submitEvalRequest({ playerId: requestPlayerId, playerName: player.name, currentTier: player.tier, suggestedTier: requestTier, reason: requestReason });
    setRequestPlayerId(''); setRequestReason('');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>평가 관리</Text>

        {/* Role switch */}
        <View style={styles.roleCard}>
          <Text style={styles.roleLabel}>현재 역할</Text>
          <View style={styles.roleRow}>
            {(['admin', 'member'] as const).map((r) => (
              <TouchableOpacity key={r} style={[styles.roleBtn, role === r && styles.roleBtnActive]} onPress={() => setRole(r)}>
                <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                  {r === 'admin' ? '🛡️ 운영진' : '👤 팀원'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {role === 'admin' ? (
          <>
            {/* Add player */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>선수 관리</Text>
                <TouchableOpacity style={styles.btnSmall} onPress={() => setShowAddPlayer(true)}>
                  <Text style={styles.btnSmallText}>+ 추가</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Measuring players — confirm tier */}
            {measuringPlayers.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>루키 등급 확정 ({measuringPlayers.length}명)</Text>
                {measuringPlayers.map((p) => (
                  <View key={p.id} style={styles.measuringRow}>
                    <View>
                      <Text style={styles.playerName}>{p.name}</Text>
                      <Text style={styles.playerSub}>{p.officialMatchCount}경기 참여</Text>
                    </View>
                    <TouchableOpacity style={styles.btnSmall} onPress={() => { setConfirmingId(p.id); setConfirmScore(p.score); }}>
                      <Text style={styles.btnSmallText}>등급 확정</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Eval requests */}
            {pendingEvals.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>재평가 요청 ({pendingEvals.length}건)</Text>
                {pendingEvals.map((req) => (
                  <View key={req.id} style={styles.evalRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playerName}>{req.playerName}</Text>
                      <Text style={styles.evalTiers}>{TIER_LABELS[req.currentTier]} → {TIER_LABELS[req.suggestedTier]}</Text>
                      {req.reason && <Text style={styles.evalReason}>{req.reason}</Text>}
                    </View>
                    <View style={styles.evalActions}>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => resolveEvalRequest(req.id, true)}>
                        <Text style={styles.approveBtnText}>승인</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => resolveEvalRequest(req.id, false)}>
                        <Text style={styles.rejectBtnText}>거절</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          /* Member: submit eval request */
          <View style={styles.card}>
            <Text style={styles.cardTitle}>재평가 요청</Text>
            <Text style={styles.hintText}>선수를 선택하고 적절하다고 생각하는 등급을 제안해주세요</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {players.map((p) => (
                  <TouchableOpacity key={p.id}
                    style={[styles.playerChip, requestPlayerId === p.id && styles.playerChipActive]}
                    onPress={() => setRequestPlayerId(p.id)}>
                    <Text style={[styles.chipText, requestPlayerId === p.id && styles.chipTextActive]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {ALL_TIERS_LIST.map((t) => (
                  <TouchableOpacity key={t}
                    style={[styles.tierChip, requestTier === t && styles.tierChipActive]}
                    onPress={() => setRequestTier(t)}>
                    <Text style={[styles.tierChipText, requestTier === t && styles.tierChipTextActive]}>{TIER_LABELS[t]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TextInput style={[styles.input, styles.textarea]} value={requestReason} onChangeText={setRequestReason}
              placeholder="사유 (선택)" placeholderTextColor="#9ca3af" multiline />
            <TouchableOpacity style={[styles.btnPrimary, !requestPlayerId && styles.btnDisabled]} onPress={handleSubmitRequest}>
              <Text style={styles.btnPrimaryText}>요청 제출</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Eval history */}
        {evalRequests.filter(r => r.status !== 'pending').length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>처리 내역</Text>
            {evalRequests.filter(r => r.status !== 'pending').slice(0, 5).map((req) => (
              <View key={req.id} style={styles.historyRow}>
                <Text style={styles.historyName}>{req.playerName}</Text>
                <Text style={styles.historyTiers}>{TIER_LABELS[req.currentTier]} → {TIER_LABELS[req.suggestedTier]}</Text>
                <Text style={[styles.historyStatus, { color: req.status === 'approved' ? '#16a34a' : '#dc2626' }]}>
                  {req.status === 'approved' ? '승인' : '거절'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Confirm tier modal */}
      <Modal visible={!!confirmingId} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>등급 확정</Text>
            <TouchableOpacity onPress={() => setConfirmingId(null)}>
              <Text style={styles.modalClose}>취소</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16, gap: 16 }}>
            <Text style={styles.hintText}>점수: {confirmScore} ({TIER_LABELS[SCORE_TO_TIER[confirmScore]]})</Text>
            <View style={styles.scoreSliderRow}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <TouchableOpacity key={n} style={[styles.scoreBtn, confirmScore === n && styles.scoreBtnActive]}
                  onPress={() => setConfirmScore(n)}>
                  <Text style={[styles.scoreBtnText, confirmScore === n && styles.scoreBtnTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleConfirmTier}>
              <Text style={styles.btnPrimaryText}>확정</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {showAddPlayer && (
        <Modal visible animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>선수 추가</Text>
              <TouchableOpacity onPress={() => setShowAddPlayer(false)}>
                <Text style={styles.modalClose}>닫기</Text>
              </TouchableOpacity>
            </View>
            <PlayerForm onClose={() => setShowAddPlayer(false)} />
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  roleCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', gap: 10 },
  roleLabel: { fontSize: 12, color: '#6b7280' },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#111827', borderColor: '#111827' },
  roleBtnText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  roleBtnTextActive: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  btnSmall: { backgroundColor: '#16a34a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnSmallText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  btnPrimary: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { backgroundColor: '#d1fae5' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  textarea: { height: 72, textAlignVertical: 'top' },
  measuringRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  playerName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  playerSub: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  evalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  evalTiers: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  evalReason: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  evalActions: { flexDirection: 'row', gap: 6 },
  approveBtn: { backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  approveBtnText: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
  rejectBtn: { backgroundColor: '#fef2f2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  rejectBtnText: { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  hintText: { fontSize: 12, color: '#6b7280' },
  playerChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  playerChipActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  chipText: { fontSize: 13, color: '#6b7280' },
  chipTextActive: { color: '#15803d', fontWeight: '600' },
  tierChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  tierChipActive: { borderColor: '#6d28d9', backgroundColor: '#f5f3ff' },
  tierChipText: { fontSize: 11, color: '#6b7280' },
  tierChipTextActive: { color: '#6d28d9', fontWeight: '600' },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  historyName: { fontSize: 13, fontWeight: '600', color: '#374151', width: 60 },
  historyTiers: { flex: 1, fontSize: 11, color: '#9ca3af' },
  historyStatus: { fontSize: 12, fontWeight: '600' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  modalClose: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  scoreSliderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  scoreBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  scoreBtnActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  scoreBtnText: { fontSize: 16, fontWeight: '700', color: '#6b7280' },
  scoreBtnTextActive: { color: '#fff' },
});
