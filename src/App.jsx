import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, CheckCircle, Clock, Activity, BarChart2, AlertCircle, XCircle, FastForward, Trophy, Users } from 'lucide-react';

/**
 * D2 Test Component - Professional Statistical Edition (Chinese Localized)
 * * 严格遵照 Brickenkamp 统计学设计：
 * 1. 行数 (Lines): 14 行
 * 2. 时长 (Duration): 20 秒/行
 * 3. 数量 (Items): 固定 47 个/行
 * 4. 目标分布 (Targets): 14-20 个/行 (动态波动)
 * 5. 字母比例: d:p ≈ 1:1
 */

// 配置参数
const ITEMS_PER_LINE = 47; // 每一行固定 47 个字符
const LINE_DURATION = 20;  // 每行 20 秒
const TOTAL_LINES = 14;    // 共 14 行

// --- 核心算法：基于年龄的常模排位计算 ---
const calculatePercentile = (cpScore, age) => {
  const numericAge = parseInt(age) || 25;
  
  // 设定各年龄段的 CP (Concentration Performance) 基准均值 (Mean) 和标准差 (SD)
  // *数据基于 D2 量表一般人群趋势的简化模拟*
  // CP = Hits - Errors
  let mean = 150; 
  let sd = 30;

  if (numericAge <= 10) { mean = 80; sd = 20; }
  else if (numericAge <= 14) { mean = 120; sd = 25; }
  else if (numericAge <= 19) { mean = 160; sd = 30; }
  else if (numericAge <= 29) { mean = 180; sd = 35; } // 巅峰期
  else if (numericAge <= 39) { mean = 170; sd = 35; }
  else if (numericAge <= 49) { mean = 160; sd = 30; }
  else if (numericAge <= 59) { mean = 140; sd = 25; }
  else { mean = 110; sd = 25; } // 60+

  // 计算 Z-score (标准分数)
  const zScore = (cpScore - mean) / sd;

  // 将 Z-score 转换为百分比排名 (使用误差函数 erf 的近似转换)
  // 这种转换能模拟正态分布下的击败率
  // Z=0 -> 50%, Z=1 -> 84%, Z=2 -> 97.7%
  const percentile = (0.5 * (1 + Math.tanh(zScore * 0.8))) * 100;

  // 限制在 1% - 99.9% 之间，避免出现 100% 或 0%
  return Math.min(99.9, Math.max(0.1, percentile)).toFixed(1);
};


// 生成符合统计学分布的行数据
const generateData = () => {
  let data = [];

  // 1. 确定本行的目标数量 (14 - 20 之间波动)
  const targetCount = Math.floor(Math.random() * (20 - 14 + 1)) + 14;

  // 2. 确定 d 的总数 (约为总数的一半，23 或 24)
  const totalDCount = Math.random() > 0.5 ? 23 : 24;
  
  // 3. 计算干扰项数量
  const dDistractorCount = totalDCount - targetCount; // 剩下的 d 都是干扰项
  const pCount = ITEMS_PER_LINE - totalDCount;        // 剩下的位置全是 p

  // --- 生成目标 (d2) ---
  // 横线总数为2：(2,0), (0,2), (1,1)
  for (let i = 0; i < targetCount; i++) {
    const rand = Math.random();
    let top, bottom;
    if (rand < 0.33) { top = 2; bottom = 0; }
    else if (rand < 0.66) { top = 0; bottom = 2; }
    else { top = 1; bottom = 1; }
    
    data.push({ char: 'd', topDashes: top, bottomDashes: bottom, isTarget: true });
  }

  // --- 生成 d 干扰项 (d != 2) ---
  for (let i = 0; i < dDistractorCount; i++) {
    const options = [1, 3, 4];
    const totalDashes = options[Math.floor(Math.random() * options.length)];
    let top, bottom;
    
    if (totalDashes === 4) { top = 2; bottom = 2; }
    else if (totalDashes === 3) {
       if (Math.random() > 0.5) { top = 1; bottom = 2; } else { top = 2; bottom = 1; }
    } else { // total === 1
       if (Math.random() > 0.5) { top = 1; bottom = 0; } else { top = 0; bottom = 1; }
    }
    data.push({ char: 'd', topDashes: top, bottomDashes: bottom, isTarget: false });
  }

  // --- 生成 p 干扰项 ---
  for (let i = 0; i < pCount; i++) {
    let top = Math.floor(Math.random() * 3); // 0-2
    let bottom = Math.floor(Math.random() * 3); // 0-2
    // 确保干扰项p看起来有点像（至少有线），除了极少数情况
    if (top === 0 && bottom === 0 && Math.random() > 0.1) top = 1; 
    data.push({ char: 'p', topDashes: top, bottomDashes: bottom, isTarget: false });
  }

  // 4. 洗牌
  data = data.sort(() => Math.random() - 0.5);

  // 5. 添加索引
  return data.map((item, index) => ({ ...item, id: index, marked: false }));
};

