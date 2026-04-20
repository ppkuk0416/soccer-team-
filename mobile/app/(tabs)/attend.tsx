import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSoccerStore } from '../../store/useSoccerStore';
import { TierBadge } from '../../components/TierBadge';
import { VoteStatus, SoccerTeam } from '../../types';

const VOTES: { status: VoteStatus; label: string; activeColor: string; activeBg: string }[] = [
  { status: 'attending', label: '참석', activeColor: '#15803d', activeBg: '#f0fdf4' },
  { status: 'maybe',    label: '미정',  activeColor: '#a16207', activeBg: '#fefce8' },
  { status: 'absent',   label: '불참', activeColor: '#dc2626', activeBg: '#fef2f2' },
];

export default function AttendScreen() {
  const router = useRouter();
  const { players, events, role, addEvent, removeEvent, vote, closeEvent } = useSoccerStore();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleCreate() {
    if (!title.trim() || !date.trim()) return;
    addEvent(title.trim(), date.trim(), location.trim() || undefined);
    setTitle(''); setDate(''); setLocation('');
    setShowCreate(false);
  }

  const openEvents = events.filter((e) => e.isOpen);
  const closedEvents = events.filter((e) => !e.isOpen);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>출석 투표</Text>
            <Text style={styles.pageSubtitle}>경기 전 참석 여부를 확인하세요</Text>
          </View>
          {role === 'admin' && (
            <TouchableOpacity style={styles.btnPrimary} onPress={() => setShowCreate(!showCreate)}>
              <Text style={styles.btnPrimaryText}>{showCreate ? '취소' : '+ 일정'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {showCreate && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>새 경기 일정</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="제목 (예: 5월 3일 정기전)" placeholderTextColor="#9ca3af" />
            <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="날짜/시간 (예: 2026-05-03 19:00)" placeholderTextColor="#9ca3af" />
            <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="장소 (선택)" placeholderTextColor="#9ca3af" />
            <TouchableOpacity style={styles.btnPrimary} onPress={handleCreate}>
              <Text style={styles.btnPrimaryText}>등록</Text>
            </TouchableOpacity>
          </View>
        )}

        {openEvents.length === 0 && !showCreate && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyText}>예정된 경기 일정이 없습니다</Text>
          </View>
        )}

        {openEvents.map((event) => {
          const attending = event.votes.filter((v) => v.status === 'attending');
          const voteMap = new Map(event.votes.map((v) => [v.playerId, v.status]));
          const unvoted = players.filter((p) => !voteMap.has(p.id));
          const isExpanded = expandedId === event.id;

          return (
            <View key={event.id} style={styles.card}>
              <View style={styles.eventHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>
                    {event.date}{event.location ? ` · ${event.location}` : ''}
                  </Text>
                </View>
                {role === 'admin' && (
                  <TouchableOpacity onPress={() => removeEvent(event.id)}>
                    <Text style={styles.deleteBtn}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Vote chips */}
              <View style={styles.chips}>
                <View style={styles.chip}><Text style={styles.chipGreen}>✅ {attending.length}</Text></View>
                <View style={styles.chip}><Text style={styles.chipYellow}>🤔 {event.votes.filter(v=>v.status==='maybe').length}</Text></View>
                <View style={styles.chip}><Text style={styles.chipRed}>❌ {event.votes.filter(v=>v.status==='absent').length}</Text></View>
                <View style={styles.chip}><Text style={styles.chipGray}>미투표 {unvoted.length}</Text></View>
              </View>

              <TouchableOpacity style={styles.expandBtn} onPress={() => setExpandedId(isExpanded ? null : event.id)}>
                <Text style={styles.expandBtnText}>{isExpanded ? '▲ 접기' : '▼ 투표하기 / 명단 보기'}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.expanded}>
                  {players.length === 0 ? (
                    <Text style={styles.emptyText}>팀 탭에서 선수를 먼저 등록해주세요</Text>
                  ) : (
                    [...players].sort((a, b) => a.name.localeCompare(b.name)).map((p) => {
                      const myVote = voteMap.get(p.id);
                      return (
                        <View key={p.id} style={styles.voteRow}>
                          <View style={styles.votePlayer}>
                            <Text style={styles.voteName}>{p.name}</Text>
                            <TierBadge tier={p.tier} status={p.status} />
                          </View>
                          <View style={styles.voteBtns}>
                            {VOTES.map(({ status, label, activeColor, activeBg }) => (
                              <TouchableOpacity key={status}
                                style={[styles.voteBtn, myVote === status && { backgroundColor: activeBg, borderColor: activeColor }]}
                                onPress={() => vote(event.id, p.id, p.name, status)}>
                                <Text style={[styles.voteBtnText, myVote === status && { color: activeColor, fontWeight: '700' }]}>{label}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      );
                    })
                  )}

                  {role === 'admin' && (
                    <View style={styles.adminBtns}>
                      <TouchableOpacity style={styles.lineupBtn} onPress={() => router.push(`/lineup/${event.id}`)}>
                        <Text style={styles.lineupBtnText}>🗒️ 라인업 설정</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.closeBtn} onPress={() => closeEvent(event.id)}>
                        <Text style={styles.closeBtnText}>투표 마감</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {closedEvents.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>마감된 일정</Text>
            {closedEvents.map((event) => (
              <View key={event.id} style={styles.closedCard}>
                <View>
                  <Text style={styles.closedTitle}>{event.title}</Text>
                  <Text style={styles.closedDate}>{event.date}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.closedAttend}>✅ {event.votes.filter(v=>v.status==='attending').length}</Text>
                  {role === 'admin' && (
                    <TouchableOpacity onPress={() => removeEvent(event.id)}>
                      <Text style={styles.deleteBtn}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
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
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  pageSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  btnPrimary: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText: { color: '#9ca3af', fontSize: 13 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eventTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  eventDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  deleteBtn: { color: '#d1d5db', fontSize: 16, padding: 4 },
  chips: { flexDirection: 'row', gap: 6 },
  chip: { backgroundColor: '#f9fafb', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  chipGreen: { fontSize: 11, fontWeight: '600', color: '#15803d' },
  chipYellow: { fontSize: 11, fontWeight: '600', color: '#a16207' },
  chipRed: { fontSize: 11, fontWeight: '600', color: '#dc2626' },
  chipGray: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  expandBtn: { backgroundColor: '#f9fafb', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  expandBtnText: { fontSize: 12, color: '#6b7280' },
  expanded: { gap: 8 },
  voteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  votePlayer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  voteName: { fontSize: 13, fontWeight: '500', color: '#111827' },
  voteBtns: { flexDirection: 'row', gap: 4 },
  voteBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  voteBtnText: { fontSize: 11, color: '#6b7280' },
  adminBtns: { flexDirection: 'row', gap: 8, marginTop: 4 },
  lineupBtn: { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, alignItems: 'center' },
  lineupBtnText: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
  closeBtn: { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 12, alignItems: 'center' },
  closeBtnText: { fontSize: 12, color: '#9ca3af' },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', marginBottom: 6 },
  closedCard: { backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  closedTitle: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  closedDate: { fontSize: 11, color: '#9ca3af' },
  closedAttend: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
});
