// ══════════════════════════════════════════════════════
//  首页 · 4-Tab 导航  v3.0 Production
//  Tab: 首页 | 对练 | 回顾 | 我的
// ══════════════════════════════════════════════════════

function HomeScreen({ character, onNav }) {
  // onNav(route, params) — 推入新路由
  const [tab, setTab] = React.useState('home');
  const { state: gs, derived } = useGame();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-2)', position: 'relative' }}>
      {/* ─── 内容区 ─── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <TabView id="home"  active={tab === 'home'}>
          <HomeTab  character={character} gs={gs} derived={derived} onNav={onNav}/>
        </TabView>
        <TabView id="drill" active={tab === 'drill'}>
          <DrillTab character={character} gs={gs} onNav={onNav}/>
        </TabView>
        <TabView id="review" active={tab === 'review'}>
          <ReviewTab onNav={onNav}/>
        </TabView>
        <TabView id="me" active={tab === 'me'}>
          <MeTab character={character} gs={gs} derived={derived} onNav={onNav}/>
        </TabView>
      </div>

      {/* ─── 底部导航 ─── */}
      <BottomNav tab={tab} setTab={setTab}/>
    </div>
  );
}

// ──────────────────────────────────────────────────────
//  Tab 容器（保持DOM，切换显示/隐藏避免重置状态）
// ──────────────────────────────────────────────────────
function TabView({ active, children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflowY: 'auto',
      opacity: active ? 1 : 0,
      pointerEvents: active ? 'auto' : 'none',
      transition: 'opacity 0.18s',
    }} className="no-scrollbar">
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  Tab 1 · 首页 — 今日任务 + 技能树
// ══════════════════════════════════════════════════════
function HomeTab({ character, gs, derived, onNav }) {
  return (
    <div style={{ paddingBottom: 88 }}>
      {/* 顶部问候栏 */}
      <HomeGreeting character={character} gs={gs} derived={derived}/>
      {/* 今日任务卡 */}
      <div style={{ padding: '0 16px' }}>
        <TodayMissionCard gs={gs} onNav={onNav}/>
        {/* 技能树 */}
        <SectionTitle icon="🗺" title="技能路径" sub="S形闯关，解锁更多场景" style={{ marginTop: 20 }}/>
        <SkillTreeMap onNav={onNav}/>
      </div>
    </div>
  );
}

// ─── 问候栏 ───────────────────────────────────────────
function HomeGreeting({ character, gs, derived }) {
  const h = new Date().getHours();
  const greet = h < 6 ? '夜深了' : h < 12 ? '早上好' : h < 18 ? '下午好' : '晚上好';
  const { level, pct, xpInLevel, xpNeeded } = derived;

  return (
    <div style={{
      padding: '52px 16px 14px',
      background: 'linear-gradient(175deg, var(--brand-soft) 0%, var(--bg-2) 100%)',
    }}>
      {/* 行1：头像 + 文字 + 徽章 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 16,
            overflow: 'hidden', border: '2.5px solid var(--brand)',
            boxShadow: '0 4px 14px rgba(20,184,122,0.3)',
          }}>
            {character?.img
              ? <img src={character.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              : <AvatarXiaomei size={50}/>}
          </div>
          <div style={{
            position: 'absolute', bottom: -5, right: -7,
            background: level.color, color: '#fff',
            fontSize: 9, fontWeight: 900, padding: '2px 6px',
            borderRadius: 999, border: '2px solid var(--bg-1)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
          }}>Lv.{gs.level}</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{greet}，</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {character?.nickname || '小美'} 👋
          </div>
        </div>

        {/* 连胜 + 爱心 */}
        <div style={{ display: 'flex', gap: 6 }}>
          <Pill>
            <span style={{ animation: 'flame-flicker 1s infinite', display: 'block', lineHeight: 1 }}>🔥</span>
            <span style={{ fontWeight: 900, color: '#FF9E44', fontSize: 14 }}>{gs.streak}</span>
          </Pill>
          <Pill>
            {[...Array(gs.maxHearts)].map((_, i) => (
              <span key={i} style={{ fontSize: 13, filter: i < gs.hearts ? 'none' : 'grayscale(1) opacity(0.3)' }}>❤️</span>
            ))}
          </Pill>
        </div>
      </div>

      {/* XP 进度条 */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '10px 14px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: `linear-gradient(135deg, ${level.color} 0%, ${level.color}AA 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            boxShadow: `0 3px 0 ${level.color}55`,
          }}>{level.badge}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 900 }}>Lv.{level.level} {level.title}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
              {xpNeeded > 0 ? `${xpInLevel} / ${xpNeeded} XP · 距下一级` : '已达最高等级 🎉'}
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: level.color }}>{gs.xp}</div>
        </div>
        <div style={{ height: 8, background: 'var(--bg-3)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            width: `${pct * 100}%`, height: '100%',
            background: `linear-gradient(90deg, ${level.color} 0%, ${level.color}CC 100%)`,
            borderRadius: 4, transition: 'width 1s var(--ease-out)',
            boxShadow: `0 0 8px ${level.color}66`,
          }}/>
        </div>
      </div>
    </div>
  );
}