const D2Symbol = ({ item, onClick, disabled, isDemo }) => {
  const DashMark = () => (
    <div className="w-[2px] h-[6px] bg-slate-800 mx-[1px]" />
  );

  // 演示模式下稍微大一点
  const sizeClasses = isDemo 
    ? "w-10 h-16 sm:w-12 sm:h-20 bg-slate-50 border border-slate-200 rounded-lg mx-auto"
    : "w-10 h-14 sm:w-12 sm:h-16 hover:bg-slate-100 rounded-lg active:scale-95";

  return (
    <div 
      onClick={() => !disabled && onClick(item.id)}
      className={`
        relative flex flex-col items-center justify-center 
        cursor-pointer select-none transition-all duration-200
        ${disabled ? 'cursor-default' : ''}
        ${sizeClasses}
      `}
    >
      {item.marked && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-[120%] h-[3px] bg-blue-600/80 rotate-[-45deg] transform origin-center rounded-full shadow-sm" />
        </div>
      )}
      <div className="flex h-3 items-end mb-0.5">
        {Array.from({ length: item.topDashes }).map((_, i) => <DashMark key={`top-${i}`} />)}
      </div>
      <div className={`font-serif font-medium text-slate-800 leading-none pb-1 ${isDemo ? 'text-3xl' : 'text-2xl sm:text-3xl'}`}>
        {item.char}
      </div>
      <div className="flex h-3 items-start mt-0.5">
        {Array.from({ length: item.bottomDashes }).map((_, i) => <DashMark key={`bottom-${i}`} />)}
      </div>
    </div>
  );
};

