import React, { useState } from 'react';
import { Settings, Play, Plus, RotateCcw, X, Trophy, History, Coins, User, Crown, Ghost } from 'lucide-react';

export default function App() {
  const [phase, setPhase] = useState('setup'); 
  
  // Game Settings
  const [basePoint, setBasePoint] = useState(100);
  const [taiPoint, setTaiPoint] = useState(20);
  const [players, setPlayers] = useState(['玩家一', '玩家二', '玩家三', '玩家四']);
  const [initialDealer, setInitialDealer] = useState(0);
  
  // Game State
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [history, setHistory] = useState([]);
  const [dealerIdx, setDealerIdx] = useState(0);
  const [lianZhuang, setLianZhuang] = useState(0);
  
  // Modal States
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  
  // Record Form State
  const [recordType, setRecordType] = useState('zimo'); // 'zimo', 'hu', 'draw'
  const [winnerIdx, setWinnerIdx] = useState(0);
  const [loserIdx, setLoserIdx] = useState(1);
  const [recordTai, setRecordTai] = useState(0);

  // Initialize Game
  const startGame = () => {
    if (players.some(p => p.trim() === '')) {
      alert('請填寫所有玩家名稱！');
      return;
    }
    setScores([0, 0, 0, 0]);
    setHistory([]);
    setDealerIdx(initialDealer);
    setLianZhuang(0);
    setPhase('game');
  };

  // Submit new record
  const submitRecord = () => {
    if (recordType === 'hu' && winnerIdx === loserIdx) return;

    let newScores = [...scores];
    let deltas = [0, 0, 0, 0];
    let extraTai = 1 + (lianZhuang * 2); // 莊家1台 + 連N拉N(2N台)
    let b = Number(basePoint);
    let t = Number(taiPoint);
    let rTai = Number(recordTai);
    let historyEntry;

    if (recordType === 'draw') {
      // 流局處理
      historyEntry = {
        id: Date.now(),
        type: 'draw',
        dealerWhenRecorded: dealerIdx,
        lianWhenRecorded: lianZhuang,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setLianZhuang(prev => prev + 1);
      
    } else {
      // 自摸與胡牌處理
      if (recordType === 'zimo') {
        let totalWin = 0;
        for (let i = 0; i < 4; i++) {
          if (i === winnerIdx) continue;
          let isDealerInvolved = (winnerIdx === dealerIdx || i === dealerIdx);
          let finalTai = rTai + (isDealerInvolved ? extraTai : 0);
          let pay = b + (finalTai * t);
          
          newScores[i] -= pay;
          deltas[i] -= pay;
          totalWin += pay;
        }
        newScores[winnerIdx] += totalWin;
        deltas[winnerIdx] += totalWin;
      } else if (recordType === 'hu') {
        let isDealerInvolved = (winnerIdx === dealerIdx || loserIdx === dealerIdx);
        let finalTai = rTai + (isDealerInvolved ? extraTai : 0);
        let pay = b + (finalTai * t);

        newScores[loserIdx] -= pay;
        newScores[winnerIdx] += pay;
        deltas[loserIdx] -= pay;
        deltas[winnerIdx] += pay;
      }

      historyEntry = {
        id: Date.now(),
        type: recordType,
        winner: winnerIdx,
        loser: recordType === 'zimo' ? null : loserIdx,
        tai: rTai,
        extraTai: extraTai,
        deltas: deltas,
        dealerWhenRecorded: dealerIdx,
        lianWhenRecorded: lianZhuang,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // 判斷是否換莊
      if (winnerIdx === dealerIdx) {
        setLianZhuang(prev => prev + 1);
      } else {
        setDealerIdx(prev => (prev + 1) % 4);
        setLianZhuang(0);
      }
    }

    setScores(newScores);
    setHistory([historyEntry, ...history]);
    setShowRecordModal(false);
    setRecordTai(0);
  };

  const handleSettle = () => {
    const historyEntry = {
      id: Date.now(),
      type: 'settle',
      deltas: [...scores], 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setHistory([historyEntry, ...history]);
    setScores([0, 0, 0, 0]);
    setShowSettleModal(false);
  };

  // 生成即時計算預覽字串
  const getPreviewText = () => {
    let b = Number(basePoint);
    let t = Number(taiPoint);
    let extra = 1 + (lianZhuang * 2);
    let rTai = Number(recordTai);

    if (recordType === 'hu') {
      let isDealer = (winnerIdx === dealerIdx || loserIdx === dealerIdx);
      if (isDealer) {
        let pay = b + (rTai + extra) * t;
        return <div className="text-red-600 font-bold bg-red-50 p-3 rounded-xl border-2 border-red-200">⚠️ 包含莊家/連莊加成 (+{extra}台)<br/>結算金額: <span className="text-xl text-red-700">{pay}</span> 積分</div>;
      } else {
        let pay = b + rTai * t;
        return <div className="text-gray-600 font-bold bg-gray-100 p-3 rounded-xl border-2 border-gray-200">無莊家加成<br/>結算金額: <span className="text-xl text-gray-900">{pay}</span> 積分</div>;
      }
    } else if (recordType === 'zimo') {
      if (winnerIdx === dealerIdx) {
        let pay = b + (rTai + extra) * t;
        return <div className="text-red-600 font-bold bg-red-50 p-3 rounded-xl border-2 border-red-200">⚠️ 莊家自摸 (+{extra}台)<br/>三家各賠: <span className="text-xl text-red-700">{pay}</span> 積分</div>;
      } else {
        let dealerPay = b + (rTai + extra) * t;
        let otherPay = b + rTai * t;
        return <div className="text-gray-700 font-bold bg-blue-50 p-3 rounded-xl border-2 border-blue-200">
          莊家需賠: <span className="text-red-600 text-lg">{dealerPay}</span> 積分 (+{extra}台)<br/>
          閒家需賠: <span className="text-gray-900 text-lg">{otherPay}</span> 積分
        </div>;
      }
    }
    return null;
  };

  // -----------------------------------------------------
  // RENDER: SETUP PHASE
  // -----------------------------------------------------
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-amber-100 font-sans p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white border-4 border-gray-900 rounded-3xl p-6 shadow-[8px_8px_0_0_#111827]">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black text-gray-900 flex items-center justify-center gap-2">
              <span className="text-4xl">🀄</span> 麻將記帳神器
            </h1>
            <p className="text-gray-500 font-bold mt-2">不傷感情，只傷錢包 💸</p>
          </div>

          <div className="space-y-5">
            <div className="bg-blue-50 border-4 border-gray-900 rounded-2xl p-4">
              <h2 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                <Coins size={20} /> 金額設定 (積分)
              </h2>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">底數</label>
                  <input type="number" value={basePoint} onChange={(e) => setBasePoint(e.target.value)} className="w-full border-4 border-gray-900 rounded-xl p-2 font-bold text-lg text-center focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">一台</label>
                  <input type="number" value={taiPoint} onChange={(e) => setTaiPoint(e.target.value)} className="w-full border-4 border-gray-900 rounded-xl p-2 font-bold text-lg text-center focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-pink-50 border-4 border-gray-900 rounded-2xl p-4">
              <h2 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                <User size={20} /> 玩家名稱
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {players.map((player, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-2 -top-2 bg-gray-900 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs z-10">{idx + 1}</div>
                    <input type="text" value={player} onChange={(e) => { const newPlayers = [...players]; newPlayers[idx] = e.target.value; setPlayers(newPlayers); }} className="w-full border-4 border-gray-900 rounded-xl p-2 pl-4 font-bold focus:outline-none focus:border-pink-500" placeholder={`玩家 ${idx + 1}`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-purple-50 border-4 border-gray-900 rounded-2xl p-4">
              <h2 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                <Crown size={20} /> 誰先做莊？
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {players.map((p, idx) => (
                  <button key={idx} onClick={() => setInitialDealer(idx)} className={`p-2 rounded-xl font-bold border-4 transition-all text-sm truncate ${initialDealer === idx ? 'bg-purple-400 border-gray-900 shadow-[2px_2px_0_0_#111827] text-gray-900' : 'bg-white border-gray-300 text-gray-400'}`}>
                    {p || `${idx+1}`}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={startGame} className="w-full bg-green-400 border-4 border-gray-900 text-gray-900 font-black text-xl py-4 rounded-2xl shadow-[4px_4px_0_0_#111827] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all flex items-center justify-center gap-2">
              <Play fill="currentColor" /> 開始計算！
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // RENDER: GAME PHASE (DASHBOARD)
  // -----------------------------------------------------
  return (
    <div className="min-h-screen bg-amber-50 font-sans flex flex-col md:items-center">
      <div className="w-full max-w-md bg-amber-50 min-h-screen flex flex-col md:border-x-4 md:border-gray-900">
        
        {/* Header */}
        <div className="bg-white border-b-4 border-gray-900 p-4 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="font-black text-xl text-gray-900 flex items-center gap-2">
              <Trophy className="text-yellow-500" /> 戰況看版
            </h1>
            <p className="text-xs font-bold text-gray-500 mt-1">底 {basePoint} / 台 {taiPoint}</p>
          </div>
          <button onClick={() => { if(window.confirm('確定要結束並返回設定嗎？紀錄將遺失。')) setPhase('setup') }} className="p-2 border-4 border-gray-900 rounded-xl hover:bg-gray-100 active:bg-gray-200">
            <Settings size={20} />
          </button>
        </div>

        {/* Score Board */}
        <div className="p-4 grid grid-cols-2 gap-4">
          {players.map((player, idx) => (
            <div key={idx} className={`relative border-4 border-gray-900 rounded-2xl p-4 shadow-[4px_4px_0_0_#111827] ${scores[idx] >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {/* Dealer Badge */}
              {dealerIdx === idx && (
                <div className="absolute -top-3 -right-3 bg-red-500 border-2 border-gray-900 text-white px-2 py-1 rounded-lg font-black text-xs shadow-sm transform rotate-3 z-10">
                  莊 {lianZhuang > 0 && `連${lianZhuang}`}
                </div>
              )}
              <div className="font-bold text-gray-700 truncate pr-4">{player}</div>
              <div className={`text-2xl font-black mt-2 ${scores[idx] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {scores[idx] > 0 ? '+' : ''}{scores[idx]}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="p-4 flex gap-3">
          <button onClick={() => setShowRecordModal(true)} className="flex-1 bg-yellow-400 border-4 border-gray-900 text-gray-900 font-black text-lg py-4 rounded-2xl shadow-[4px_4px_0_0_#111827] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all flex items-center justify-center gap-2">
            <Plus size={24} /> 紀錄新局
          </button>
          <button onClick={() => setShowSettleModal(true)} className="flex-none bg-blue-300 border-4 border-gray-900 text-gray-900 font-black p-4 rounded-2xl shadow-[4px_4px_0_0_#111827] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all">
            <RotateCcw size={24} />
          </button>
        </div>

        {/* History Log */}
        <div className="flex-1 bg-white border-t-4 border-gray-900 p-4 rounded-t-3xl mt-2 overflow-y-auto">
          <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
            <History size={20} /> 歷史紀錄
          </h3>
          {history.length === 0 ? (
            <div className="text-center text-gray-400 font-bold py-8">
              尚未有紀錄，趕快胡一把吧！
            </div>
          ) : (
            <div className="space-y-3 pb-20">
              {history.map((record) => (
                <div key={record.id} className="border-4 border-gray-900 rounded-xl p-3 bg-gray-50 flex items-center justify-between">
                  {record.type === 'settle' ? (
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-blue-600 bg-blue-100 px-2 py-1 rounded-md text-xs border-2 border-blue-600">中途結算</span>
                        <span className="text-xs font-bold text-gray-400">{record.time}</span>
                      </div>
                      <div className="text-sm font-bold text-gray-600">已將所有人積分歸零</div>
                    </div>
                  ) : record.type === 'draw' ? (
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-black px-2 py-1 rounded-md text-xs border-2 bg-gray-200 text-gray-600 border-gray-600 flex items-center gap-1">
                            <Ghost size={12} /> 流局
                          </span>
                          <span className="text-sm font-bold text-gray-500">{players[record.dealerWhenRecorded]} 連莊</span>
                        </div>
                        <span className="text-xs font-bold text-gray-400">{record.time}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-black px-2 py-1 rounded-md text-xs border-2 ${record.type === 'zimo' ? 'bg-pink-100 text-pink-700 border-pink-700' : 'bg-orange-100 text-orange-700 border-orange-700'}`}>
                            {record.type === 'zimo' ? '自摸 ✨' : '胡牌 🎯'}
                          </span>
                          <span className="font-black text-gray-900">{record.tai} 台</span>
                          {/* 顯示是否含莊家台 */}
                          {(record.winner === record.dealerWhenRecorded || record.loser === record.dealerWhenRecorded || (record.type === 'zimo' && record.dealerWhenRecorded !== null)) && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-100 px-1 rounded border border-red-200">含莊</span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-gray-400">{record.time}</span>
                      </div>
                      
                      {record.type === 'zimo' ? (
                        <div className="text-sm font-bold text-gray-700">
                          <span className="text-green-600 text-base">{players[record.winner]}</span> 贏了三家
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-gray-700">
                          <span className="text-green-600 text-base">{players[record.winner]}</span> 胡了 
                          <span className="text-red-600 text-base mx-1">{players[record.loser]}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL: Record Win */}
        {showRecordModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center">
            <div className="bg-white w-full max-w-md h-[85vh] md:h-auto md:max-h-[90vh] md:rounded-3xl rounded-t-3xl border-t-4 md:border-4 border-gray-900 shadow-2xl flex flex-col animate-[slideUp_0.2s_ease-out]">
              <div className="flex justify-between items-center p-4 border-b-4 border-gray-900">
                <h2 className="font-black text-xl text-gray-900">紀錄結果</h2>
                <button onClick={() => setShowRecordModal(false)} className="p-1 bg-gray-200 rounded-full border-2 border-gray-900 active:bg-gray-300">
                  <X size={20} strokeWidth={3} />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1 space-y-5">
                {/* Type Selection */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl border-4 border-gray-900 text-sm md:text-base">
                  <button onClick={() => setRecordType('zimo')} className={`flex-1 py-2 rounded-xl font-black transition-all ${recordType === 'zimo' ? 'bg-pink-400 text-gray-900 border-2 border-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>✨ 自摸</button>
                  <button onClick={() => setRecordType('hu')} className={`flex-1 py-2 rounded-xl font-black transition-all ${recordType === 'hu' ? 'bg-orange-400 text-gray-900 border-2 border-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>🎯 胡牌</button>
                  <button onClick={() => setRecordType('draw')} className={`flex-1 py-2 rounded-xl font-black transition-all ${recordType === 'draw' ? 'bg-gray-400 text-gray-900 border-2 border-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>💨 流局</button>
                </div>

                {recordType === 'draw' ? (
                  <div className="py-10 text-center space-y-4">
                    <Ghost size={64} className="mx-auto text-gray-400" />
                    <h3 className="text-2xl font-black text-gray-900">這局臭莊啦！</h3>
                    <p className="text-gray-600 font-bold">沒人輸贏，<span className="text-red-500">【{players[dealerIdx]}】</span> 將繼續連莊。</p>
                  </div>
                ) : (
                  <>
                    {/* Winner Selection */}
                    <div>
                      <label className="block text-gray-900 font-black mb-2 text-lg">🏆 誰贏了？</label>
                      <div className="grid grid-cols-2 gap-3">
                        {players.map((p, idx) => (
                          <button key={idx} onClick={() => setWinnerIdx(idx)} className={`p-3 rounded-2xl font-bold border-4 transition-all flex items-center justify-center gap-1 ${winnerIdx === idx ? 'bg-green-400 border-gray-900 shadow-[4px_4px_0_0_#111827] text-gray-900' : 'bg-white border-gray-300 text-gray-500'}`}>
                            {p} {dealerIdx === idx && <span className="text-[10px] bg-red-500 text-white px-1 rounded">莊</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Loser Selection */}
                    {recordType === 'hu' && (
                      <div>
                        <label className="block text-gray-900 font-black mb-2 text-lg">💥 誰放槍？</label>
                        <div className="grid grid-cols-2 gap-3">
                          {players.map((p, idx) => (
                            <button key={idx} disabled={winnerIdx === idx} onClick={() => setLoserIdx(idx)} className={`p-3 rounded-2xl font-bold border-4 transition-all flex items-center justify-center gap-1 ${winnerIdx === idx ? 'opacity-30 cursor-not-allowed bg-gray-100 border-gray-300' : loserIdx === idx ? 'bg-red-400 border-gray-900 shadow-[4px_4px_0_0_#111827] text-gray-900' : 'bg-white border-gray-300 text-gray-500'}`}>
                              {p} {dealerIdx === idx && <span className="text-[10px] bg-red-500 text-white px-1 rounded">莊</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tai Input */}
                    <div className="bg-yellow-50 p-4 rounded-2xl border-4 border-yellow-200">
                      <label className="block text-gray-900 font-black mb-2 text-lg">🎲 基本台數 <span className="text-sm text-gray-500 font-bold">(不含莊家)</span></label>
                      <div className="flex items-center gap-4 mb-3">
                        <button onClick={() => setRecordTai(Math.max(0, recordTai - 1))} className="w-12 h-12 bg-white border-4 border-gray-900 rounded-xl font-black text-2xl flex items-center justify-center active:bg-gray-200">-</button>
                        <input type="number" value={recordTai} onChange={(e) => setRecordTai(Number(e.target.value))} className="flex-1 w-full border-4 border-gray-900 rounded-xl p-2 font-black text-2xl text-center focus:outline-none focus:border-yellow-400" />
                        <button onClick={() => setRecordTai(recordTai + 1)} className="w-12 h-12 bg-white border-4 border-gray-900 rounded-xl font-black text-2xl flex items-center justify-center active:bg-gray-200">+</button>
                      </div>
                      {/* 動態結算預覽 */}
                      {getPreviewText()}
                    </div>
                  </>
                )}
              </div>

              {/* Submit Button */}
              <div className="p-4 border-t-4 border-gray-900 bg-gray-50 rounded-b-3xl">
                <button 
                  onClick={submitRecord}
                  disabled={recordType === 'hu' && winnerIdx === loserIdx}
                  className="w-full bg-green-400 disabled:bg-gray-300 disabled:border-gray-400 disabled:text-gray-500 disabled:shadow-none border-4 border-gray-900 text-gray-900 font-black text-xl py-4 rounded-2xl shadow-[4px_4px_0_0_#111827] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all"
                >
                  確認送出
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Settle Confirm */}
        {showSettleModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl border-4 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 text-center animate-[popIn_0.2s_ease-out]">
              <div className="w-16 h-16 bg-blue-100 rounded-full border-4 border-gray-900 flex items-center justify-center mx-auto mb-4">
                <RotateCcw size={32} className="text-blue-600" />
              </div>
              <h2 className="font-black text-2xl text-gray-900 mb-2">中途結算</h2>
              <p className="font-bold text-gray-600 mb-6">這將會把所有人的當前積分歸零。<br/>確定大家都付清了嗎？</p>
              
              <div className="flex gap-3">
                <button onClick={() => setShowSettleModal(false)} className="flex-1 bg-gray-200 border-4 border-gray-900 text-gray-900 font-black py-3 rounded-xl active:translate-y-1 active:translate-x-1 transition-all">取消</button>
                <button onClick={handleSettle} className="flex-1 bg-blue-400 border-4 border-gray-900 text-gray-900 font-black py-3 rounded-xl shadow-[4px_4px_0_0_#111827] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all">確定歸零</button>
              </div>
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes popIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}} />
    </div>
  );
}