'use client';
import { useState, useMemo } from 'react';
import { useSupabaseStore } from '../store/useSupabaseStore';

const INPUT = "w-full bg-gray-50 border-0 rounded-xl px-3.5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:text-gray-400";

function fmt(month: string) {
  const [y, m] = month.split('-');
  return `${y}년 ${parseInt(m)}월`;
}

export default function DuesPage() {
  const { players, dues, role, addDue, markDuePaid, removeDue, initMonthlyDues } = useSupabaseStore();

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [defaultAmount, setDefaultAmount] = useState(30000);
  const [showInit, setShowInit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addAmount, setAddAmount] = useState(30000);
  const [addPlayerId, setAddPlayerId] = useState('');

  const monthDues = useMemo(() => dues.filter((d) => d.month === selectedMonth), [dues, selectedMonth]);

  const months = useMemo(() => {
    const set = new Set<string>();
    set.add(defaultMonth);
    dues.forEach((d) => set.add(d.month));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [dues, defaultMonth]);

  const paidCount = monthDues.filter((d) => d.paid).length;
  const totalAmt  = monthDues.reduce((s, d) => s + d.amount, 0);
  const paidAmt   = monthDues.filter((d) => d.paid).reduce((s, d) => s + d.amount, 0);
  const paidPct   = monthDues.length > 0 ? Math.round((paidCount / monthDues.length) * 100) : 0;

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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-gray-900">회비 장부</h1>
          <p className="text-gray-400 text-sm mt-0.5">팀 회비 납부 현황</p>
        </div>
        {role === 'admin' && (
          <div className="flex gap-2">
            <button onClick={() => { setShowInit(!showInit); setShowAdd(false); }}
              className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${showInit ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              일괄 등록
            </button>
            <button onClick={() => { setShowAdd(!showAdd); setShowInit(false); }}
              className={`text-xs font-bold px-3 py-2 rounded-xl transition ${showAdd ? 'bg-gray-200 text-gray-700' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
              + 추가
            </button>
          </div>
        )}
      </div>

      {/* Month selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {months.map((m) => (
          <button key={m} onClick={() => setSelectedMonth(m)}
            className={`flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition ${
              selectedMonth === m
                ? 'bg-[#1C1C1E] text-white'
                : 'bg-white text-gray-500 shadow-sm'
            }`}>
            {fmt(m)}
          </button>
        ))}
      </div>

      {/* 일괄 등록 패널 */}
      {showInit && role === 'admin' && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <p className="text-sm font-bold text-gray-800">{fmt(selectedMonth)} 일괄 등록</p>
          <p className="text-xs text-gray-400">
            등록된 선수 {players.length}명에게 아래 금액으로 일괄 등록합니다. 이미 등록된 선수는 건너뜁니다.
          </p>
          <div className="flex gap-2 items-center">
            <input type="number" step="1000" className={INPUT}
              value={defaultAmount} onChange={(e) => setDefaultAmount(Number(e.target.value))} />
            <span className="text-sm text-gray-500 shrink-0">원</span>
          </div>
          <button onClick={handleInit}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm transition">
            {players.length}명 일괄 등록
          </button>
        </div>
      )}

      {/* 개별 추가 패널 */}
      {showAdd && role === 'admin' && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <p className="text-sm font-bold text-gray-800">개별 추가</p>
          <select className={INPUT} value={addPlayerId} onChange={(e) => setAddPlayerId(e.target.value)}>
            <option value="">선수 선택 (직접 입력 가능)</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {!addPlayerId && (
            <input className={INPUT}
              value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="이름 직접 입력" />
          )}
          <div className="flex gap-2 items-center">
            <input type="number" step="1000" className={INPUT}
              value={addAmount} onChange={(e) => setAddAmount(Number(e.target.value))} />
            <span className="text-sm text-gray-500 shrink-0">원</span>
          </div>
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm transition">
            추가
          </button>
        </form>
      )}

      {/* 요약 */}
      {monthDues.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <div className="text-2xl font-black text-green-600">{paidCount}</div>
              <div className="text-xs text-gray-400 mt-0.5">납부</div>
            </div>
            <div>
              <div className="text-2xl font-black text-red-500">{monthDues.length - paidCount}</div>
              <div className="text-xs text-gray-400 mt-0.5">미납</div>
            </div>
            <div>
              <div className="text-lg font-black text-gray-900">{(paidAmt / 10000).toFixed(1)}만</div>
              <div className="text-xs text-gray-400 mt-0.5">/ {(totalAmt / 10000).toFixed(1)}만원</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${paidPct}%` }} />
            </div>
            <span className="text-xs font-bold text-gray-500 w-8 text-right">{paidPct}%</span>
          </div>
        </div>
      )}

      {/* 납부 목록 */}
      {monthDues.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">💰</p>
          <p className="text-gray-500 text-sm font-medium">{fmt(selectedMonth)} 회비 내역이 없습니다</p>
          {role === 'admin' && (
            <p className="text-gray-400 text-xs mt-1">일괄 등록으로 전체 선수에게 한 번에 추가하세요</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {[...monthDues].sort((a, b) => Number(a.paid) - Number(b.paid)).map((due) => (
            <div key={due.id} className="bg-white rounded-2xl shadow-sm px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  due.paid ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
                }`}>
                  {due.paid ? '✓' : '!'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{due.playerName}</p>
                  <p className="text-xs text-gray-400">
                    {due.amount.toLocaleString()}원
                    {due.paid && due.paidAt && (
                      <span> · {new Date(due.paidAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                    )}
                  </p>
                </div>
              </div>
              {role === 'admin' && (
                <div className="flex items-center gap-2">
                  <button onClick={() => markDuePaid(due.id, !due.paid)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition ${
                      due.paid
                        ? 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}>
                    {due.paid ? '취소' : '납부'}
                  </button>
                  <button onClick={() => removeDue(due.id)}
                    className="text-gray-300 hover:text-red-400 transition p-1 text-sm">
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
