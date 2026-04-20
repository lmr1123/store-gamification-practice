// ══════════════════════════════════════════════════════
//  我的 Tab 内嵌页面 + 管理员后台  v3.0 Production
//  ProfileScreen / AdminDashboard
// ══════════════════════════════════════════════════════

// ─── 我的 Tab 独立路由页面 ────────────────────────────
function ProfileScreen({ onBack, character }) {
  const { state: gs } = useGame();
  const [tab, setTab] = React.useState('growth');

  const level = gs.level || 1;
  const levelInfo = window.LEVELS?.[level - 1] || {};
  const xpProgress = window.calcXpProgress?.(gs.xp) || 0;

  return (
    <div style={{ height: '100%', background: 'var(--bg-2)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }} className="no-scrollbar">
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(160deg, var(--brand) 0%, #3D5CE8 100%)',
        padding: '52px 20px 24px',
        position: 'relative', overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', right: -50, top: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', left: -30, bottom: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }}/>

        {/* Back button */}
        <button onClick={onBack} style={{
          position: 'absolute', top: 52, left: 16,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)', border: 'none',
          color: '#fff', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}>‹</button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '3px solid rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            {character?.avatar || '🧑'}
          </div>

          {/* Name + Level */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{character?.name || '店员'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, justifyContent: 'center' }}>
              <span style={{
                background: 'rgba(255,255,255,0.25)', color: '#fff',
                borderRadius: 999, padding: '3px 10px',
                fontSize: 12, fontWeight: 800,
                backdropFilter: 'blur(6px)',
              }}>{levelInfo.badge || '⭐'} {levelInfo.name || 'Lv.'+level}</span>
              <span style={{
                background: 'rgba(255,255,255,0.2)', color: '#fff',
                borderRadius: 999, padding: '3px 10px',
                fontSize: 12, fontWeight: 800,
              }}>🔥 {gs.streak || 0} 天连续</span>
            </div>
          </div>

          {/* XP Bar */}
          <div style={{ width: '100%', maxWidth: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>经验值 {gs.xp} XP</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>下一级 {(window.LEVELS?.[level]?.xpNeeded || 9999)} XP</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: 'rgba(255,255,255,0.9)',
                width: `${xpProgress * 100}%`,
                transition: 'width 1s var(--ease-out)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)', animation: 'shine 2s 0.5s ease infinite' }}/>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Toggle */}
      <div style={{
        display: 'flex', background: '#fff',
        borderBottom: '1px solid var(--line)',
        flexShrink: 0,
      }}>
        {[['growth','📈 成长'],['badges','🏅 徽章'],['rank','🏆 排行']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: '13px 0',
            border: 'none', background: 'none',
            fontSize: 13, fontWeight: tab === id ? 900 : 600,
            color: tab === id ? 'var(--brand)' : 'var(--ink-3)',
            borderBottom: tab === id ? '2.5px solid var(--brand)' : '2.5px solid transparent',
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }} className="no-scrollbar">
        {tab === 'growth' && <ProfileGrowthSection gs={gs} level={level} />}
        {tab === 'badges' && <ProfileBadgesSection gs={gs} />}
        {tab === 'rank' && <ProfileRankSection character={character} />}
      </div>
    </div>
  );
}

