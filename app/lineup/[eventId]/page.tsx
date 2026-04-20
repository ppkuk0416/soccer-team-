'use client';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSoccerStore } from '../../store/useSupabaseStore';
import { FORMATIONS, LineupSlot, Position, POSITION_LABELS } from '../../types';
import { TierBadge } from '../../components/TierBadge';

const POS_ORDER: Position[] = ['FWD', 'MID', 'DEF', 'GK'];
const POS_COLOR: Record<Position, string> = {
  FWD: 'border-orange-300 text-orange-700 bg-orange-50',
  MID: 'border-green-300 text-green-700 bg-green-50',
  DEF: 'border-blue-300 text-blue-700 bg-blue-50',
  GK:  'border-yellow-300 text-yellow-700 bg-yellow-50',
  SUB: 'border-gray-200 text-gray-500 bg-gray-50',
};

export default function LineupPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const { events, players, lineups, role, saveLineup, publishLineup } = useSoccerStore();

  const event = events.find((e) => e.id === eventId);
  const existing = lineups.find((l) => l.eventId === eventId);

  const [formationId, setFormationId] = useState(existing?.formationId ?? '4-4-2');
  const [slots, setSlots] = useState<LineupSlot[]>(existing?.slots ?? []);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [pickingSlot, setPickingSlot] = useState<{ pos: Position; idx: number } | null>(null);

  const formation = FORMATIONS.find((f) => f.id === formationId)!;

  // Build all slots from formation definition
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

  function handleSave() {
    saveLineup(eventId, formationId, allSlots, notes);
    router.back();
  }

  function handlePublish() {
    saveLineup(eventId, formationId, allSlots, notes);
    publishLineup(eventId);
    router.back();
  }

  // Attending players for this event
  const attendingIds = event?.votes.filter((v) => v.status === 'attending').map((v) => v.playerId) ?? [];
  const assignedIds = allSlots.map((s) => s.playerId).filter(Boolean) as string[];
  const availablePlayers = players.filter((p) => !assignedIds.includes(p.id));

  if (!event) return <div className="text-center py-20 text-gray-400">일정을 찾을 수 없습니다</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">라인업 설정</h1>
          <p className="text-xs text-gray-400">{event.title} · {new Date(event.date).toLocaleDateString('ko-KR')}</p>
        </div>
        {existing?.isPublished && (
          <span className="ml-auto text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-1 rounded-full font-semibold">공개됨</span>
        )}
      </div>

      {/* Formation selector */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">포메이션</p>
        <div className="flex flex-wrap gap-2">
          {FORMATIONS.map((f) => (
            <button key={f.id} onClick={() => { setFormationId(f.id); setSlots([]); }}
              className={`text-sm px-3 py-1.5 rounded-xl border font-medium transition ${formationId === f.id ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Field visual */}
      <div className="rounded-2xl overflow-hidden border border-green-800/20 shadow-sm">
        <div className="bg-gradient-to-b from-green-700 to-green-600 p-4 space-y-3">
          {POS_ORDER.filter((pos) => formation.slots.some((s) => s.pos === pos)).map((pos) => {
            const posSlots = allSlots.filter((s) => s.position === pos);
            return (
              <div key={pos}>
                <p className="text-[10px] text-green-200 text-center mb-2">{POSITION_LABELS[pos]}</p>
                <div className="flex justify-center gap-2 flex-wrap">
                  {posSlots.map((slot) => (
                    <div key={`${slot.position}-${slot.index}`}>
                      {slot.playerId ? (
                        <button onClick={() => role === 'admin' && clearSlot(slot.position, slot.index)}
                          className="flex flex-col items-center gap-0.5 min-w-[56px]">
                          <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-sm font-bold text-gray-700">
                            {slot.playerName!.charAt(0)}
                          </div>
                          <span className="text-[10px] text-white font-medium max-w-[60px] truncate">{slot.playerName}</span>
                        </button>
                      ) : (
                        role === 'admin' ? (
                          <button onClick={() => setPickingSlot({ pos: slot.position, idx: slot.index })}
                            className="flex flex-col items-center gap-0.5 min-w-[56px]">
                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center text-white/60 text-lg">+</div>
                            <span className="text-[10px] text-white/40">{POSITION_LABELS[pos]}</span>
                          </button>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5 min-w-[56px]">
                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/30" />
                            <span className="text-[10px] text-white/30">미정</span>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assigned count */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>배정 선수: {assignedIds.length}/{allSlots.length}</span>
        {attendingIds.length > 0 && <span className="text-green-600">오늘 참석 {attendingIds.length}명</span>}
      </div>

      {/* Notes */}
      {role === 'admin' && (
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="전술 메모 (선택)"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none h-16" />
      )}

      {/* Notes display for member */}
      {role !== 'admin' && notes && (
        <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 border border-gray-100">
          📝 {notes}
        </div>
      )}

      {/* Actions */}
      {role === 'admin' && (
        <div className="flex gap-2">
          <button onClick={handleSave}
            className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">
            임시 저장
          </button>
          <button onClick={handlePublish}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition text-sm">
            라인업 공개
          </button>
        </div>
      )}

      {/* Player picker modal */}
      {pickingSlot && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setPickingSlot(null)}>
          <div className="bg-white w-full rounded-t-2xl max-h-[60vh] overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-900 text-sm">
                {POSITION_LABELS[pickingSlot.pos]} 선수 선택
              </h3>
              <button onClick={() => setPickingSlot(null)} className="text-gray-400">✕</button>
            </div>
            {availablePlayers.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">배정 가능한 선수가 없습니다</p>
            ) : (
              <div className="space-y-2">
                {availablePlayers.map((p) => (
                  <button key={p.id} onClick={() => assignPlayer(p.id, p.name)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 hover:bg-green-50 hover:border-green-200 transition">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                        {p.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-gray-900 text-sm">{p.name}</span>
                        <div className="mt-0.5"><TierBadge tier={p.tier} status={p.status} /></div>
                      </div>
                    </div>
                    {attendingIds.includes(p.id) && <span className="text-xs text-green-500 font-medium">✅ 참석</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