// ─── 今日任务卡 ───────────────────────────────────────
function TodayMissionCard({ gs, onNav }) {
  // 今日任务：收银会员引导场景 — 4步流
  const steps = [
    { id: 'story',  icon: '🎬', label: '剧情动画', desc: '看场景，理解话术背景',  xp: 20,  done: gs.totalSessions > 2 },
    { id: 'quiz',   icon: '🧩', label: '闯关题型', desc: '4种题型检验理解',       xp: 30,  done: gs.totalSessions > 1 },
    { id: 'ai',     icon: '🤖', label: 'AI 对练', desc: '与AI模拟顾客实战',      xp: 50,  done: false },
    { id: 'replay', icon: '📊', label: '回放评分', desc: '查看AI逐句点评',        xp: 10,  done: false },
  ];
  const doneCount = steps.filter(s => s.done).length;
  const current = steps.find(s => !s.done) || steps[steps.length - 1];
  const totalXP = steps.reduce((a, s) => a + s.xp, 0);

  return (
    <div style={{
      background: '#fff', borderRadius: 22,
      boxShadow: '0 2px 2px rgba(26,31,44,0.04), 0 8px 32px rgba(26,31,44,0.08)',
      overflow: 'hidden',
    }}>
      {/* 头部 */}
      <div style={{
        background: 'linear-gradient(135deg, #1FD491 0%, #0A9A60 100%)',
        padding: '14px 18px 12px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -16, top: -16, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.75)', letterSpacing: 1, textTransform: 'uppercase' }}>今日任务</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginTop: 2 }}>💳 收银场景 · 会员引导</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3 }}>
            {doneCount}/{steps.length} 完成 · 全部完成得 +{totalXP} XP
          </div>
        </div>
        {/* 进度环 */}
        <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4"/>
            <circle cx="26" cy="26" r="22" fill="none" stroke="#fff" strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - doneCount / steps.length)}`}
              strokeLinecap="round" transform="rotate(-90 26 26)"
              style={{ transition: 'stroke-dashoffset 0.6s var(--ease-out)' }}/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff' }}>
            {doneCount}/{steps.length}
          </div>
        </div>
      </div>

      {/* 4步流 */}
      <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((step, i) => {
          const isCurrent = step.id === current.id && !step.done;
          const isLocked = !step.done && steps.slice(0, i).some(s => !s.done);
          return (
            <div
              key={step.id}
              onClick={() => !isLocked && onNav(step.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 14,
                background: isCurrent ? 'var(--brand-soft)' : step.done ? '#F8FFF9' : 'var(--bg-2)',
                border: `2px solid ${isCurrent ? 'var(--brand)' : step.done ? '#A8E6CB' : 'var(--line)'}`,
                cursor: isLocked ? 'default' : 'pointer',
                opacity: isLocked ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              {/* 步骤图标 */}
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: step.done ? 'var(--brand)' : isCurrent ? 'var(--brand)' : 'var(--bg-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: step.done ? 20 : 22,
                boxShadow: (step.done || isCurrent) ? '0 3px 0 var(--brand-ink)' : 'none',
              }}>
                {step.done ? '✅' : step.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: step.done ? 'var(--brand-ink)' : 'var(--ink-1)' }}>
                  {step.label}
                  {isCurrent && <span style={{ fontSize: 10, background: 'var(--brand)', color: '#fff', padding: '1px 7px', borderRadius: 999, marginLeft: 6, fontWeight: 800 }}>进行中</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{step.desc}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: step.done ? 'var(--brand)' : 'var(--ink-3)' }}>+{step.xp} XP</span>
                {!isLocked && !step.done && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 14 }}>›</span>
                  </div>
                )}
                {step.done && <span style={{ fontSize: 18 }}>⭐</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 技能树 ───────────────────────────────────────────
function SkillTreeMap({ onNav }) {
  const units = [
    {
      id: 'u1', name: '第一单元 · 会员引导', color: '#14B87A', gradA: '#1FD491', gradB: '#0EA86A',
      desc: '让顾客知道、想办、常用会员卡', icon: '💳',
      nodes: [
        { id: 'checkout', title: '收银办卡',  type: 'boss',     stars: 0, active: true, icon: '💳' },
        { id: 'ask',      title: '询问会员',  type: 'lesson',   stars: 3, icon: '💬' },
        { id: 'benefit',  title: '六大权益',  type: 'lesson',   stars: 2, icon: '🎁' },
        { id: 'object',   title: '异议处理',  type: 'lesson',   stars: 0, locked: true, icon: '🛡️' },
        { id: 'final',    title: '单元挑战',  type: 'treasure', stars: 0, locked: true, icon: '👑' },
      ],
    },
    {
      id: 'u2', name: '第二单元 · 慢病关怀', color: '#A67BD6', gradA: '#B890F0', gradB: '#8A5CD0',
      desc: '用药咨询、复购提醒、专属服务', icon: '💊',
      nodes: [
        { id: 'ch1', title: '初识用药', type: 'lesson', locked: true, icon: '💊' },
        { id: 'ch2', title: '用药提醒', type: 'lesson', locked: true, icon: '⏰' },
      ],
    },
  ];
  const pattern = [0, 62, 105, 62, 0, -62, -105, -62];

  return (
    <div style={{ marginBottom: 8 }}>
      {units.map(u => (
        <div key={u.id} style={{ marginBottom: 32 }}>
          {/* 单元横幅 */}
          <div style={{
            background: `linear-gradient(135deg, ${u.gradA} 0%, ${u.gradB} 100%)`,
            borderRadius: 18, padding: '14px 18px', color: '#fff',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: `0 5px 0 ${u.gradB}88, 0 8px 24px ${u.gradB}44`,
            position: 'relative', overflow: 'hidden', marginBottom: 4,
          }}>
            <div style={{ position: 'absolute', right: -16, top: -16, width: 88, height: 88, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }}/>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{u.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 900 }}>{u.name}</div>
              <div style={{ fontSize: 11, opacity: 0.88, marginTop: 2 }}>{u.desc}</div>
            </div>
          </div>

          {/* S形节点 */}
          <div style={{ position: 'relative', paddingTop: 20 }}>
            {u.nodes.map((node, i) => {
              const xOff = pattern[i % pattern.length];
              const isActive = node.active; const isLocked = node.locked;
              const done = !isActive && !isLocked && node.stars > 0;
              const sz = node.type === 'boss' ? 88 : node.type === 'treasure' ? 78 : 72;
              const bg = isLocked ? '#D5DAE1' : node.type === 'boss' ? '#FF9E44' : node.type === 'treasure' ? '#FFCE3C' : u.color;
              const sh = isLocked ? '#B5BDC8' : node.type === 'boss' ? '#C96E1A' : node.type === 'treasure' ? '#B8890A' : `${u.color}99`;

              return (
                <div key={node.id} style={{ display: 'flex', justifyContent: 'center', marginBottom: 18, transform: `translateX(${xOff * 0.8}px)` }}>
                  <div onClick={() => isActive && onNav('story')} style={{ position: 'relative', cursor: isActive ? 'pointer' : 'default' }}>
                    {isActive && (
                      <div style={{
                        position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                        marginBottom: 7, background: '#fff', color: 'var(--brand-ink)', padding: '4px 12px',
                        borderRadius: 9, border: '2.5px solid var(--brand)',
                        fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap', boxShadow: '0 3px 0 var(--brand-ink)',
                      }}>▶ 开始练习</div>
                    )}
                    {node.type === 'boss' && !isLocked && (
                      <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 20, animation: 'float-badge 2s ease-in-out infinite' }}>👑</div>
                    )}
                    <div style={{
                      width: sz, height: sz, borderRadius: '50%', background: bg,
                      boxShadow: `0 5px 0 ${sh}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: sz * 0.38,
                      animation: isActive ? 'pulse-ring 2s infinite' : 'none',
                    }}>
                      {isLocked ? '🔒' : node.icon}
                      {done && (
                        <div style={{ position: 'absolute', bottom: -3, right: -3, background: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>✅</div>
                      )}
                    </div>
                    {!isLocked && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6, gap: 2 }}>
                        {[0,1,2].map(s => <span key={s} style={{ fontSize: 13, filter: s < node.stars ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</span>)}
                      </div>
                    )}
                    <div style={{ textAlign: 'center', marginTop: isLocked ? 9 : 3, fontSize: 11, fontWeight: 800, color: isLocked ? 'var(--ink-3)' : 'var(--ink-1)', whiteSpace: 'nowrap' }}>{node.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  Tab 2 · 对练 — AI对练 + 同伴匹配
// ══════════════════════════════════════════════════════
function DrillTab({ character, gs, onNav }) {
  const [activeMode, setActiveMode] = React.useState(null); // 'ai' | 'peer'

  return (
    <div style={{ paddingBottom: 88 }}>
      <div style={{ padding: '52px 16px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>实战对练 ⚡</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>跳过剧情，直接开练 · 越练越强</div>

        {/* AI对练 大卡 */}
        <div
          onClick={() => onNav('ai')}
          style={{
            background: 'linear-gradient(135deg, #1FD491 0%, #059952 100%)',
            borderRadius: 22, padding: '20px 20px 18px',
            color: '#fff', cursor: 'pointer', marginBottom: 14,
            boxShadow: '0 6px 0 #057A3F, 0 12px 32px rgba(20,184,122,0.4)',
            position: 'relative', overflow: 'hidden',
            transition: 'transform 0.12s, box-shadow 0.12s',
          }}
          onPointerDown={e => e.currentTarget.style.cssText += 'transform:translateY(3px);box-shadow:0 3px 0 #057A3F,0 6px 16px rgba(20,184,122,0.3)'}
          onPointerUp={e => e.currentTarget.style.cssText = ''}
        >
          <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }}/>
          <div style={{ position: 'absolute', right: 20, bottom: -30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0, backdropFilter: 'blur(4px)' }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.3 }}>AI 数字人对练</div>
              <div style={{ fontSize: 13, opacity: 0.88, marginTop: 4, lineHeight: 1.4 }}>与 AI 模拟顾客实时对话 · 语音+文字双模式</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <PillLight>🎯 6个关键话术点</PillLight>
                <PillLight>⚡ 情绪实时反馈</PillLight>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.22)', borderRadius: 14, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(6px)' }}>
            <span style={{ fontSize: 14, fontWeight: 900 }}>立即开练</span>
            <span style={{ flex: 1 }}/>
            <span style={{ fontSize: 16, fontWeight: 900 }}>+50 XP →</span>
          </div>
        </div>

        {/* 同伴对练 大卡 */}
        <div
          onClick={() => onNav('peer')}
          style={{
            background: 'linear-gradient(135deg, #6B8FFF 0%, #3D5CE8 100%)',
            borderRadius: 22, padding: '20px 20px 18px',
            color: '#fff', cursor: 'pointer', marginBottom: 20,
            boxShadow: '0 6px 0 #2A45C4, 0 12px 32px rgba(78,123,255,0.4)',
            position: 'relative', overflow: 'hidden',
          }}
          onPointerDown={e => e.currentTarget.style.cssText += 'transform:translateY(3px);box-shadow:0 3px 0 #2A45C4'}
          onPointerUp={e => e.currentTarget.style.cssText = ''}
        >
          <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>👥</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.3 }}>同伴对练</div>
              <div style={{ fontSize: 13, opacity: 0.88, marginTop: 4, lineHeight: 1.4 }}>随机匹配真人搭档 · 互换店员/顾客角色</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <PillLight>🎲 随机角色分配</PillLight>
                <PillLight>🏆 竞技感更强</PillLight>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: '11px 16px', display: 'flex', alignItems: 'center', backdropFilter: 'blur(6px)' }}>
            <span style={{ fontSize: 14, fontWeight: 900 }}>随机匹配</span>
            <span style={{ flex: 1 }}/>
            <OnlineCount/>
            <span style={{ fontSize: 16, fontWeight: 900, marginLeft: 12 }}>进入 →</span>
          </div>
        </div>

        {/* 场景选择 */}
        <SectionTitle icon="🎭" title="选择练习场景" sub="选定场景后进入对练"/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {[
            { id: 'checkout', name: '收银 · 会员引导', tag: '热门', color: 'var(--brand)', difficulty: '中' },
            { id: 'objection', name: '异议处理 · 拒绝应对', tag: '进阶', color: '#FF9E44', difficulty: '难' },
            { id: 'chronic', name: '慢病关怀 · 用药咨询', tag: '专业', color: '#A67BD6', difficulty: '难', locked: true },
          ].map(s => (
            <div key={s.id} style={{
              background: '#fff', borderRadius: 16, padding: '14px 16px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex', alignItems: 'center', gap: 12,
              opacity: s.locked ? 0.5 : 1, cursor: s.locked ? 'default' : 'pointer',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>难度 · {s.difficulty}</div>
              </div>
              {s.locked
                ? <span style={{ fontSize: 18 }}>🔒</span>
                : <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: `${s.color}22`, color: s.color }}>{s.tag}</span>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  Tab 3 · 回顾 — 回放 + 历史记录
// ══════════════════════════════════════════════════════
function ReviewTab({ onNav }) {
  const sessions = [
    { id: 1, date: '今天 14:22', scenario: '收银 · 会员引导', score: 82, stars: 2, mode: 'AI对练', highlight: '话术覆盖清晰，顾客成功办卡', warn: '漏说「次日生效」' },
    { id: 2, date: '昨天 10:15', scenario: '收银 · 会员引导', score: 74, stars: 1, mode: 'AI对练', highlight: '应对速度快', warn: '权益介绍不完整' },
    { id: 3, date: '04-18 16:40', scenario: '收银 · 会员引导', score: 68, stars: 1, mode: '同伴对练', highlight: '打招呼流程顺畅', warn: '立减话术不准确' },
  ];

  return (
    <div style={{ paddingBottom: 88 }}>
      <div style={{ padding: '52px 16px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>练习回顾 📊</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16 }}>AI逐句点评，找到提升空间</div>

        {/* 整体趋势小卡 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {[
            { n: sessions.length, l: '总场次', c: 'var(--brand)' },
            { n: Math.round(sessions.reduce((a,s)=>a+s.score,0)/sessions.length), l: '平均分', c: '#4E7BFF' },
            { n: sessions.filter(s=>s.stars>=2).length, l: '优秀场次', c: '#FF9E44' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '12px 0', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.c }}>{s.n}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* 分数趋势 */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '14px 16px', boxShadow: 'var(--shadow-card)', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>📈 分数趋势（近3次）</div>
          <svg viewBox="0 0 300 80" width="100%" height="80">
            <defs><linearGradient id="sgrd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#14B87A" stopOpacity="0.3"/><stop offset="100%" stopColor="#14B87A" stopOpacity="0"/></linearGradient></defs>
            {[0,1,2].map(i=><line key={i} x1="30" y1={10+i*22} x2="280" y2={10+i*22} stroke="#F0F2F5" strokeWidth="1"/>)}
            <path d="M40 52 L150 38 L260 14" stroke="var(--brand)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M40 52 L150 38 L260 14 L260 72 L40 72 Z" fill="url(#sgrd)"/>
            {[[40,52,'68'],[150,38,'74'],[260,14,'82']].map(([x,y,v],i)=>(
              <g key={i}><circle cx={x} cy={y} r="5" fill="#fff" stroke="var(--brand)" strokeWidth="2.5"/>
              <text x={x} y={y-10} textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--brand)">{v}</text></g>
            ))}
          </svg>
        </div>

        {/* 历史记录列表 */}
        <SectionTitle icon="🗂" title="对练记录" sub={`共 ${sessions.length} 次`}/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => onNav('replay')}
              style={{
                background: '#fff', borderRadius: 18, overflow: 'hidden',
                boxShadow: 'var(--shadow-card)', cursor: 'pointer',
              }}
            >
              {/* 分数色条 */}
              <div style={{ height: 4, background: s.score >= 80 ? 'var(--brand)' : s.score >= 70 ? '#FF9E44' : '#FF5B5B' }}/>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{s.scenario}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{s.date} · {s.mode}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: s.score >= 80 ? 'var(--brand)' : s.score >= 70 ? '#FF9E44' : '#FF5B5B', lineHeight: 1 }}>{s.score}</div>
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end', marginTop: 3 }}>
                      {[0,1,2].map(i=><span key={i} style={{ fontSize: 12, filter: i<s.stars?'none':'grayscale(1) opacity(0.3)' }}>⭐</span>)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 12, color: 'var(--brand-ink)', background: 'var(--brand-soft)', padding: '6px 10px', borderRadius: 8 }}>
                    👍 {s.highlight}
                  </div>
                  <div style={{ fontSize: 12, color: '#C96E1A', background: '#FFF4E0', padding: '6px 10px', borderRadius: 8 }}>
                    💡 {s.warn}
                  </div>
                </div>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', color: 'var(--brand)', fontSize: 12, fontWeight: 800 }}>
                  查看完整回放 →
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  Tab 4 · 我的 — 成长档案 + 徽章 + 排行
// ══════════════════════════════════════════════════════
function MeTab({ character, gs, derived, onNav }) {
  const [section, setSection] = React.useState('growth'); // growth | badges | rank

  return (
    <div style={{ paddingBottom: 88 }}>
      {/* 角色大卡 */}
      <div style={{ position: 'relative' }}>
        <div style={{
          background: 'linear-gradient(160deg, #1FD491 0%, #0A9A60 100%)',
          padding: '52px 16px 60px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.5)', flexShrink: 0 }}>
              {character?.img ? <img src={character.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <AvatarXiaomei size={72}/>}
            </div>
            <div style={{ flex: 1, color: '#fff' }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{character?.nickname || '小美'}</div>
              <div style={{ fontSize: 12, opacity: 0.88, marginTop: 2 }}>{character?.store || '朝阳大悦城店'} · {derived.level.title}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12 }}>
                <span>🏆 Lv.{gs.level}</span>
                <span>🔥 {gs.streak}天连胜</span>
                <span>⭐ {gs.xp} XP</span>
              </div>
            </div>
          </div>
        </div>
        {/* 三段切换 */}
        <div style={{
          position: 'absolute', bottom: -22, left: 16, right: 16,
          background: '#fff', borderRadius: 16, padding: 4,
          display: 'flex', boxShadow: 'var(--shadow-float)',
        }}>
          {[['growth','成长数据'],['badges','我的徽章'],['rank','排行榜']].map(([k,l]) => (
            <button key={k} onClick={() => setSection(k)} style={{
              flex: 1, border: 0, borderRadius: 12, padding: '9px 0',
              background: section === k ? 'var(--brand)' : 'transparent',
              color: section === k ? '#fff' : 'var(--ink-3)',
              fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '36px 16px 0' }}>
        {section === 'growth' && <GrowthSection gs={gs} derived={derived}/>}
        {section === 'badges' && <BadgesSection gs={gs}/>}
        {section === 'rank' && <RankSection/>}
      </div>
    </div>
  );
}

function GrowthSection({ gs, derived }) {
  const { level, pct, xpInLevel, xpNeeded } = derived;
  return (
    <>
      {/* 数据条 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { n: gs.completedScenarios || 0, l: '通关场景', c: 'var(--brand)' },
          { n: gs.totalSessions * 5 || 0, l: '累计题数', c: '#4E7BFF' },
          { n: gs.maxScore || 0, l: '最高分', c: '#FF9E44' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '14px 0', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.c }}>{s.n}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* 连胜日历 */}
      <div style={{ background: '#fff', borderRadius: 18, padding: 16, boxShadow: 'var(--shadow-card)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <span style={{ animation: 'flame-flicker 1s infinite', fontSize: 20, lineHeight: 1 }}>🔥</span>
          <div style={{ fontSize: 14, fontWeight: 900, flex: 1 }}>连胜火焰 · {gs.streak} 天</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>最长 12 天</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['一','二','三','四','五','六','日'].map((d, i) => (
            <div key={i} style={{
              flex: 1, aspectRatio: '1', borderRadius: 10,
              background: i < gs.streak ? 'var(--brand)' : 'var(--bg-3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: i < gs.streak ? '#fff' : 'var(--ink-3)',
              boxShadow: i < gs.streak ? '0 2px 0 var(--brand-ink)' : 'none',
              fontSize: 9, fontWeight: 700, gap: 2,
            }}>
              <span>{d}</span>
              <span style={{ fontSize: 12 }}>{i < gs.streak ? '🔥' : '·'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* XP 等级进度 */}
      <div style={{ background: '#fff', borderRadius: 18, padding: 16, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 14 }}>🏆 等级进度</div>
        {LEVELS.map((lv, i) => {
          const reached = gs.xp >= lv.xpNeeded;
          const current = level.level === lv.level;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: reached ? `linear-gradient(135deg,${lv.color} 0%,${lv.color}99 100%)` : 'var(--bg-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                boxShadow: reached ? `0 3px 0 ${lv.color}55` : 'none',
                flexShrink: 0,
              }}>{reached ? lv.badge : '🔒'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: reached ? 'var(--ink-1)' : 'var(--ink-3)' }}>
                  Lv.{lv.level} {lv.title}
                  {current && <span style={{ fontSize: 10, background: 'var(--brand)', color: '#fff', padding: '1px 7px', borderRadius: 999, marginLeft: 6 }}>当前</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>需 {lv.xpNeeded} XP</div>
              </div>
              {reached && <span style={{ fontSize: 18 }}>✅</span>}
            </div>
          );
        })}
      </div>
    </>
  );
}

function BadgesSection({ gs }) {
  const badges = ACHIEVEMENTS.map(a => ({ ...a, earned: gs.unlockedAchievements.includes(a.id) }));
  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);

  return (
    <>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 14 }}>已获得 {earned.length}/{badges.length} 枚徽章</div>
      <div style={{ background: '#fff', borderRadius: 18, padding: '16px', boxShadow: 'var(--shadow-card)', marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>✨ 已解锁</div>
        {earned.length === 0
          ? <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ink-3)', fontSize: 13 }}>完成练习解锁第一枚徽章 🎯</div>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {earned.map(b => (
                <div key={b.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: `radial-gradient(circle at 30% 30%, ${b.color}EE, ${b.color})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                    boxShadow: `0 4px 0 ${b.color}66, 0 6px 16px ${b.color}33`,
                    animation: 'float-badge 3s ease-in-out infinite',
                  }}>{b.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', color: 'var(--ink-2)', lineHeight: 1.3 }}>{b.label}</div>
                </div>
              ))}
            </div>
          )}
      </div>
      {locked.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 18, padding: '16px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>🔒 待解锁</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {locked.map(b => (
              <div key={b.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.4 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{b.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', color: 'var(--ink-3)', lineHeight: 1.3 }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function RankSection() {
  const rows = [
    { rank: 1, name: '张璐',   count: 34, xp: 1840, self: false },
    { rank: 2, name: '小美',   count: 28, xp: 1220, self: true  },
    { rank: 3, name: '周文博', count: 22, xp: 980,  self: false },
    { rank: 4, name: '赵芳',   count: 18, xp: 720,  self: false },
    { rank: 5, name: '刘洋',   count: 14, xp: 540,  self: false },
  ];
  const rankColors = ['#FFCE3C','#D5DAE1','#E8A87C','var(--bg-3)','var(--bg-3)'];

  return (
    <>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 14 }}>本周 · 只统计练习次数，不看考核分 🔒</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 18, height: 130 }}>
        {[rows[1],rows[0],rows[2]].map((r,i) => {
          const hs=[96,128,80], cs=['#D5DAE1','#FFCE3C','#E8A87C'], rk=[2,1,3];
          return (
            <div key={r.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 800 }}>{r.count}次</div>
              <div style={{
                width: 68, height: hs[i], borderRadius: '12px 12px 0 0',
                background: `linear-gradient(180deg,${cs[i]} 0%,${cs[i]}99 100%)`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 3,
              }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>{rk[i]}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.92)' }}>{r.name}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        {rows.map((r, i) => (
          <div key={r.rank} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '13px 16px', borderTop: i > 0 ? '1px solid var(--line)' : 0,
            background: r.self ? 'var(--brand-soft)' : 'transparent',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: rankColors[i], color: i<3?'#fff':'var(--ink-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 13, flexShrink: 0,
              boxShadow: i<3?`0 2px 0 ${rankColors[i]}88`:'none',
            }}>{r.rank}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: r.self?900:700 }}>
                {r.name}
                {r.self && <span style={{ fontSize: 10, background: 'var(--brand)', color: '#fff', padding: '1px 7px', borderRadius: 6, marginLeft: 6, fontWeight: 800 }}>我</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{r.xp} XP</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: r.self ? 'var(--brand-ink)' : 'var(--ink-2)' }}>{r.count}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>次</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════
//  底部导航
// ══════════════════════════════════════════════════════
function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: 'home',   label: '首页', emoji: '🏠' },
    { id: 'drill',  label: '对练', emoji: '⚡' },
    { id: 'review', label: '回顾', emoji: '📊' },
    { id: 'me',     label: '我的', emoji: '🌟' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.96)',
      borderTop: '1px solid var(--line)',
      paddingBottom: 26, paddingTop: 6,
      backdropFilter: 'blur(20px)',
      display: 'flex',
    }}>
      {tabs.map(t => {
        const on = tab === t.id;
        return (
          <div key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, padding: '5px 0', cursor: 'pointer',
          }}>
            {/* Active indicator dot */}
            <div style={{ height: 3, width: 20, borderRadius: 99, background: on ? 'var(--brand)' : 'transparent', marginBottom: 3, transition: 'all 0.2s var(--ease-spring)' }}/>
            <div style={{
              fontSize: 22, lineHeight: 1,
              transform: on ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform 0.2s var(--ease-spring)',
            }}>{t.emoji}</div>
            <span style={{ fontSize: 10, fontWeight: on ? 900 : 600, color: on ? 'var(--brand)' : 'var(--ink-3)', transition: 'color 0.2s' }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────
//  小工具组件
// ──────────────────────────────────────────────────────
function Pill({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#fff', borderRadius: 999, boxShadow: 'var(--shadow-card)' }}>
      {children}
    </div>
  );
}

function PillLight({ children }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 9px', background: 'rgba(255,255,255,0.22)', borderRadius: 999, fontSize: 11, fontWeight: 700, color: '#fff', backdropFilter: 'blur(4px)' }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, title, sub, style: st = {} }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...st }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function OnlineCount() {
  const [n] = React.useState(() => 3 + Math.floor(Math.random() * 8));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', animation: 'sparkle 1.5s infinite' }}/>
      <span style={{ fontSize: 12, fontWeight: 700 }}>{n} 人在线</span>
    </div>
  );
}

// 向后兼容
function SkillMap({ onStartScenario }) { return <SkillTreeMap onNav={onStartScenario}/>; }
function BottomTabs({ tab, setTab }) { return <BottomNav tab={tab} setTab={setTab}/>; }

Object.assign(window, { HomeScreen, SkillMap, BottomTabs });
