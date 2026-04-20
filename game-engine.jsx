// ══════════════════════════════════════════════════════
//  游戏引擎  · Game Engine v2.0
//  XP / 等级 / 爱心 / 连胜 / Combo / 成就 / 全局状态
// ══════════════════════════════════════════════════════

// ─── 等级配置 ───────────────────────────────────────
const LEVELS = [
  { level: 1, title: '实习店员', xpNeeded: 0,    xpToNext: 200,  color: '#8A92A3', badge: '🌱' },
  { level: 2, title: '正式店员', xpNeeded: 200,  xpToNext: 300,  color: '#14B87A', badge: '⭐' },
  { level: 3, title: '资深店员', xpNeeded: 500,  xpToNext: 500,  color: '#4E7BFF', badge: '💎' },
  { level: 4, title: '金牌导购', xpNeeded: 1000, xpToNext: 1000, color: '#A67BD6', badge: '👑' },
  { level: 5, title: '店长之星', xpNeeded: 2000, xpToNext: Infinity, color: '#FFCE3C', badge: '🌟' },
];

// ─── 成就/徽章配置 ────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 'first_practice',  label: '首次出击',   icon: '🎯', color: '#14B87A', desc: '完成第一次练习',       condition: (g) => g.totalSessions >= 1 },
  { id: 'streak_3',        label: '3天连胜',    icon: '🔥', color: '#FF9E44', desc: '连续3天打卡练习',      condition: (g) => g.streak >= 3 },
  { id: 'streak_7',        label: '7天连胜',    icon: '🔥', color: '#FF5B5B', desc: '连续7天打卡练习',      condition: (g) => g.streak >= 7 },
  { id: 'combo_5',         label: '连击达人',   icon: '⚡', color: '#FFCE3C', desc: '单次练习5连击',        condition: (g) => g.maxCombo >= 5 },
  { id: 'perfect_score',   label: '满分达人',   icon: '💯', color: '#FF9E44', desc: '获得100分',           condition: (g) => g.maxScore >= 100 },
  { id: 'level_2',         label: '晋升正式',   icon: '⭐', color: '#14B87A', desc: '升至正式店员',        condition: (g) => g.level >= 2 },
  { id: 'level_3',         label: '资深晋升',   icon: '💎', color: '#4E7BFF', desc: '升至资深店员',        condition: (g) => g.level >= 3 },
  { id: 'scenarios_5',     label: '场景达人',   icon: '🎭', color: '#A67BD6', desc: '完成5个不同场景',     condition: (g) => g.completedScenarios >= 5 },
  { id: 'member_master',   label: '会员大师',   icon: '💳', color: '#4E7BFF', desc: '收银办卡场景满星',    condition: (g) => g.scenarioStars?.checkout >= 3 },
  { id: 'no_mistake',      label: '零差评',     icon: '🛡', color: '#14B87A', desc: '一次练习不犯错',      condition: (g) => g.lastPerfect === true },
];

// ─── XP 计算 ─────────────────────────────────────────
function calcLevel(xp) {
  let lv = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xpNeeded) lv = l;
    else break;
  }
  return lv;
}

function calcXpProgress(xp) {
  const lv = calcLevel(xp);
  const lvIdx = LEVELS.indexOf(lv);
  if (lvIdx === LEVELS.length - 1) return { level: lv, pct: 1, xpInLevel: 0, xpNeeded: 0 };
  const xpInLevel = xp - lv.xpNeeded;
  const pct = Math.min(1, xpInLevel / lv.xpToNext);
  return { level: lv, pct, xpInLevel, xpNeeded: lv.xpToNext };
}

// ─── 初始状态 ─────────────────────────────────────────
const DEFAULT_GAME_STATE = {
  xp: 0,
  level: 1,
  hearts: 5,
  maxHearts: 5,
  streak: 0,
  lastActiveDate: null,
  combo: 0,
  maxCombo: 0,
  totalSessions: 0,
  completedScenarios: 0,
  maxScore: 0,
  lastPerfect: false,
  unlockedAchievements: [],
  scenarioStars: {},
  // 用于UI的临时状态（不持久化）
  pendingXP: 0,
  pendingAchievements: [],
  heartRegenAt: null,
};

// ─── Context ─────────────────────────────────────────
const GameContext = React.createContext(null);

