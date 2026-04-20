import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useSoccerStore } from '../store/useSoccerStore';
import { Player, SCORE_TO_TIER, TIER_LABELS } from '../types';

interface Props {
  editPlayer?: Player;
  onClose: () => void;
}

export function PlayerForm({ editPlayer, onClose }: Props) {
  const { addPlayer, updatePlayer } = useSoccerStore();
  const [name, setName] = useState(editPlayer?.name ?? '');
  const [score, setScore] = useState(editPlayer?.score ?? 5);
  const [position, setPosition] = useState(editPlayer?.position ?? '');

  function handleSave() {
    if (!name.trim()) return;
    if (editPlayer) {
      updatePlayer(editPlayer.id, { name: name.trim(), score, position: position.trim() || undefined });
    } else {
      addPlayer(name.trim(), score, position.trim() || undefined);
    }
    onClose();
  }

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="이름" placeholderTextColor="#9ca3af" />
      <TextInput style={styles.input} value={position} onChangeText={setPosition} placeholder="포지션 (선택, 예: FW)" placeholderTextColor="#9ca3af" />

      <View style={styles.scoreSection}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreLabel}>실력 점수</Text>
          <Text style={styles.scoreCurrent}>{score} — {TIER_LABELS[SCORE_TO_TIER[score]]}</Text>
        </View>
        <View style={styles.scoreRow}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <TouchableOpacity key={n} style={[styles.scoreBtn, score === n && styles.scoreBtnActive]}
              onPress={() => setScore(n)}>
              <Text style={[styles.scoreBtnText, score === n && styles.scoreBtnTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{editPlayer ? '수정 저장' : '선수 추가'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  scoreSection: { gap: 10 },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreLabel: { fontSize: 13, color: '#374151', fontWeight: '600' },
  scoreCurrent: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  scoreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scoreBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  scoreBtnActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  scoreBtnText: { fontSize: 16, fontWeight: '700', color: '#6b7280' },
  scoreBtnTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
