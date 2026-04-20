import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSoccerStore } from '../../store/useSoccerStore';
import { FORMATIONS, LineupSlot, Position, POSITION_LABELS } from '../../types';
import { TierBadge } from '../../components/TierBadge';

const POS_ORDER: Position[] = ['FWD', 'MID', 'DEF', 'GK'];

export default function LineupScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const { events, players, lineups, role, saveLineup, publishLineup } = useSoccerStore();

  const event = events.find((e) => e.id === eventId);
  const existing = lineups.find((l) => l.eventId === eventId);

  const [formationId, setFormationId] = useState(existing?.formationId ?? '4-4-2');
  const [slots, setSlots] = useState<LineupSlot[]>(existing?.slots ?? []);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [pickingSlot, setPickingSlot] = useState<{ pos: Position; idx: number } | null>(null);

  const formation = FORMATIONS.find((f) => f.id === formationId)!;

  const allSlots: LineupSlot[] = formation.slots.flatMap(({ pos, count }) =>
    Array.from({ length: count }, (_, i) => {
      const saved = slots.find((s) => s.position === pos && s.index === i);
      return saved ?? { position: pos, index: i };
    })
  );

  function assignPlayer(playerId: string, playerName: string) {
    if (!pickingSlot) return;
    setSlots((prev) => {
      const filtered = prev.filter((s) => !(s.position === pickingSlot.pos && s.index === pickingSlot.idx));
      return [...filtered, { position: pickingSlot.pos, index: pickingSlot.idx, playerId, playerName }];
    });
    setPickingSlot(null);
  }

  function clearSlot(pos: Position, idx: number) {
    setSlots((prev) => prev.filter((s) => !(s.position === pos && s.index === idx)));
  }

  const attendingIds = event?.votes.filter((v) => v.status === 'attending').map((v) => v.playerId) ?? [];
  const assignedIds = allSlots.map((s) => s.playerId).filter(Boolean) as string[];
  const availablePlayers = players.filter((p) => !assignedIds.includes(p.id));

  if (!event) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.notFound}><Text style={styles.notFoundText}>일정을 찾을 수 없습니다</Text></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>라인업 설정</Text>
            <Text style={styles.headerSub}>{event.title} · {event.date}</Text>
          </View>
          {existing?.isPublished && (
            <View style={styles.publishedBadge}><Text style={styles.publishedText}>공개됨</Text></View>
          )}
        </View>

        {/* Formation */}
        <View>
          <Text style={styles.sectionLabel}>포메이션</Text>
          <View style={styles.formationRow}>
            {FORMATIONS.map((f) => (
              <TouchableOpacity key={f.id}
                style={[styles.formationBtn, formationId === f.id && styles.formationBtnActive]}
                onPress={() => { setFormationId(f.id); setSlots([]); }}>
                <Text style={[styles.formationBtnText, formationId === f.id && styles.formationBtnTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Field */}
        <View style={styles.field}>
          {POS_ORDER.filter((pos) => formation.slots.some((s) => s.pos === pos)).map((pos) => {
            const posSlots = allSlots.filter((s) => s.position === pos);
            return (
              <View key={pos} style={styles.posRow}>
                <Text style={styles.posLabel}>{POSITION_LABELS[pos]}</Text>
                <View style={styles.posPlayers}>
                  {posSlots.map((slot) => (
                    <View key={`${slot.position}-${slot.index}`}>
                      {slot.playerId ? (
                        <TouchableOpacity onPress={() => role === 'admin' && clearSlot(slot.position, slot.index)}
                          style={styles.playerSlot}>
                          <View style={styles.playerCircle}>
                            <Text style={styles.playerCircleText}>{slot.playerName!.charAt(0)}</Text>
                          </View>
                          <Text style={styles.playerSlotName} numberOfLines={1}>{slot.playerName}</Text>
                        </TouchableOpacity>
                      ) : role === 'admin' ? (
                        <TouchableOpacity onPress={() => setPickingSlot({ pos: slot.position, idx: slot.index })}
                          style={styles.playerSlot}>
                          <View style={styles.emptyCircle}>
                            <Text style={styles.emptyCircleText}>+</Text>
                          </View>
                          <Text style={styles.emptySlotLabel}>{POSITION_LABELS[pos]}</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.playerSlot}>
                          <View style={styles.emptyCircleGhost} />
                          <Text style={styles.unassignedText}>미정</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.assignedRow}>
          <Text style={styles.assignedText}>배정 선수: {assignedIds.length}/{allSlots.length}</Text>
          {attendingIds.length > 0 && <Text style={styles.attendingText}>오늘 참석 {attendingIds.length}명</Text>}
        </View>

        {role === 'admin' && (
          <TextInput style={[styles.input, styles.textarea]} value={notes} onChangeText={setNotes}
            placeholder="전술 메모 (선택)" placeholderTextColor="#9ca3af" multiline />
        )}
        {role !== 'admin' && notes && (
          <View style={styles.notesDisplay}><Text style={styles.notesDisplayText}>📝 {notes}</Text></View>
        )}

        {role === 'admin' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={() => { saveLineup(eventId!, formationId, allSlots, notes); router.back(); }}>
              <Text style={styles.saveBtnText}>임시 저장</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.publishBtn} onPress={() => { saveLineup(eventId!, formationId, allSlots, notes); publishLineup(eventId!); router.back(); }}>
              <Text style={styles.publishBtnText}>라인업 공개</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Player picker modal */}
      <Modal visible={!!pickingSlot} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {pickingSlot ? POSITION_LABELS[pickingSlot.pos] : ''} 선수 선택
            </Text>
            <TouchableOpacity onPress={() => setPickingSlot(null)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
            {availablePlayers.length === 0 ? (
              <Text style={styles.emptyText}>배정 가능한 선수가 없습니다</Text>
            ) : (
              availablePlayers.map((p) => (
                <TouchableOpacity key={p.id} style={styles.pickerItem} onPress={() => assignPlayer(p.id, p.name)}>
                  <View style={styles.pickerLeft}>
                    <View style={styles.pickerAvatar}>
                      <Text style={styles.pickerAvatarText}>{p.name.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.pickerName}>{p.name}</Text>
                      <TierBadge tier={p.tier} status={p.status} />
                    </View>
                  </View>
                  {attendingIds.includes(p.id) && <Text style={styles.attendingBadge}>✅ 참석</Text>}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: '#9ca3af' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 24, color: '#9ca3af' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  publishedBadge: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  publishedText: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: '#6b7280', marginBottom: 8 },
  formationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  formationBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  formationBtnActive: { backgroundColor: '#111827', borderColor: '#111827' },
  formationBtnText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  formationBtnTextActive: { color: '#fff', fontWeight: '700' },
  field: { backgroundColor: '#15803d', borderRadius: 16, padding: 16, gap: 16 },
  posRow: { gap: 6 },
  posLabel: { fontSize: 9, color: '#86efac', textAlign: 'center' },
  posPlayers: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 10 },
  playerSlot: { alignItems: 'center', minWidth: 56, gap: 3 },
  playerCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  playerCircleText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  playerSlotName: { fontSize: 9, color: '#fff', fontWeight: '500', maxWidth: 60, textAlign: 'center' },
  emptyCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  emptyCircleText: { color: 'rgba(255,255,255,0.6)', fontSize: 18 },
  emptySlotLabel: { fontSize: 9, color: 'rgba(255,255,255,0.4)' },
  emptyCircleGhost: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', borderStyle: 'dashed' },
  unassignedText: { fontSize: 9, color: 'rgba(255,255,255,0.3)' },
  assignedRow: { flexDirection: 'row', justifyContent: 'space-between' },
  assignedText: { fontSize: 12, color: '#6b7280' },
  attendingText: { fontSize: 12, color: '#16a34a', fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  textarea: { height: 64, textAlignVertical: 'top' },
  notesDisplay: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f3f4f6' },
  notesDisplayText: { fontSize: 14, color: '#6b7280' },
  actionRow: { flexDirection: 'row', gap: 10 },
  saveBtn: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  publishBtn: { flex: 1, backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  publishBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  modalClose: { color: '#9ca3af', fontSize: 18 },
  emptyText: { color: '#9ca3af', textAlign: 'center', padding: 24, fontSize: 13 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  pickerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  pickerAvatarText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  pickerName: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 3 },
  attendingBadge: { fontSize: 11, color: '#16a34a', fontWeight: '500' },
});