function useGame() {
  const ctx = React.useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────
function GameProvider({ children }) {
  const [state, setState] = React.useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('game_state_v2'));
      if (saved) return { ...DEFAULT_GAME_STATE, ...saved, pendingXP: 0, pendingAchievements: [] };
    } catch {}
    return { ...DEFAULT_GAME_STATE };
  });

  // 每次状态变化持久化（排除UI临时状态）
  React.useEffect(() => {
    const toSave = { ...state };
    delete toSave.pendingXP;
    delete toSave.pendingAchievements;
    localStorage.setItem('game_state_v2', JSON.stringify(toSave));
  }, [state]);

  // 爱心恢复计时器
  React.useEffect(() => {
    if (state.hearts >= state.maxHearts) return;
    const interval = setInterval(() => {
      setState(s => {
        if (s.hearts >= s.maxHearts) return s;
        const now = Date.now();
        if (s.heartRegenAt && now >= s.heartRegenAt) {
          return { ...s, hearts: Math.min(s.maxHearts, s.hearts + 1), heartRegenAt: s.hearts + 1 < s.maxHearts ? now + 30 * 60 * 1000 : null };
        }
        return s;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [state.hearts, state.maxHearts]);

  // 打卡连胜检测
  React.useEffect(() => {
    const today = new Date().toDateString();
    if (state.lastActiveDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    setState(s => ({
      ...s,
      lastActiveDate: today,
      streak: s.lastActiveDate === yesterday ? s.streak : (s.lastActiveDate ? 0 : s.streak),
    }));
  }, []);

  const actions = {
    // 获得 XP（带 combo 加成）
    gainXP(base, { combo = false, perfect = false } = {}) {
      setState(s => {
        const multiplier = combo && s.combo >= 3 ? 1 + Math.min(s.combo * 0.1, 1) : 1;
        const bonus = perfect ? Math.round(base * 0.5) : 0;
        const earned = Math.round(base * multiplier) + bonus;
        const newXP = s.xp + earned;
        const oldLevel = s.level;
        const newLevel = calcLevel(newXP).level;
        const newAchievements = [];
        const nextState = { ...s, xp: newXP, level: newLevel, pendingXP: earned };

        // 检测新成就
        ACHIEVEMENTS.forEach(a => {
          if (!nextState.unlockedAchievements.includes(a.id) && a.condition(nextState)) {
            newAchievements.push(a);
          }
        });
        if (newAchievements.length) {
          nextState.unlockedAchievements = [...nextState.unlockedAchievements, ...newAchievements.map(a => a.id)];
          nextState.pendingAchievements = newAchievements;
        }
        return nextState;
      });
    },

    // 失去爱心
    loseHeart() {
      setState(s => ({
        ...s,
        hearts: Math.max(0, s.hearts - 1),
        combo: 0,
        heartRegenAt: s.hearts === s.maxHearts ? Date.now() + 30 * 60 * 1000 : s.heartRegenAt,
      }));
    },

    // 增加 combo
    addCombo() {
      setState(s => {
        const newCombo = s.combo + 1;
        return { ...s, combo: newCombo, maxCombo: Math.max(s.maxCombo, newCombo) };
      });
    },

    // 重置 combo
    resetCombo() {
      setState(s => ({ ...s, combo: 0 }));
    },

    // 打卡 streak
    checkIn() {
      const today = new Date().toDateString();
      setState(s => {
        if (s.lastActiveDate === today) return s;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newStreak = s.lastActiveDate === yesterday ? s.streak + 1 : 1;
        return { ...s, streak: newStreak, lastActiveDate: today };
      });
    },

    // 完成场景
    completeScenario(scenarioId, stars, score) {
      setState(s => {
        const prevStars = s.scenarioStars?.[scenarioId] || 0;
        const newState = {
          ...s,
          totalSessions: s.totalSessions + 1,
          completedScenarios: s.completedScenarios + (prevStars === 0 ? 1 : 0),
          maxScore: Math.max(s.maxScore, score),
          lastPerfect: score >= 95,
          scenarioStars: { ...s.scenarioStars, [scenarioId]: Math.max(prevStars, stars) },
        };
        return newState;
      });
    },

    // 清除待处理奖励
    clearPending() {
      setState(s => ({ ...s, pendingXP: 0, pendingAchievements: [] }));
    },

    // 重置游戏（调试用）
    resetGame() {
      localStorage.removeItem('game_state_v2');
      setState({ ...DEFAULT_GAME_STATE });
    },
  };

  const derived = {
    ...calcXpProgress(state.xp),
    levelConfig: LEVELS,
    achievements: ACHIEVEMENTS,
    hasHearts: state.hearts > 0,
  };

  return (
    <GameContext.Provider value={{ state, actions, derived }}>
      {children}
    </GameContext.Provider>
  );
}

// ─── XP 悬浮提示组件 ─────────────────────────────────
function XPFloat({ xp, onDone }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position: 'fixed', top: '35%', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, pointerEvents: 'none',
      animation: 'xp-float 1.2s var(--ease-out) forwards',
    }}>
      <div style={{
        background: 'var(--grad-gold)', color: '#7A5800',
        fontWeight: 900, fontSize: 28, padding: '10px 22px',
        borderRadius: 999, boxShadow: '0 4px 20px rgba(255,180,0,0.5)',
        whiteSpace: 'nowrap',
      }}>
        +{xp} XP ✨
      </div>
    </div>
  );
}

// ─── 连击 Combo 显示 ─────────────────────────────────
function ComboDisplay({ combo }) {
  if (combo < 2) return null;
  const colors = ['', '', '#14B87A', '#14B87A', '#FFCE3C', '#FFCE3C', '#FF9E44', '#FF9E44', '#FF5B5B', '#FF5B5B'];
  const color = colors[Math.min(combo, colors.length - 1)] || '#FF5B5B';
  return (
    <div key={combo} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '6px 14px', borderRadius: 999,
      background: color, color: '#fff',
      fontWeight: 900, fontSize: 15,
      boxShadow: `0 4px 0 ${color}88, 0 0 20px ${color}66`,
      animation: 'combo-pop 0.35s var(--ease-spring) both',
    }}>
      ⚡ {combo}x 连击
    </div>
  );
}

