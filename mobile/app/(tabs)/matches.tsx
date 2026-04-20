import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSoccerStore } from '../../store/useSoccerStore';
import { MatchRecord } from '../../types';

function getMvpResult(votes: MatchRecord['mvpVotes']) {
  if (!votes.length) return null;
  const counts = new Map<string, { name: string; count: number }>();
  votes.forEach((v) => {
    const prev = counts.get(v.mvpPlayerId);
    counts.set(v.mvpPlayerId, { name: v.mvpPlayerName, count: (prev?.count ?? 0) + 1 });
  });
  return [...counts.values()].sort((a, b) => b.count - a.count)[0];
}

export default function MatchesScreen() {
  const { players, matchRecords, role, addMatchRecord, removeMatchRecord, voteForMvp, closeMvpVoting, incrementMatchCount } = useSoccerStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [teamAName, setTeamAName] = useState('A팀');
  const [teamBName, setTeamBName] = useState('B팀');
  const [scoreA, setScoreA] = useState('0');
  const [scoreB, setScoreB] = useState('0');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [myVoterId, setMyVoterId] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);

  function togglePlayer(id: string) {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function handleSave() {
    if (!title.trim()) return;
    const playerIds = [...selectedIds];
    addMatchRecord({ date, title: title.trim(), teamAName, teamBName, scoreA: Number(scoreA), scoreB: Number(scoreB), playerIds, notes: notes.trim() || undefined });
    incrementMatchCount(playerIds);
    setShowForm(false);
    setTitle(''); setScoreA('0'); setScoreB('0'); setSelectedIds(new Set()); setNotes('');
  }

  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>경기 기록</Text>
            <Text style={styles.pageSubtitle}>총 {matchRecords.length}경기</Text>
          </View>
          {role === 'admin' && (
            <TouchableOpacity style={styles.btnPrimary} onPress={() => setShowForm(!showForm)}>
              <Text style={styles.btnPrimaryText}>{showForm ? '취소' : '+ 기록'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {showForm && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>새 경기 기록</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="경기 제목" placeholderTextColor="#9ca3af" />
            <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="날짜 (YYYY-MM-DD)" placeholderTextColor="#9ca3af" />

            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1 }]} value={teamAName} onChangeText={setTeamAName} />
              <Text style={styles.vs}>vs</Text>
              <TextInput style={[styles.input, { flex: 1 }]} value={teamBName} onChangeText={setTeamBName} />
            </View>

            <View style={styles.scoreRow}>
              <View style={styles.scoreBlock}>
                <Text style={styles.scoreLabel}>{teamAName}</Text>
                <TextInput style={styles.scoreInput} value={scoreA} onChangeText={setScoreA} keyboardType="number-pad" />
              </View>
              <Text style={styles.colon}>:</Text>
              <View style={styles.scoreBlock}>
                <Text style={styles.scoreLabel}>{teamBName}</Text>
                <TextInput style={styles.scoreInput} value={scoreB} onChangeText={setScoreB} keyboardType="number-pad" />
              </View>
            </View>

            <TouchableOpacity style={styles.playerPickerBtn} onPress={() => setPickerVisible(true)}>
              <Text style={styles.playerPickerText}>참여 선수 선택 ({selectedIds.size}명)</Text>
            </TouchableOpacity>

            <TextInput style={[styles.input, styles.textarea]} value={notes} onChangeText={setNotes} placeholder="경기 메모 (선택)" placeholderTextColor="#9ca3af" multiline />

            <TouchableOpacity style={styles.btnPrimary} onPress={handleSave}>
              <Text style={styles.btnPrimaryText}>저장 & MVP 투표 시작</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Voter selection */}
        {matchRecords.some((m) => m.mvpOpen) && players.length > 0 && (
          <View style={styles.voterCard}>
            <Text style={styles.voterLabel}>MVP 투표용 내 선수 선택</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => setMyVoterId('')}
                  style={[styles.voterBtn, !myVoterId && styles.voterBtnActive]}>
                  <Text style={[styles.voterBtnText, !myVoterId && styles.voterBtnTextActive]}>선택 안 함</Text>
                </TouchableOpacity>
                {players.map((p) => (
                  <TouchableOpacity key={p.id} onPress={() => setMyVoterId(p.id)}
                    style={[styles.voterBtn, myVoterId === p.id && styles.voterBtnActive]}>
                    <Text style={[styles.voterBtnText, myVoterId === p.id && styles.voterBtnTextActive]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {matchRecords.length === 0 && !showForm && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>경기 기록이 없습니다</Text>
          </View>
        )}

        {matchRecords.map((m) => {
          const mvp = getMvpResult(m.mvpVotes);
          const myVote = m.mvpVotes.find((v) => v.voterId === myVoterId);
          const result = m.scoreA > m.scoreB ? `${m.teamAName} 승` : m.scoreA < m.scoreB ? `${m.teamBName} 승` : '무승부';
          const resultColor = m.scoreA > m.scoreB ? '#2563eb' : m.scoreA < m.scoreB ? '#dc2626' : '#6b7280';
          const participants = players.filter((p) => m.playerIds.includes(p.id));

          return (
            <View key={m.id} style={styles.card}>
              <View style={styles.matchHeader}>
                <View>
                  <Text style={styles.matchTitle}>{m.title}</Text>
                  <Text style={styles.matchDate}>{m.date}</Text>
                </View>
                {role === 'admin' && (
                  <TouchableOpacity onPress={() => removeMatchRecord(m.id)}>
                    <Text style={styles.deleteBtn}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.scoreDisplay}>
                <View style={styles.scoreTeam}>
                  <Text style={styles.scoreTeamName}>{m.teamAName}</Text>
                  <Text style={styles.scoreNum}>{m.scoreA}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.colonDisplay}>:</Text>
                  <Text style={[styles.resultText, { color: resultColor }]}>{result}</Text>
                </View>
                <View style={styles.scoreTeam}>
                  <Text style={styles.scoreTeamName}>{m.teamBName}</Text>
                  <Text style={styles.scoreNum}>{m.scoreB}</Text>
                </View>
              </View>

              {participants.length > 0 && (
                <View style={styles.tags}>
                  {participants.map((p) => (
                    <View key={p.id} style={styles.tag}>
                      <Text style={styles.tagText}>{p.name}</Text>
                    </View>
                  ))}
                </View>
              )}

              {m.notes && <Text style={styles.notesText}>{m.notes}</Text>}

              {mvp && !m.mvpOpen && (
                <View style={styles.mvpBox}>
                  <Text style={styles.mvpTrophy}>🏆</Text>
                  <View>
                    <Text style={styles.mvpLabel}>MVP</Text>
                    <Text style={styles.mvpName}>{mvp.name}</Text>
                  </View>
                  <Text style={styles.mvpCount}>{mvp.count}표</Text>
                </View>
              )}

              {m.mvpOpen && (
                <View style={styles.votingBox}>
                  <View style={styles.votingHeader}>
                    <Text style={styles.votingTitle}>🏆 MVP 투표 진행중</Text>
                    {role === 'admin' && (
                      <TouchableOpacity onPress={() => closeMvpVoting(m.id)}>
                        <Text style={styles.closeVoteBtn}>마감</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {m.mvpVotes.length > 0 && (() => {
                    const counts = new Map<string, { name: string; count: number }>();
                    m.mvpVotes.forEach((v) => { const p = counts.get(v.mvpPlayerId); counts.set(v.mvpPlayerId, { name: v.mvpPlayerName, count: (p?.count ?? 0) + 1 }); });
                    return [...counts.entries()].sort((a, b) => b[1].count - a[1].count).map(([id, { name, count }]) => (
                      <View key={id} style={styles.tallyRow}>
                        <Text style={styles.tallyName}>{name}</Text>
                        <Text style={styles.tallyCount}>{count}표</Text>
                      </View>
                    ));
                  })()}
                  {myVoterId && !myVote && (
                    <View style={styles.candidateGrid}>
                      {participants.filter(p => p.id !== myVoterId).map((p) => (
                        <TouchableOpacity key={p.id} style={styles.candidateBtn}
                          onPress={() => voteForMvp(m.id, myVoterId, p.id, p.name)}>
                          <Text style={styles.candidateName}>{p.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {myVote && <Text style={styles.votedText}>✅ {myVote.mvpPlayerName}에게 투표했습니다</Text>}
                  {!myVoterId && <Text style={styles.noVoterText}>위에서 내 선수를 선택하면 투표할 수 있습니다</Text>}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Player picker modal */}
      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>참여 선수 선택</Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)}>
              <Text style={styles.modalClose}>완료</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
            {sortedPlayers.map((p) => (
              <TouchableOpacity key={p.id} style={[styles.pickerItem, selectedIds.has(p.id) && styles.pickerItemActive]}
                onPress={() => togglePlayer(p.id)}>
                <Text style={[styles.pickerName, selectedIds.has(p.id) && styles.pickerNameActive]}>{p.name}</Text>
                {selectedIds.has(p.id) && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  pageSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  textarea: { height: 64, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vs: { color: '#d1d5db', fontWeight: '700' },
  btnPrimary: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  scoreRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 },
  scoreBlock: { alignItems: 'center', gap: 4 },
  scoreLabel: { fontSize: 11, color: '#9ca3af' },
  scoreInput: { width: 64, textAlign: 'center', fontSize: 24, fontWeight: '900', color: '#111827', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingVertical: 8 },
  colon: { fontSize: 24, fontWeight: '700', color: '#d1d5db', marginTop: 16 },
  playerPickerBtn: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  playerPickerText: { fontSize: 13, color: '#6b7280' },
  voterCard: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fef3c7', borderRadius: 12, padding: 12 },
  voterLabel: { fontSize: 11, fontWeight: '600', color: '#92400e' },
  voterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  voterBtnActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  voterBtnText: { fontSize: 12, color: '#6b7280' },
  voterBtnTextActive: { color: '#fff', fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText: { color: '#9ca3af', fontSize: 13 },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  matchTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  matchDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  deleteBtn: { color: '#d1d5db', fontSize: 16, padding: 4 },
  scoreDisplay: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24 },
  scoreTeam: { alignItems: 'center', gap: 4 },
  scoreTeamName: { fontSize: 11, color: '#9ca3af' },
  scoreNum: { fontSize: 36, fontWeight: '900', color: '#111827' },
  colonDisplay: { fontSize: 20, fontWeight: '700', color: '#e5e7eb' },
  resultText: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: { backgroundColor: '#f3f4f6', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 11, color: '#6b7280' },
  notesText: { fontSize: 11, color: '#9ca3af', fontStyle: 'italic' },
  mvpBox: { backgroundColor: '#fffbeb', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  mvpTrophy: { fontSize: 22 },
  mvpLabel: { fontSize: 10, color: '#d97706', fontWeight: '600' },
  mvpName: { fontSize: 14, fontWeight: '900', color: '#92400e' },
  mvpCount: { marginLeft: 'auto', fontSize: 12, color: '#d97706' },
  votingBox: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, gap: 8 },
  votingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  votingTitle: { fontSize: 12, fontWeight: '600', color: '#374151' },
  closeVoteBtn: { fontSize: 12, color: '#9ca3af' },
  tallyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  tallyName: { fontSize: 12, color: '#6b7280' },
  tallyCount: { fontSize: 12, fontWeight: '700', color: '#d97706' },
  candidateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  candidateBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 },
  candidateName: { fontSize: 12, color: '#374151' },
  votedText: { fontSize: 12, color: '#16a34a', textAlign: 'center', paddingVertical: 4 },
  noVoterText: { fontSize: 11, color: '#9ca3af', textAlign: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  modalClose: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  pickerItemActive: { borderColor: '#4ade80', backgroundColor: '#f0fdf4' },
  pickerName: { fontSize: 14, color: '#374151' },
  pickerNameActive: { color: '#15803d', fontWeight: '600' },
  checkMark: { color: '#16a34a', fontWeight: '700' },
});