// ─── 成长数据面板 ────────────────────────────────────
function ProfileGrowthSection({ gs, level }) {
  const [showAdmin, setShowAdmin] = React.useState(false);

  const stats = [
    { label: '通关场景', value: gs.completedScenarios?.length || 0, unit: '个', icon: '🎯' },
    { label: '练习总次', value: gs.totalSessions || 0, unit: '次', icon: '🔄' },
    { label: '最高单场', value: gs.maxScore || 0, unit: '分', icon: '🏆' },
  ];

  const streakDays = Array.from({ length: 7 }, (_, i) => {
    const active = i < (gs.streak || 0) && i < 7;
    return active;
  });

  if (showAdmin) return <AdminDashboard onBack={() => setShowAdmin(false)} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 等级路线图 */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 14 }}>🗺️ 等级路线</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {(window.LEVELS || []).map((lv, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: i < level ? lv.color : i === level - 1 ? lv.color : 'var(--bg-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                  boxShadow: i === level - 1 ? `0 0 0 3px ${lv.color}44, 0 4px 12px ${lv.color}66` : 'none',
                  transform: i === level - 1 ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.3s var(--ease-spring)',
                  opacity: i + 1 > level + 1 ? 0.4 : 1,
                }}>{lv.badge}</div>
                <div style={{ fontSize: 9, color: i === level - 1 ? lv.color : 'var(--ink-3)', fontWeight: i === level - 1 ? 900 : 600, textAlign: 'center', lineHeight: 1.2 }}>{lv.name}</div>
              </div>
              {i < 4 && (
                <div style={{ width: 16, height: 3, background: i + 1 < level ? 'var(--brand)' : 'var(--bg-3)', borderRadius: 2, flexShrink: 0, margin: '0 -2px 16px' }}/>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 数据统计卡 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: '14px 10px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--brand)', marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 连续打卡 */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>🔥 连续打卡</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['一','二','三','四','五','六','日'].map((d, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center',
              padding: '8px 0',
              background: streakDays[i] ? 'var(--brand-soft)' : 'var(--bg-3)',
              borderRadius: 10,
            }}>
              <div style={{ fontSize: 14 }}>{streakDays[i] ? '🔥' : '○'}</div>
              <div style={{ fontSize: 9, color: 'var(--ink-3)', fontWeight: 700, marginTop: 2 }}>周{d}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-3)', fontWeight: 600, textAlign: 'center' }}>
          已连续打卡 <span style={{ color: 'var(--brand)', fontWeight: 900 }}>{gs.streak || 0}</span> 天 🎯 坚持就是胜利
        </div>
      </div>

      {/* 管理员后台入口 */}
      <button onClick={() => setShowAdmin(true)} style={{
        width: '100%', padding: '16px',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: 18, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        fontFamily: 'inherit',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📊</div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>管理员数据后台</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>查看门店整体练习数据与分析</div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}>›</div>
      </button>
    </div>
  );
}

// ─── 徽章面板 ────────────────────────────────────────
function ProfileBadgesSection({ gs }) {
  const earned = gs.unlockedAchievements || [];
  const allBadges = window.ACHIEVEMENTS || [];
  const earnedBadges = allBadges.filter(b => earned.includes(b.id));
  const lockedBadges = allBadges.filter(b => !earned.includes(b.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 已解锁 */}
      {earnedBadges.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--ink-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>已解锁 {earnedBadges.length} 个</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {earnedBadges.map(b => (
              <div key={b.id} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 58, height: 58, borderRadius: '50%',
                  background: `radial-gradient(circle at 30% 30%, ${b.color}EE, ${b.color})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26,
                  boxShadow: `0 4px 0 ${b.color}55, 0 6px 16px ${b.color}44`,
                  animation: 'float-badge 3s ease-in-out infinite',
                  animationDelay: `${Math.random() * 2}s`,
                }}>{b.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--ink-2)', textAlign: 'center', lineHeight: 1.3 }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 待解锁 */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--ink-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>待解锁 {lockedBadges.length} 个</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lockedBadges.map(b => (
            <div key={b.id} style={{
              background: 'var(--bg-3)', borderRadius: 14,
              padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
              opacity: 0.65,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, filter: 'grayscale(1)' }}>{b.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-2)' }}>{b.label}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{b.desc}</div>
              </div>
              <div style={{ fontSize: 16 }}>🔒</div>
            </div>
          ))}
        </div>
      </div>

      {earnedBadges.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 48 }}>🎯</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-3)', marginTop: 12 }}>完成练习解锁第一个徽章！</div>
        </div>
      )}
    </div>
  );
}

// ─── 排行榜面板 ────────────────────────────────────────
function ProfileRankSection({ character }) {
  const rankData = [
    { name: character?.name || '我', avatar: character?.avatar || '🧑', xp: 420, score: 91, sessions: 12, self: true },
    { name: '小李', avatar: '👩', xp: 580, score: 94, sessions: 15, self: false },
    { name: '张明', avatar: '👨', xp: 510, score: 89, sessions: 14, self: false },
    { name: '小雅', avatar: '🧕', xp: 380, score: 85, sessions: 10, self: false },
    { name: '老王', avatar: '🧔', xp: 310, score: 82, sessions: 8, self: false },
  ].sort((a, b) => b.xp - a.xp);

  const top3 = rankData.slice(0, 3);
  const rest = rankData.slice(3);

  const podiumOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd
  const podiumHeights = [100, 130, 80];
  const podiumColors = ['#A9B4C9', '#FFCE3C', '#E8956D'];
  const medals = ['🥈', '🥇', '🥉'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 颁奖台 */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '20px 16px 16px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, height: 180 }}>
          {podiumOrder.map((p, i) => p && (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              {/* Avatar */}
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: p.self ? 'var(--brand-soft)' : 'var(--bg-3)',
                border: p.self ? '2.5px solid var(--brand)' : '2.5px solid var(--bg-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, marginBottom: 6,
              }}>{p.avatar}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--ink-2)', marginBottom: 4, maxWidth: 60, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              <div style={{ fontSize: 16 }}>{medals[i]}</div>
              {/* Podium block */}
              <div style={{
                width: '100%', height: podiumHeights[i],
                background: `linear-gradient(180deg, ${podiumColors[i]}CC 0%, ${podiumColors[i]} 100%)`,
                borderRadius: '8px 8px 0 0',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                paddingTop: 8,
              }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{p.xp} XP</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 排行榜列表 */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>全部排名</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {rankData.map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0',
              borderBottom: i < rankData.length - 1 ? '1px solid var(--line)' : 'none',
              background: p.self ? 'var(--brand-soft)' : 'transparent',
              margin: p.self ? '2px -18px' : '0',
              padding: p.self ? '10px 18px' : '10px 0',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i < 3 ? ['#FFCE3C','#A9B4C9','#E8956D'][i] : 'var(--bg-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 900,
                color: i < 3 ? '#fff' : 'var(--ink-3)',
                flexShrink: 0,
              }}>{i + 1}</div>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{p.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: p.self ? 900 : 700, color: p.self ? 'var(--brand)' : 'var(--ink-1)' }}>{p.name}{p.self && ' (我)'}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{p.sessions} 次练习 · 均分 {p.score}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: p.self ? 'var(--brand)' : 'var(--ink-1)' }}>{p.xp}</div>
                <div style={{ fontSize: 9, color: 'var(--ink-3)', fontWeight: 700 }}>XP</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 管理员后台 ──────────────────────────────────────
function AdminDashboard({ onBack }) {
  const kpis = [
    { label: '本周练习人次', value: '47', unit: '次', icon: '🏃', color: '#4E7BFF', bg: '#EEF2FF' },
    { label: '门店平均分', value: '86', unit: '分', icon: '🎯', color: '#14B87A', bg: '#E8FBF4' },
    { label: '最活跃员工', value: '小李', unit: '', icon: '⭐', color: '#FF9E44', bg: '#FFF4E5' },
    { label: '薄弱话术点', value: '3', unit: '项', icon: '⚠️', color: '#FF5B5B', bg: '#FFF1F1' },
  ];

  const trendData = [62, 71, 68, 79, 82, 85, 86];
  const trendDays = ['周一','周二','周三','周四','周五','周六','周日'];
  const trendMax = Math.max(...trendData);
  const trendMin = Math.min(...trendData);
  const chartH = 100;
  const chartW = 280;

  const points = trendData.map((v, i) => {
    const x = 16 + (i / (trendData.length - 1)) * (chartW - 32);
    const y = chartH - 20 - ((v - trendMin) / (trendMax - trendMin + 1)) * (chartH - 30);
    return { x, y, v };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartH - 20} L ${points[0].x} ${chartH - 20} Z`;

  const weaknesses = [
    { label: '推荐会员卡话术', score: 52, color: '#FF5B5B' },
    { label: '处理顾客异议', score: 67, color: '#FF9E44' },
    { label: '产品功效介绍', score: 74, color: '#FFCE3C' },
  ];

  const staff = [
    { name: '小李', avatar: '👩', sessions: 15, avg: 94, trend: '↑' },
    { name: '张明', avatar: '👨', sessions: 14, avg: 89, trend: '↑' },
    { name: '小雅', avatar: '🧕', sessions: 10, avg: 85, trend: '→' },
    { name: '老王', avatar: '🧔', sessions: 8, avg: 82, trend: '↓' },
    { name: '新人甲', avatar: '🧑', sessions: 5, avg: 71, trend: '↑' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: 20, padding: '18px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)', border: 'none',
          color: '#fff', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>📊 管理员后台</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>本周门店数据概览 · 更新于今日</div>
        </div>
        <div style={{ fontSize: 24 }}>🏪</div>
      </div>

      {/* KPI 卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: '#fff', borderRadius: 18,
            padding: '14px 14px', boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{k.icon}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700 }}>{k.label}</div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: k.color }}>{k.value}<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', marginLeft: 2 }}>{k.unit}</span></div>
          </div>
        ))}
      </div>

      {/* 趋势图 */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 14 }}>📈 本周平均分趋势</div>
        <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="adminAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4E7BFF" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#4E7BFF" stopOpacity="0.02"/>
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[0,1,2].map(i => (
            <line key={i} x1="16" x2={chartW - 16} y1={20 + i * 30} y2={20 + i * 30} stroke="var(--line)" strokeWidth="1"/>
          ))}
          {/* Area fill */}
          <path d={areaD} fill="url(#adminAreaGrad)"/>
          {/* Line */}
          <path d={pathD} fill="none" stroke="#4E7BFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Points + labels */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="#4E7BFF" stroke="#fff" strokeWidth="2"/>
              <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fill="#4E7BFF" fontWeight="700">{p.v}</text>
              <text x={p.x} y={chartH - 4} textAnchor="middle" fontSize="8.5" fill="var(--ink-3)">{trendDays[i]}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* 薄弱话术 */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 14 }}>⚠️ 门店薄弱话术 TOP 3</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {weaknesses.map((w, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>{i + 1}. {w.label}</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: w.color }}>{w.score}分</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${w.score}%`, background: w.color, borderRadius: 3, transition: 'width 1s var(--ease-out)' }}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, background: '#FFF4E5', borderRadius: 12, padding: '10px 12px', fontSize: 12, color: '#C96E1A', fontWeight: 600, lineHeight: 1.5 }}>
          💡 建议：本周重点安排「会员卡推荐」场景的专项对练，目标提升至 70 分以上。
        </div>
      </div>

      {/* 员工排行 */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>👥 员工练习排行</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {staff.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 0',
              borderBottom: i < staff.length - 1 ? '1px solid var(--line)' : 'none',
            }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--ink-3)', width: 18, textAlign: 'center' }}>{i + 1}</div>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{s.sessions} 次练习</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink-1)' }}>{s.avg}分</div>
                <div style={{ fontSize: 12, color: s.trend === '↑' ? '#14B87A' : s.trend === '↓' ? '#FF5B5B' : 'var(--ink-3)', fontWeight: 800 }}>{s.trend}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProfileScreen, AdminDashboard });
