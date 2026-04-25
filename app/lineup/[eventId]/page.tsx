'use client';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSoccerStore } from '../../store/useSupabaseStore';
import { FORMATIONS, LineupSlot, Position, POSITION_LABELS } from '../../types';
import { TierBadge, tierAvatarColors } from '../../components/TierBadge';

const POS_ORDER: Position[] = ['FWD', 'MID', 'DEF', 'GK'];

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

  const attendingIds = event?.votes.filter((v) => v.status === 'attending').map((v) => v.playerId) ?? [];
  const assignedIds = allSlots.map((s) => s.playerId).filter(Boolean) as string[];
  const availablePlayers = players.filter((p) => !assignedIds.includes(p.id));

  if (!event) return (
    <div className="text-center py-20 text-stone-400 text-sm">일정을 찾을 수 없습니다</div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white shadow-sm text-stone-400 hover:text-stone-600 transition flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-gray-900">라인업 설정</h1>
          <p className="text-xs text-stone-400 truncate">
            {event.title} · {new Date(event.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
          </p>
        </div>
        {existing?.isPublished && (
          <span className="flex-shrink-0 text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-bold">
            공개됨
          </span>
        )}
      </div>

      {/* Formation selector */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-3">포메이션</p>
        <div className="flex flex-wrap gap-2">
          {FORMATIONS.map((f) => (
            <button key={f.id} onClick={() => { setFormationId(f.id); setSlots([]); }}
              className={`text-sm px-3.5 py-2 rounded-xl font-bold transition-all ${
                formationId === f.id
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Field visual */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="relative bg-gradient-to-b from-emerald-700 via-emerald-600 to-emerald-700 p-5 space-y-4">
          {/* Field lines decoration */}
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
            <div className="absolute top-1/2 left-4 right-4 border-t border-white -translate-y-0.5" />
            <div className="absolute top-1/2 left-1/2 w-20 h-20 rounded-full border border-white -translate-x-1/2 -translate-y-1/2" />
          </div>

          {POS_ORDER.filter((pos) => formation.slots.some((s) => s.pos === pos)).map((pos) => {
            const posSlots = allSlots.filter((s) => s.position === pos);
            return (
              <div key={pos}>
                <p className="text-[9px] font-bold text-emerald-200/80 text-center uppercase tracking-widest mb-2.5">
                  {POSITION_LABELS[pos]}
                </p>
                <div className="flex justify-center gap-3 flex-wrap">
                  {posSlots.map((slot) => (
                    <div key={`${slot.position}-${slot.index}`}>
                      {slot.playerId ? (
                        <button onClick={() => role === 'admin' && clearSlot(slot.position, slot.index)}
                          className="flex flex-col items-center gap-1 min-w-[52px] group">
                          <div className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center text-sm font-black text-stone-700 group-active:scale-95 transition-transform">
                            {slot.playerName!.charAt(0)}
                          </div>
                          <span className="text-[10px] text-white font-semibold max-w-[56px] truncate leading-tight">
                            {slot.playerName}
                          </span>
                          {role === 'admin' && (
                            <span className="text-[9px] text-white/40 -mt-0.5">탭하여 해제</span>
                          )}
                        </button>
                      ) : role === 'admin' ? (
                        <button onClick={() => setPickingSlot({ pos: slot.position, idx: slot.index })}
                          className="flex flex-col items-center gap-1 min-w-[52px] group">
                          <div className="w-11 h-11 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center text-white/50 text-xl group-hover:border-white/60 group-active:scale-95 transition-all">
                            +
                          </div>
                          <span className="text-[10px] text-white/40">{POSITION_LABELS[pos]}</span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-center gap-1 min-w-[52px]">
                          <div className="w-11 h-11 rounded-full border-2 border-dashed border-white/20" />
                          <span className="text-[10px] text-white/25">미정</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assigned count + attendance */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-stone-400">
          배정 <span className="font-bold text-stone-700">{assignedIds.length}</span>/{allSlots.length}명
        </span>
        {attendingIds.length > 0 && (
          <span className="text-xs text-green-600 font-semibold">오늘 참석 {attendingIds.length}명</span>
        )}
      </div>

      {/* Notes */}
      {role === 'admin' && (
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="전술 메모 (선택사항)"
          className="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none h-16 placeholder:text-stone-400" />
      )}

      {role !== 'admin' && notes && (
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 text-sm text-stone-600 flex gap-2">
          <svg className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span>{notes}</span>
        </div>
      )}

      {/* Actions */}
      {role === 'admin' && (
        <div className="flex gap-2">
          <button onClick={handleSave}
            className="flex-1 bg-stone-100 text-stone-700 font-bold py-3.5 rounded-xl hover:bg-stone-200 transition text-sm">
            임시 저장
          </button>
          <button onClick={handlePublish}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition text-sm shadow-sm">
            라인업 공개
          </button>
        </div>
      )}

      {/* Player picker modal */}
      {pickingSlot && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setPickingSlot(null)}>
          <div className="bg-white w-full rounded-t-2xl max-h-[65vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-4 border-b border-stone-100">
              <h3 className="font-bold text-gray-900">
                {POSITION_LABELS[pickingSlot.pos]} 선수 선택
              </h3>
              <button onClick={() => setPickingSlot(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 text-stone-400 hover:bg-stone-200 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-3">
              {availablePlayers.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-10">배정 가능한 선수가 없습니다</p>
              ) : (
                <div className="space-y-1.5">
                  {availablePlayers.map((p) => {
                    const avatarCls = tierAvatarColors(p.tier, p.status);
                    const isAttending = attendingIds.includes(p.id);
                    return (
                      <button key={p.id} onClick={() => assignPlayer(p.id, p.name)}
                        className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-stone-50 hover:bg-green-50 active:scale-[0.99] transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl ${avatarCls} flex items-center justify-center text-sm font-black`}>
                            {p.name.charAt(0)}
                          </div>
                          <div className="text-left">
                            <span className="font-bold text-gray-900 text-sm">{p.name}</span>
                            <div className="mt-0.5">
                              <TierBadge tier={p.tier} status={p.status} />
                            </div>
                          </div>
                        </div>
                        {isAttending && (
                          <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                            참석
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