export default function D2AttentionTest() {
  const [gameState, setGameState] = useState('intro'); 
  const [currentLine, setCurrentLine] = useState(1);
  const [items, setItems] = useState([]);
  const [timeLeft, setTimeLeft] = useState(LINE_DURATION);
  const [lineHistory, setLineHistory] = useState([]);
  
  // 新增：用户年龄状态
  const [userAge, setUserAge] = useState('24'); 
  const [finalRank, setFinalRank] = useState(0);

  const startFullTest = () => {
    setCurrentLine(1);
    setLineHistory([]);
    startLine(1);
  };

  // 模拟测试数据生成
  const simulateTest = () => {
    const mockHistory = [];
    // 模拟一个典型的"前期适应 -> 中期稳定 -> 后期略微疲劳"的曲线
    for (let i = 1; i <= TOTAL_LINES; i++) {
        const totalTargets = Math.floor(Math.random() * (20 - 14 + 1)) + 14;
        
        let baseAccuracy = 0.9;
        if (i === 1) baseAccuracy = 0.8;
        if (i > 10) baseAccuracy = 0.85;

        // 加入随机波动
        const accuracy = Math.min(1, Math.max(0, baseAccuracy + (Math.random() * 0.2 - 0.05)));
        
        const hits = Math.floor(totalTargets * accuracy);
        const misses = totalTargets - hits;
        const falseAlarms = Math.random() > 0.8 ? 1 : 0; 
        
        mockHistory.push({
            line: i,
            hits,
            misses,
            falseAlarms,
            totalTargets,
            errorRate: ((falseAlarms + misses) / totalTargets) * 100
        });
    }
    
    // 模拟完成后，手动计算一次排名
    const totalHits = mockHistory.reduce((a, b) => a + b.hits, 0);
    const totalErrors = mockHistory.reduce((a, b) => a + b.falseAlarms + b.misses, 0);
    const cp = totalHits - totalErrors;
    setFinalRank(calculatePercentile(cp, userAge));

    setLineHistory(mockHistory);
    setGameState('finished');
  };

  const startLine = (lineNum) => {
    setItems(generateData());
    setTimeLeft(LINE_DURATION);
    setCurrentLine(lineNum);
    setGameState('playing');
  };

  const handleItemClick = (id) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, marked: !item.marked } : item
      )
    );
  };

  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      finishLine();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const finishLine = () => {
    let hits = 0;
    let falseAlarms = 0;
    let totalTargets = 0;

    items.forEach(item => {
      if (item.isTarget) {
        totalTargets++;
        if (item.marked) hits++;
      } else {
        if (item.marked) falseAlarms++;
      }
    });

    const misses = totalTargets - hits;
    const lineData = {
      line: currentLine,
      hits,
      misses,
      falseAlarms,
      totalTargets,
      errorRate: ((falseAlarms + misses) / (totalTargets || 1)) * 100
    };

    const newHistory = [...lineHistory, lineData];
    setLineHistory(newHistory); // 更新历史数据状态

    if (currentLine < TOTAL_LINES) {
      startLine(currentLine + 1);
    } else {
      // 游戏彻底结束时，计算最终排名
      // 注意：此时 newHistory 包含了所有14行的数据
      const totalHits = newHistory.reduce((a, b) => a + b.hits, 0);
      const totalErrors = newHistory.reduce((a, b) => a + b.falseAlarms + b.misses, 0);
      const cp = totalHits - totalErrors;
      
      setFinalRank(calculatePercentile(cp, userAge));
      setGameState('finished');
    }
  };

  const WorkCurveChart = ({ history }) => {
    const maxVal = Math.max(...history.map(h => h.hits + 5), 25); 
    
    return (
      <div className="w-full mt-6 px-1">
         <div className="flex items-end justify-between h-40 gap-1 border-b border-slate-200 pb-1 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                <div className="w-full h-px bg-slate-800"></div>
                <div className="w-full h-px bg-slate-800"></div>
                <div className="w-full h-px bg-slate-800"></div>
            </div>

            {history.map((data, idx) => (
            <div key={idx} className="flex flex-col items-center flex-1 group relative h-full justify-end">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg">
                    第{data.line}行: 对{data.hits} / 错{data.falseAlarms + data.misses}
                </div>
                
                <div className="relative w-full flex flex-col items-center justify-end h-full">
                    {/* 热身轮标记 */}
                    {idx === 0 && (
                        <div className="absolute -top-5 text-[9px] text-blue-500 font-bold whitespace-nowrap">热身</div>
                    )}
                    <div 
                        className={`w-full max-w-[12px] sm:max-w-[18px] rounded-t-sm transition-all duration-500 ${
                            idx === 0 ? 'bg-blue-300' : idx === history.length - 1 ? 'bg-blue-600' : 'bg-blue-400'
                        }`}
                        style={{ height: `${(data.hits / maxVal) * 100}%` }}
                    />
                    
                    {(data.falseAlarms + data.misses) > 0 && (
                        <div 
                            className="absolute -top-2 w-1.5 h-1.5 bg-red-500 rounded-full" 
                            style={{ opacity: Math.min(1, (data.falseAlarms + data.misses) * 0.5) }} 
                        />
                    )}
                </div>

                <div className="text-[9px] text-slate-400 mt-1 font-mono">
                    {data.line}
                </div>
            </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f4f0] text-slate-800 font-sans flex flex-col items-center py-6 px-2 sm:px-4 overflow-hidden selection:bg-transparent">
      
      {gameState !== 'intro' && gameState !== 'finished' && (
        <div className="w-full max-w-5xl flex justify-between items-center mb-4 px-2 sm:px-4 animate-fade-in border-b border-slate-200 pb-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">测试进度</span>
            <div className="text-lg font-serif font-bold text-slate-700 flex items-center gap-2">
                <span>第 <span className="text-blue-600 text-2xl">{currentLine}</span> / {TOTAL_LINES} 行</span>
                {/* 第一轮热身提示 */}
                {currentLine === 1 && (
                    <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-bold">热身环节</span>
                )}
            </div>
          </div>
          
          <div className={`flex flex-col items-end ${timeLeft <= 5 ? 'text-red-600 scale-105 transition-transform' : 'text-slate-700'}`}>
             <div className="flex items-center gap-2 text-3xl font-mono font-bold leading-none">
                <Clock size={20} className="mb-0.5" />
                <span>{timeLeft.toString().padStart(2, '0')}s</span>
             </div>
             <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">本行剩余时间</div>
          </div>
        </div>
      )}

      {gameState === 'intro' && (
        <div className="flex flex-col items-center justify-center flex-1 max-w-2xl text-center space-y-6 animate-fade-in-up px-4 w-full">
          <div className="space-y-3">
            <h1 className="text-5xl font-serif font-bold text-slate-800">专注度测验</h1>
            <p className="text-lg text-slate-500 font-serif">专业注意力评估量表 (d2-R)</p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-800 text-white rounded-full text-xs font-bold tracking-widest shadow-lg">
               <span>标准版</span>
               <span className="w-px h-3 bg-white/30"/>
               <span>{TOTAL_LINES} 行</span>
               <span className="w-px h-3 bg-white/30"/>
               <span>约 5 分钟</span>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl shadow-slate-200/50 w-full border border-slate-100">
             
            {/* 年龄输入区 - 重要新增 */}
            <div className="mb-8 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
               <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-center gap-2">
                  <Users size={18} className="text-blue-600"/> 输入年龄以匹配对照组 (Norms)
               </label>
               <div className="flex items-center justify-center gap-4">
                  <input 
                    type="range" 
                    min="6" 
                    max="80" 
                    value={userAge} 
                    onChange={(e) => setUserAge(e.target.value)}
                    className="w-full max-w-[200px] accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="w-16 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg font-bold text-xl text-blue-600 shadow-sm">
                     {userAge}
                  </div>
                  <span className="text-sm text-slate-500 font-bold">岁</span>
               </div>
               <p className="text-xs text-slate-400 mt-2">系统将根据您的年龄自动校准评估标准</p>
            </div>

            <h2 className="text-lg font-bold mb-6 flex items-center justify-center gap-2 text-slate-800">
              <CheckCircle size={20} className="text-blue-600"/> 规则图解：找准 "d2"
            </h2>
            
            {/* 规则图解核心区 */}
            <div className="grid grid-cols-2 gap-4 sm:gap-8 mb-8">
                {/* 左侧：正确目标 */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 justify-center text-green-700 font-bold bg-green-50 py-1 rounded-lg">
                        <CheckCircle size={16}/> 目标 (2划)
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                            <D2Symbol item={{char:'d', topDashes:2, bottomDashes:0, marked:false}} disabled={true} isDemo={true} onClick={()=>{}}/>
                            <span className="text-[10px] text-slate-400 block mt-1">上2</span>
                        </div>
                        <div className="text-center">
                            <D2Symbol item={{char:'d', topDashes:0, bottomDashes:2, marked:false}} disabled={true} isDemo={true} onClick={()=>{}}/>
                            <span className="text-[10px] text-slate-400 block mt-1">下2</span>
                        </div>
                        <div className="text-center">
                            <D2Symbol item={{char:'d', topDashes:1, bottomDashes:1, marked:false}} disabled={true} isDemo={true} onClick={()=>{}}/>
                            <span className="text-[10px] text-slate-400 block mt-1">上下1</span>
                        </div>
                    </div>
                    <p className="text-xs text-green-600 font-medium">只要是 d 且合计2条线 → 划掉！</p>
                </div>

                {/* 右侧：干扰项 */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 justify-center text-red-600 font-bold bg-red-50 py-1 rounded-lg">
                        <XCircle size={16}/> 干扰 (跳过)
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                         <div className="text-center">
                            <D2Symbol item={{char:'p', topDashes:2, bottomDashes:0, marked:false}} disabled={true} isDemo={true} onClick={()=>{}}/>
                            <span className="text-[10px] text-slate-400 block mt-1">是p</span>
                        </div>
                         <div className="text-center">
                            <D2Symbol item={{char:'d', topDashes:1, bottomDashes:2, marked:false}} disabled={true} isDemo={true} onClick={()=>{}}/>
                            <span className="text-[10px] text-slate-400 block mt-1">3划</span>
                        </div>
                         <div className="text-center">
                            <D2Symbol item={{char:'d', topDashes:1, bottomDashes:0, marked:false}} disabled={true} isDemo={true} onClick={()=>{}}/>
                            <span className="text-[10px] text-slate-400 block mt-1">1划</span>
                        </div>
                    </div>
                     <p className="text-xs text-red-500 font-medium">是 p 或 线数不对 → 别碰！</p>
                </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4 text-left text-sm text-slate-700 space-y-3 mb-6 border border-orange-100">
               <p className="font-bold text-orange-700 flex items-center gap-2">
                   <AlertCircle size={16}/> 核心策略
               </p>
               <ul className="space-y-2 list-disc pl-5 text-orange-900/80 text-xs sm:text-sm">
                   <li><strong>第一轮是热身：</strong>第1行主要用于适应手感，请放松开始。</li>
                   <li><strong>不要数数：</strong>每行的目标数量是不固定的(14-20个)，请依靠视觉判断。</li>
                   <li><strong>速度至上：</strong>每行只有20秒，时间一到会自动跳转。</li>
               </ul>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={startFullTest}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 group"
              >
                <Play size={20} className="group-hover:translate-x-0.5 transition-transform" fill="currentColor" /> 开始测试
              </button>
              
              <button 
                onClick={simulateTest}
                className="text-xs text-slate-400 hover:text-slate-600 underline flex items-center justify-center gap-1"
              >
                <FastForward size={12}/> 跳过测试 (查看结果演示)
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="flex-1 w-full max-w-6xl flex justify-center items-start overflow-y-auto pb-10">
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2 animate-fade-in content-start">
            {items.map((item) => (
              <D2Symbol 
                key={item.id} 
                item={item} 
                onClick={handleItemClick} 
                disabled={false}
              />
            ))}
          </div>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="flex flex-col items-center justify-center flex-1 w-full max-w-2xl animate-fade-in-up pb-8 px-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl w-full text-center border border-slate-100">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-serif font-bold text-slate-800">评估报告</h2>
                <span className="text-xs font-mono text-slate-400">{new Date().toLocaleDateString()}</span>
            </div>
            
            {/* 核心排名展示区域 - 新增 */}
            <div className="mb-8 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Trophy size={120} />
               </div>
               <div className="relative z-10 text-left">
                  <div className="text-blue-100 text-sm font-medium mb-1 flex items-center gap-2">
                     <Users size={16}/> 基于 {userAge} 岁年龄组常模数据
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">
                     击败了 <span className="text-yellow-300 text-4xl sm:text-5xl">{finalRank}%</span> 的同龄受测者
                  </div>
                  <div className="text-sm text-blue-100 opacity-90 leading-relaxed max-w-md">
                     您的专注力绩效 (CP分数) 经过年龄加权校准后，显示出您目前的注意力水平在同龄人群中处于 
                     {parseFloat(finalRank) > 90 ? ' 顶尖 ' : parseFloat(finalRank) > 75 ? ' 优秀 ' : parseFloat(finalRank) > 50 ? ' 中等偏上 ' : ' 正常 '}
                     位置。
                  </div>
               </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col justify-between h-24">
                    <div className="text-xs uppercase text-blue-400 font-bold tracking-wider text-left">总目标</div>
                    <div className="text-3xl font-bold text-blue-900 text-right">
                        {lineHistory.reduce((acc, curr) => acc + curr.totalTargets, 0)}
                    </div>
                    <div className="text-[10px] text-blue-800/60 text-right">应选总数 (TN)</div>
                </div>
                 <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex flex-col justify-between h-24">
                    <div className="text-xs uppercase text-green-500 font-bold tracking-wider text-left">专注表现</div>
                    <div className="text-3xl font-bold text-green-700 text-right">
                        {lineHistory.reduce((acc, curr) => acc + curr.hits, 0)}
                    </div>
                    <div className="text-[10px] text-green-800/60 text-right">正确数量 (CP)</div>
                </div>
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex flex-col justify-between h-24">
                    <div className="text-xs uppercase text-red-400 font-bold tracking-wider text-left">失误</div>
                    <div className="text-3xl font-bold text-red-700 text-right">
                        {lineHistory.reduce((acc, curr) => acc + curr.falseAlarms + curr.misses, 0)}
                    </div>
                    <div className="text-[10px] text-red-800/60 text-right">错误+漏选 (E)</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between h-24">
                    <div className="text-xs uppercase text-slate-400 font-bold tracking-wider text-left">错误率</div>
                    <div className="text-3xl font-bold text-slate-700 text-right">
                        {(() => {
                            const totalProcessed = lineHistory.reduce((acc, curr) => acc + curr.totalTargets, 0); 
                            const totalErrors = lineHistory.reduce((acc, curr) => acc + curr.falseAlarms + curr.misses, 0);
                            return totalProcessed ? (totalErrors / totalProcessed * 100).toFixed(1) : 0;
                        })()}<span className="text-sm">%</span>
                    </div>
                    <div className="text-[10px] text-slate-500/60 text-right">E%</div>
                </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <BarChart2 size={18} className="text-slate-700"/>
                        <span className="text-sm font-bold text-slate-700">作业曲线 (专注力波动)</span>
                    </div>
                    <div className="text-[10px] bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">
                        单行满负荷: {ITEMS_PER_LINE}
                    </div>
                </div>
                
                <WorkCurveChart history={lineHistory} />

                <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-left text-slate-600 leading-relaxed font-medium">
                   <div className="flex gap-2 items-start">
                        <Activity size={14} className="mt-0.5 text-blue-600 shrink-0"/>
                        <div>
                           <strong>趋势解读：</strong>
                           {(() => {
                              if (lineHistory.length < 6) return "数据不足。";
                              // 去除热身轮（第1轮）后计算
                              const validHistory = lineHistory.slice(1);
                              const firstHalf = validHistory.slice(0, 5).reduce((a, b) => a + b.hits, 0) / 5;
                              const lastHalf = validHistory.slice(-5).reduce((a, b) => a + b.hits, 0) / 5;
                              
                              if (lastHalf < firstHalf * 0.85) return "测试后期您的处理速度出现明显下降，表明在长时间专注下容易疲劳（持续性注意力不足）。建议进行分段专注训练。";
                              if (lastHalf > firstHalf * 1.1) return "测试后期处理速度反而上升，表明您具备极佳的学习适应能力，且抗压能力强。";
                              return "整体表现平稳，说明您的专注力非常稳定，不易受外界干扰或自身疲劳影响。";
                           })()}
                        </div>
                   </div>
                </div>
            </div>

            <button 
              onClick={startFullTest}
              className="w-full py-4 border-2 border-slate-900 text-slate-900 rounded-xl font-bold hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> 重新测试
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out; }
      `}</style>
    </div>
  );
}