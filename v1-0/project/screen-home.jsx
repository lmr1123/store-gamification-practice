// 屏幕1：首页 · 技能树地图（药房场景主题，像 Duolingo 路径）

function HomeScreen({ onStartScenario, theme, tweakOpen, setTweakOpen }) {
  const [tab, setTab] = React.useState('map');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-2)' }}>
      {/* 顶部状态栏 */}
      <HomeHeader />
      {/* 技能树地图 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 100px', position: 'relative' }} className="no-scrollbar">
        <SkillMap onStartScenario={onStartScenario}/>
      </div>
      {/* 底部 tab bar */}
      <BottomTabs tab={tab} setTab={setTab}/>
    </div>
  );
}

function HomeHeader() {
  return (
    <div style={{
      padding: '54px 20px 16px', display: 'flex', alignItems: 'center', gap: 12,
      background: 'linear-gradient(180deg, var(--brand-soft) 0%, var(--bg-2) 100%)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 600 }}>早上好，</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-1)' }}>小美 👋</div>
      </div>
      {/* 连胜 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#fff', borderRadius: 999, boxShadow: 'var(--shadow-card)' }}>
        <span style={{ animation: 'flame-flicker 1s infinite' }}>{Icon.flame(20)}</span>
        <span style={{ fontWeight: 800, color: '#FF9E44' }}>7</span>
      </div>
      {/* 钻石 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#fff', borderRadius: 999, boxShadow: 'var(--shadow-card)' }}>
        {Icon.gem(18)}
        <span style={{ fontWeight: 800, color: '#4E7BFF' }}>120</span>
      </div>
    </div>
  );
}

// 技能树节点（沿S形路径排列）
function SkillMap({ onStartScenario }) {
  const units = [
    {
      name: '第一单元 · 会员引导',
      color: 'var(--brand)',
      description: '让顾客"知道、想办、常用"会员卡',
      nodes: [
        { id: 'intro', title: '情境介绍', type: 'start', stars: 3, icon: '📖' },
        { id: 'ask-member', title: '询问会员', type: 'lesson', stars: 3, icon: '💬' },
        { id: 'recommend', title: '六大权益推荐', type: 'lesson', stars: 2, icon: '🎁' },
        { id: 'checkout', title: '收银办卡', type: 'boss', stars: 0, active: true, icon: '💳' },
        { id: 'objection', title: '异议处理', type: 'lesson', stars: 0, locked: true, icon: '🛡️' },
        { id: 'final', title: '单元挑战', type: 'treasure', stars: 0, locked: true, icon: '👑' },
      ],
    },
    {
      name: '第二单元 · 慢性病关怀',
      color: 'var(--customer-chronic)',
      description: '用药咨询、复购提醒、专属会员',
      nodes: [
        { id: 'ch1', title: '初识用药', type: 'lesson', locked: true, icon: '💊' },
        { id: 'ch2', title: '用药提醒', type: 'lesson', locked: true, icon: '⏰' },
      ],
    },
  ];

  return (
    <div style={{ paddingTop: 12 }}>
      {units.map((unit, ui) => (
        <div key={ui} style={{ marginBottom: 40 }}>
          {/* 单元横幅 */}
          <UnitBanner unit={unit}/>
          {/* 节点以 S 形排列 */}
          <div style={{ position: 'relative', paddingTop: 20 }}>
            {unit.nodes.map((n, i) => {
              // S形偏移：0, 72, 120, 72, 0, -72, -120, -72 ...
              const pattern = [0, 60, 100, 60, 0, -60, -100, -60];
              const xOffset = pattern[i % pattern.length];
              return (
                <SkillNode
                  key={n.id} node={n} offset={xOffset}
                  onClick={() => n.active && onStartScenario && onStartScenario(n)}
                  isLast={i === unit.nodes.length - 1}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function UnitBanner({ unit }) {
  return (
    <div style={{
      background: unit.color, color: '#fff',
      borderRadius: 18, padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: `0 4px 0 ${unit.color}88`,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
      }}>🏥</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>{unit.name}</div>
        <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>{unit.description}</div>
      </div>
      <button style={{
        background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)',
        color: '#fff', padding: '8px 12px', borderRadius: 12, fontWeight: 700, fontSize: 12,
      }}>教程</button>
    </div>
  );
}

function SkillNode({ node, offset, onClick, isLast }) {
  const isActive = node.active;
  const isLocked = node.locked;
  const isCompleted = !isActive && !isLocked;
  const typeConfig = {
    start: { size: 70, bg: '#14B87A', shadow: '#0A7A50' },
    lesson: { size: 78, bg: '#14B87A', shadow: '#0A7A50' },
    boss: { size: 92, bg: '#FF9E44', shadow: '#C96E1A' },
    treasure: { size: 82, bg: '#FFCE3C', shadow: '#B8890A' },
  };
  const cfg = typeConfig[node.type] || typeConfig.lesson;
  const bg = isLocked ? '#D5DAE1' : cfg.bg;
  const shadow = isLocked ? '#B5BDC8' : cfg.shadow;

  return (
    <div style={{
      position: 'relative', display: 'flex', justifyContent: 'center',
      marginBottom: 24, transform: `translateX(${offset}px)`,
    }}>
      <div
        onClick={onClick}
        style={{ position: 'relative', cursor: isActive ? 'pointer' : 'default' }}
      >
        {/* 开始标签 */}
        {isActive && (
          <div style={{
            position: 'absolute', top: -38, left: '50%', transform: 'translateX(-50%)',
            background: '#fff', color: 'var(--brand-ink)', padding: '4px 12px',
            borderRadius: 8, border: '2px solid var(--brand)',
            fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap',
            boxShadow: '0 2px 0 var(--brand-ink)',
          }}>
            开始 ↓
          </div>
        )}
        {/* 圆形节点 */}
        <div style={{
          width: cfg.size, height: cfg.size, borderRadius: '50%',
          background: bg,
          boxShadow: `0 6px 0 ${shadow}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: cfg.size * 0.42,
          animation: isActive ? 'pulse-ring 2s infinite' : 'none',
          position: 'relative',
        }}>
          {isLocked ? Icon.lock(28, '#8A92A3') : node.icon}
          {/* boss 皇冠 */}
          {node.type === 'boss' && (
            <div style={{ position: 'absolute', top: -14, fontSize: 20 }}>👑</div>
          )}
        </div>
        {/* 星星 */}
        {!isLocked && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <StarRating value={node.stars || 0} max={3} size={14}/>
          </div>
        )}
        {/* 标题 */}
        <div style={{
          textAlign: 'center', marginTop: 4, fontSize: 12, fontWeight: 700,
          color: isLocked ? 'var(--ink-3)' : 'var(--ink-1)',
          whiteSpace: 'nowrap',
        }}>{node.title}</div>
      </div>
    </div>
  );
}

function BottomTabs({ tab, setTab }) {
  const tabs = [
    { id: 'map', icon: Icon.map(26), label: '练习' },
    { id: 'leaderboard', icon: Icon.trophy(26), label: '排行' },
    { id: 'shop', icon: Icon.gem(26), label: '商店' },
    { id: 'profile', icon: Icon.user(26), label: '我的' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      display: 'flex', background: 'var(--bg-1)',
      borderTop: '1px solid var(--line)',
      paddingBottom: 24, paddingTop: 8,
    }}>
      {tabs.map(t => (
        <div key={t.id} onClick={() => setTab(t.id)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          padding: 8, cursor: 'pointer',
          color: tab === t.id ? 'var(--brand)' : 'var(--ink-3)',
        }}>
          {t.icon}
          <span style={{ fontSize: 11, fontWeight: 700 }}>{t.label}</span>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { HomeScreen });
