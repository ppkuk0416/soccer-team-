'use client';
import { useState, useMemo } from 'react';
import { useSoccerStore } from '../store/useSupabaseStore';

function fmt(month: string) {
  const [y, m] = month.split('-');
  return `${y}년 ${parseInt(m)}월`;
}

export default function DuesPage() {
  const { players, dues, role, addDue, markDuePaid, removeDue, initMonthlyDues } = useSoccerStore();

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [defaultAmount, setDefaultAmount] = useState(30000);
  const [showInit, setShowInit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addAmount, setAddAmount] = useState(30000);
  const [addPlayerId, setAddPlayerId] = useState('');

  const monthDues = useMemo(
    () => dues.filter((d) => d.month === selectedMonth),
    [dues, selectedMonth]
  );

  const months = useMemo(() => {
    const set = new Set<string>();
    set.add(defaultMonth);
    dues.forEach((d) => set.add(d.month));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [dues, defaultMonth]);

  const paidCount  = monthDues.filter((d) => d.paid).length;
  const totalAmt   = monthDues.reduce((s, d) => s + d.amount, 0);
  const paidAmt    = monthDues.filter((d) => d.paid).reduce((s, d) => s + d.amount, 0);

  async function handleInit() {
    await initMonthlyDues(selectedMonth, defaultAmount);
    setShowInit(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = addPlayerId
      ? players.find((p) => p.id === addPlayerId)?.name ?? addName
      : addName.trim();
    if (!name) return;
    await addDue(addPlayerId || null, name, selectedMonth, addAmount);
    setAddName(''); setAddPlayerId(''); setAddAmount(30000); setShowAdd(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">회비 장부</h1>
          <p className="text-gray-500 text-sm mt-0.5">팀 회비 납부 현황을 관리하세요</p>
        </div>
        {role === 'admin' && (
          <div className="flex gap-2">
            <button onClick={() => setShowInit(!showInit)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-2 rounded-xl transition">
              일괄 등록
            </button>
            <button onClick={() => setShowAdd(!showAdd)}
              className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-2 rounded-xl transition">
              + 개별 추가
            </button>
          </div>
        )}
      </div>

      {/* Month selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {months.map((m) => (
          <button key={m} onClick={() => setSelectedMonth(m)}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
              selectedMonth === m ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500'
            }`}>
            {fmt(m)}
          </button>
        ))}
      </div>

      {/* 일괄 등록 패널 */}
      {showInit && role === 'admin' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">{fmt(selectedMonth)} 일괄 등록</p>
          <p className="text-xs text-gray-400">현재 등록된 선수 {players.length}명에게 아래 금액으로 회비를 일괄 등록합니다. 이미 등록된 선수는 건너뜁니다.</p>
          <div className="flex gap-2 items-center">
            <input type="number" step="1000"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={defaultAmount} onChange={(e) => setDefaultAmount(Number(e.target.value))} />
            <span className="text-sm text-gray-500">원</span>
          </div>
          <button onClick={handleInit}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl text-sm transition">
            {players.length}명 일괄 등록
          </button>
        </div>
      )}

      {/* 개별 추가 패널 */}
      {showAdd && role === 'admin' && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">개별 추가</p>
          <select
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
            value={addPlayerId} onChange={(e) => setAddPlayerId(e.target.value)}>
            <option value="">선수 선택 (직접 입력 가능)</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {!addPlayerId && (
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="이름 직접 입력" />
          )}
          <div className="flex gap-2 items-center">
            <input type="number" step="1000"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={addAmount} onChange={(e) => setAddAmount(Number(e.target.value))} />
            <span className="text-sm text-gray-500">원</span>
          </div>
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl text-sm transition">
            추가
          </button>
        </form>
      )}

      {/* 요약 카드 */}
      {monthDues.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
            <div className="text-xl font-black text-green-600">{paidCount}</div>
            <div className="text-xs text-gray-400 mt-0.5">납부</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
            <div className="text-xl font-black text-red-500">{monthDues.length - paidCount}</div>
            <div className="text-xs text-gray-400 mt-0.5">미납</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
            <div className="text-base font-black text-gray-900">{(paidAmt / 10000).toFixed(1)}만</div>
            <div className="text-xs text-gray-400 mt-0.5">/ {(totalAmt / 10000).toFixed(1)}만원</div>
          </div>
        </div>
      )}

      {/* 진행 바 */}
      {monthDues.length > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>납부율</span>
            <span>{monthDues.length > 0 ? Math.round((paidCount / monthDues.length) * 100) : 0}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full transition-all"
              style={{ width: `${monthDues.length > 0 ? (paidCount / monthDues.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* 납부 목록 */}
      {monthDues.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">💰</p>
          <p className="text-gray-500 text-sm">{fmt(selectedMonth)} 회비 내역이 없습니다</p>
          {role === 'admin' && <p className="text-gray-400 text-xs mt-1">일괄 등록으로 선수 전체에 한 번에 추가할 수 있어요</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {/* 미납 먼저 */}
          {[...monthDues].sort((a, b) => Number(a.paid) - Number(b.paid)).map((due) => (
            <div key={due.id} className={`bg-white rounded-2xl border shadow-sm px-4 py-3 flex items-center justify-between ${
              due.paid ? 'border-green-100' : 'border-red-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  due.paid ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
                }`}>
                  {due.paid ? '✓' : '!'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{due.playerName}</p>
                  <p className="text-xs text-gray-400">{due.amount.toLocaleString()}원
                    {due.paid && due.paidAt && <span> · {new Date(due.paidAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>}
                  </p>
                </div>
              </div>
              {role === 'admin' && (
                <div className="flex items-center gap-2">
                  <button onClick={() => markDuePaid(due.id, !due.paid)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                      due.paid
                        ? 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400'
                        : 'border-green-400 text-green-600 bg-green-50 hover:bg-green-100'
                    }`}>
                    {due.paid ? '취소' : '납부'}
                  </button>
                  <button onClick={() => removeDue(due.id)} className="text-gray-300 hover:text-red-400 transition p-1 text-xs">✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