// ─── 爱心显示 ────────────────────────────────────────
function HeartsDisplay({ hearts, maxHearts = 5, size = 20, animate = false }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {Array.from({ length: maxHearts }, (_, i) => (
        <span key={i} style={{
          fontSize: size, lineHeight: 1,
          filter: i < hearts ? 'none' : 'grayscale(1) opacity(0.4)',
          animation: animate && i === hearts ? 'heart-break 0.5s var(--ease-spring)' : 'none',
          display: 'block',
        }}>❤️</span>
      ))}
    </div>
  );
}

// ─── XP 进度条 ───────────────────────────────────────
function XPBar({ compact = false }) {
  const { state, derived } = useGame();
  const { level, pct, xpInLevel, xpNeeded } = derived;

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          fontSize: 11, fontWeight: 900, color: level.color,
          background: `${level.color}22`, padding: '2px 8px', borderRadius: 999,
        }}>{level.badge} Lv.{level.level}</div>
        <div style={{ flex: 1, height: 6, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct * 100}%`,
            background: `linear-gradient(90deg, ${level.color} 0%, ${level.color}CC 100%)`,
            borderRadius: 3, transition: 'width 0.8s var(--ease-out)',
          }}/>
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700, whiteSpace: 'nowrap' }}>
          {state.xp} XP
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: `linear-gradient(135deg, ${level.color} 0%, ${level.color}99 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: `0 3px 0 ${level.color}55`,
          }}>{level.badge}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink-1)' }}>Lv.{level.level} {level.title}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              {xpNeeded === 0 ? '已达最高等级' : `${xpInLevel} / ${xpNeeded} XP`}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: level.color }}>{state.xp}</div>
      </div>
      <div style={{ height: 10, background: 'var(--bg-3)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          height: '100%', width: `${pct * 100}%`,
          background: `linear-gradient(90deg, ${level.color} 0%, ${level.color}BB 100%)`,
          borderRadius: 5, transition: 'width 1s var(--ease-out)',
          boxShadow: `0 0 8px ${level.color}88`,
        }}/>
        {pct > 0.15 && (
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pct * 100}%`,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
            animation: 'shine 2s infinite linear',
            backgroundSize: '200% 100%',
          }}/>
        )}
      </div>
    </div>
  );
}

// ─── 成就弹出通知 ─────────────────────────────────────
function AchievementToast({ achievement, onDone }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, width: 300,
      background: '#fff', borderRadius: 18,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 0 0 2px ' + achievement.color + '44',
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      animation: 'slide-down 0.4s var(--ease-spring) both',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
        background: `linear-gradient(135deg, ${achievement.color} 0%, ${achievement.color}99 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, boxShadow: `0 4px 0 ${achievement.color}55`,
        animation: 'float-badge 2s ease-in-out infinite',
      }}>{achievement.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: achievement.color, textTransform: 'uppercase', letterSpacing: 1 }}>🏅 徽章解锁</div>
        <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink-1)', marginTop: 2 }}>{achievement.label}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>{achievement.desc}</div>
      </div>
    </div>
  );
}

// ─── 全局奖励层（XP + 成就叠加显示） ─────────────────
function RewardLayer() {
  const { state, actions } = useGame();
  const [showXP, setShowXP] = React.useState(false);
  const [achievementQueue, setAchievementQueue] = React.useState([]);

  React.useEffect(() => {
    if (state.pendingXP > 0) setShowXP(true);
    if (state.pendingAchievements?.length) {
      setAchievementQueue(q => [...q, ...state.pendingAchievements]);
      actions.clearPending();
    }
  }, [state.pendingXP, state.pendingAchievements]);

  return (
    <>
      {showXP && state.pendingXP > 0 && (
        <XPFloat xp={state.pendingXP} onDone={() => { setShowXP(false); actions.clearPending(); }}/>
      )}
      {achievementQueue[0] && (
        <AchievementToast
          achievement={achievementQueue[0]}
          onDone={() => setAchievementQueue(q => q.slice(1))}
        />
      )}
    </>
  );
}

// ─── 导出 ────────────────────────────────────────────
Object.assign(window, {
  GameContext, GameProvider, useGame,
  LEVELS, ACHIEVEMENTS, calcLevel, calcXpProgress,
  XPFloat, ComboDisplay, HeartsDisplay, XPBar,
  AchievementToast, RewardLayer,
});
