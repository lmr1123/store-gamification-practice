// ══════════════════════════════════════════════════════
//  首页 · 技能树地图  v2.0 Production
// ══════════════════════════════════════════════════════

function HomeScreen({ character, onStartScenario, onGoProfile, onGoLeaderboard, onGoAdmin }) {
  const [tab, setTab] = React.useState('map');
  const { state: gameState, derived } = useGame();

  const tabContent = {
    map: <SkillMapTab onStartScenario={onStartScenario} character={character}/>,
    leaderboard: <LeaderboardTab/>,
    shop: <ShopTab gameState={gameState}/>,
    profile: <ProfileTabMini character={character} onGoProfile={onGoProfile}/>,
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-2)' }}>
      <HomeHeader character={character} gameState={gameState} derived={derived} onGoProfile={onGoProfile}/>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {Object.entries(tabContent).map(([key, content]) => (
          <div key={key} style={{
            position: 'absolute', inset: 0,
            opacity: tab === key ? 1 : 0,
            pointerEvents: tab === key ? 'auto' : 'none',
            transition: 'opacity 0.2s',
            overflowY: 'auto',
          }} className="no-scrollbar">
            {content}
          </div>
        ))}
      </div>
      <BottomTabBar tab={tab} setTab={setTab}/>
    </div>
  );
}

// ─── 顶部 Header ───────────────────────────────────────
function HomeHeader({ character, gameState, derived, onGoProfile }) {
  const { level, pct } = derived;
  const timeOfDay = new Date().getHours();
  const greeting = timeOfDay < 12 ? '早上好' : timeOfDay < 18 ? '下午好' : '晚上好';

  return (
    <div style={{
      padding: '56px 18px 12px',
      background: 'linear-gradient(180deg, var(--brand-soft) 0%, var(--bg-2) 100%)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {/* 角色头像入口 */}
        <div onClick={onGoProfile} style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 15,
            overflow: 'hidden', border: '2.5px solid var(--brand)',
            boxShadow: '0 3px 12px rgba(20,184,122,0.35)',
          }}>
            {character?.img
              ? <img src={character.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              : <AvatarXiaomei size={48}/>
            }
          </div>
          <div style={{
            position: 'absolute', bottom: -5, right: -6,
            background: level.color, color: '#fff',
            fontSize: 9, fontWeight: 900, padding: '2px 5px',
            borderRadius: 999, border: '2px solid var(--bg-1)',
            whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}>Lv.{gameState.level}</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{greeting}，</div>
          <div style={{
            fontSize: 20, fontWeight: 900, color: 'var(--ink-1)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{character?.nickname || '小美'} 👋</div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '7px 12px', background: '#fff',
          borderRadius: 999, boxShadow: 'var(--shadow-card)',
        }}>
          <span style={{ animation: 'flame-flicker 1s infinite', display: 'block' }}>🔥</span>
          <span style={{ fontWeight: 900, color: '#FF9E44', fontSize: 15 }}>{gameState.streak}</span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 3,
          padding: '7px 10px', background: '#fff',
          borderRadius: 999, boxShadow: 'var(--shadow-card)',
        }}>
          <HeartsDisplay hearts={gameState.hearts} maxHearts={gameState.maxHearts} size={14}/>
        </div>
      </div>

      {/* XP 进度条 */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '10px 14px', boxShadow: 'var(--shadow-card)' }}>
        <XPBar compact={false}/>
      </div>

      <DailyChallengeBanner gameState={gameState}/>
    </div>
  );
}

function DailyChallengeBanner({ gameState }) {
  const done = gameState.totalSessions > 0;
  return (
    <div style={{
      marginTop: 10,
      background: done ? 'var(--brand-soft)' : 'linear-gradient(135deg, #1FD491 0%, #0EA86A 100%)',
      borderRadius: 14, padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: done ? 'none' : '0 4px 16px rgba(20,184,122,0.3)',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 12, flexShrink: 0,
        background: done ? 'var(--brand)' : 'rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>{done ? '✅' : '🎯'}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: done ? 'var(--brand-ink)' : '#fff' }}>每日挑战 · 收银办卡</div>
        <div style={{ fontSize: 11, color: done ? 'var(--brand-ink)' : 'rgba(255,255,255,0.85)', marginTop: 1 }}>
          {done ? '今日已完成 🎉' : '完成获 +30 XP 和 🔥 连胜'}
        </div>
      </div>
      {!done && (
        <div style={{
          background: 'rgba(255,255,255,0.25)', color: '#fff',
          fontSize: 11, fontWeight: 800, padding: '5px 10px', borderRadius: 8,
          backdropFilter: 'blur(6px)', whiteSpace: 'nowrap',
        }}>去完成 →</div>
      )}
    </div>
  );
}

// ─── 技能树地图 Tab ────────────────────────────────────
function SkillMapTab({ onStartScenario, character }) {
  const units = [
    {
      id: 'u1', name: '第一单元 · 会员引导',
      color: '#14B87A', gradStart: '#1FD491', gradEnd: '#0EA86A',
      desc: '让顾客「知道、想办、常用」会员卡', icon: '💳',
      nodes: [
        { id: 'intro',    title: '情境介绍', type: 'start',    stars: 3, icon: '📖' },
        { id: 'ask',      title: '询问会员', type: 'lesson',   stars: 3, icon: '💬' },
        { id: 'benefit',  title: '六大权益', type: 'lesson',   stars: 2, icon: '🎁' },
        { id: 'checkout', title: '收银办卡', type: 'boss',     stars: 0, active: true, icon: '💳' },
        { id: 'object',   title: '异议处理', type: 'lesson',   stars: 0, locked: true, icon: '🛡️' },
        { id: 'final',    title: '单元挑战', type: 'treasure', stars: 0, locked: true, icon: '👑' },
      ],
    },
    {
      id: 'u2', name: '第二单元 · 慢病关怀',
      color: '#A67BD6', gradStart: '#B890F0', gradEnd: '#8A5CD0',
      desc: '用药咨询、复购提醒、专属服务', icon: '💊',
      nodes: [
        { id: 'ch1', title: '初识用药', type: 'lesson', locked: true, icon: '💊' },
        { id: 'ch2', title: '用药提醒', type: 'lesson', locked: true, icon: '⏰' },
        { id: 'ch3', title: '慢病挑战', type: 'boss',   locked: true, icon: '🏥' },
      ],
    },
  ];

  return (
    <div style={{ padding: '8px 18px 100px' }}>
      {units.map((unit) => (
        <div key={unit.id} style={{ marginBottom: 36 }}>
          <UnitBanner unit={unit}/>
          <SkillPath nodes={unit.nodes} unitColor={unit.color} onStart={onStartScenario}/>
        </div>
      ))}
    </div>
  );
}

function UnitBanner({ unit }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${unit.gradStart} 0%, ${unit.gradEnd} 100%)`,
      borderRadius: 20, padding: '16px 18px', color: '#fff',
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: `0 6px 0 ${unit.gradEnd}88, 0 10px 30px ${unit.gradEnd}44`,
      position: 'relative', overflow: 'hidden', marginBottom: 4,
    }}>
      <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }}/>
      <div style={{
        width: 52, height: 52, borderRadius: 16, flexShrink: 0,
        background: 'rgba(255,255,255,0.22)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, backdropFilter: 'blur(4px)',
      }}>{unit.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 900 }}>{unit.name}</div>
        <div style={{ fontSize: 12, opacity: 0.9, marginTop: 3 }}>{unit.desc}</div>
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)',
        color: '#fff', padding: '7px 12px', borderRadius: 10, fontWeight: 700, fontSize: 12,
        backdropFilter: 'blur(6px)',
      }}>教程</div>
    </div>
  );
}

function SkillPath({ nodes, unitColor, onStart }) {
  const pattern = [0, 65, 110, 65, 0, -65, -110, -65];
  return (
    <div style={{ position: 'relative', paddingTop: 24, paddingBottom: 8 }}>
      {nodes.map((node, i) => (
        <SkillNode
          key={node.id} node={node}
          xOffset={pattern[i % pattern.length]}
          unitColor={unitColor}
          onClick={() => node.active && onStart && onStart(node)}
        />
      ))}
    </div>
  );
}

function SkillNode({ node, xOffset, unitColor, onClick }) {
  const isActive = node.active;
  const isLocked = node.locked;
  const isCompleted = !isActive && !isLocked && node.stars > 0;
  const typeSize = { start: 68, lesson: 76, boss: 94, treasure: 80 };
  const size = typeSize[node.type] || 76;
  const bg = isLocked ? '#D5DAE1' : node.type === 'boss' ? '#FF9E44' : node.type === 'treasure' ? '#FFCE3C' : unitColor;
  const shadow = isLocked ? '#B5BDC8' : node.type === 'boss' ? '#C96E1A' : node.type === 'treasure' ? '#B8890A' : `${unitColor}99`;

  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      marginBottom: 20,
      transform: `translateX(${xOffset * 0.85}px)`,
    }}>
      <div onClick={onClick} style={{ position: 'relative', cursor: isActive ? 'pointer' : 'default', userSelect: 'none' }}>
        {isActive && (
          <div style={{
            position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
            marginBottom: 8, background: '#fff', color: 'var(--brand-ink)', padding: '5px 14px',
            borderRadius: 10, border: '2.5px solid var(--brand)',
            fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap',
            boxShadow: '0 3px 0 var(--brand-ink)',
          }}>▶ 开始</div>
        )}
        {node.type === 'boss' && !isLocked && (
          <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 22, animation: 'float-badge 2s ease-in-out infinite' }}>👑</div>
        )}
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: bg, boxShadow: `0 6px 0 ${shadow}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4,
          animation: isActive ? 'pulse-ring 2s infinite' : 'none',
          position: 'relative',
        }}>
          {isLocked ? <span style={{ fontSize: 28 }}>🔒</span> : node.icon}
          {isCompleted && (
            <div style={{
              position: 'absolute', bottom: -4, right: -4,
              background: '#fff', borderRadius: '50%', width: 26, height: 26,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)', fontSize: 14,
            }}>✅</div>
          )}
        </div>
        {!isLocked && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 7, gap: 3 }}>
            {[0,1,2].map(s => (
              <span key={s} style={{ fontSize: 14, filter: s < node.stars ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</span>
            ))}
          </div>
        )}
        <div style={{
          textAlign: 'center', marginTop: isLocked ? 10 : 4,
          fontSize: 12, fontWeight: 800,
          color: isLocked ? 'var(--ink-3)' : 'var(--ink-1)',
          whiteSpace: 'nowrap',
        }}>{node.title}</div>
      </div>
    </div>
  );
}

// ─── 排行榜 Tab ────────────────────────────────────────
function LeaderboardTab() {
  const rows = [
    { rank: 1, name: '张璐',  count: 34, xp: 1840, self: false },
    { rank: 2, name: '小美',  count: 28, xp: 1220, self: true  },
    { rank: 3, name: '周文博', count: 22, xp: 980,  self: false },
    { rank: 4, name: '赵芳',  count: 18, xp: 720,  self: false },
    { rank: 5, name: '刘洋',  count: 14, xp: 540,  self: false },
  ];
  const rankColors = ['#FFCE3C', '#D5DAE1', '#E8A87C', 'var(--bg-3)', 'var(--bg-3)'];

  return (
    <div style={{ padding: '16px 18px 100px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>🏪 本店练习榜</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>本周 · 只统计练习次数，放心练 🔒</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginBottom: 20, height: 140 }}>
        {[rows[1], rows[0], rows[2]].map((r, i) => {
          const heights = [100, 130, 84];
          const colors = ['#D5DAE1', '#FFCE3C', '#E8A87C'];
          const ranks = [2, 1, 3];
          return (
            <div key={r.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-2)' }}>{r.count}次</div>
              <div style={{
                width: 70, height: heights[i], borderRadius: '12px 12px 0 0',
                background: `linear-gradient(180deg, ${colors[i]} 0%, ${colors[i]}99 100%)`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                paddingTop: 10, gap: 4,
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>{ranks[i]}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>{r.name}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        {rows.map((r, i) => (
          <div key={r.rank} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            borderTop: i > 0 ? '1px solid var(--line)' : 0,
            background: r.self ? 'var(--brand-soft)' : 'transparent',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: rankColors[i], color: i < 3 ? '#fff' : 'var(--ink-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 13, flexShrink: 0,
            }}>{r.rank}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: r.self ? 900 : 700 }}>
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
    </div>
  );
}

// ─── 商店 Tab ──────────────────────────────────────────
function ShopTab({ gameState }) {
  const items = [
    { id: 's1', name: '心跳恢复卡', icon: '💖', price: 50,  desc: '立即恢复1颗爱心' },
    { id: 's2', name: 'XP 双倍卡', icon: '⚡', price: 120, desc: '下次练习XP×2' },
    { id: 's3', name: '提示卡',    icon: '💡', price: 30,  desc: '答题时使用提示' },
    { id: 's4', name: '防错护盾',  icon: '🛡', price: 80,  desc: '下次答错不扣心' },
  ];
  return (
    <div style={{ padding: '16px 18px 100px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>💎 道具商店</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>用钻石兑换练习道具</div>
      </div>
      <div style={{
        background: 'var(--grad-sky)', borderRadius: 16, padding: '14px 18px', color: '#fff',
        marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: 'var(--shadow-gem)',
      }}>
        <div style={{ fontSize: 36 }}>💎</div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>我的钻石</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>120</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.85 }}>通过练习获取更多</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {items.map(item => (
          <div key={item.id} style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 36, textAlign: 'center' }}>{item.icon}</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{item.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>{item.desc}</div>
            </div>
            <button style={{
              border: 0, borderRadius: 10, padding: '9px 0',
              background: 'var(--grad-sky)', color: '#fff',
              fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 3px 0 #3050CC',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>💎 {item.price}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 个人简版 Tab ──────────────────────────────────────
function ProfileTabMini({ character, onGoProfile }) {
  const { state: gameState, derived } = useGame();
  return (
    <div style={{ padding: '16px 18px 100px' }}>
      <div style={{
        background: 'var(--grad-hero)', borderRadius: 20, padding: 18,
        color: '#fff', display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 8px 24px rgba(20,184,122,0.3)', marginBottom: 14,
      }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.4)', flexShrink: 0 }}>
          {character?.img
            ? <img src={character.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            : <AvatarXiaomei size={64}/>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{character?.nickname || '小美'}</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{character?.store || '朝阳大悦城店'} · {derived.level.title}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 12 }}>
            <span>🏆 {gameState.totalSessions}场</span>
            <span>🔥 {gameState.streak}天</span>
            <span>💎 120</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { n: gameState.completedScenarios || 0, l: '通关场景', c: 'var(--brand)' },
          { n: gameState.totalSessions * 5 || 0,  l: '累计题数', c: '#4E7BFF' },
          { n: gameState.maxScore || 0,           l: '最高分',   c: '#FF9E44' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 12, textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.c }}>{s.n}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <button onClick={onGoProfile} style={{
        width: '100%', border: '2px solid var(--brand)', borderRadius: 14,
        background: 'var(--brand-soft)', color: 'var(--brand-ink)',
        padding: 13, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
      }}>查看完整成长档案 →</button>
    </div>
  );
}

// ─── 底部 TabBar ───────────────────────────────────────
function BottomTabBar({ tab, setTab }) {
  const tabs = [
    { id: 'map',         label: '练习', icon: '🗺' },
    { id: 'leaderboard', label: '排行', icon: '🏆' },
    { id: 'shop',        label: '商店', icon: '💎' },
    { id: 'profile',     label: '我的', icon: '👤' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'rgba(255,255,255,0.95)',
      borderTop: '1px solid var(--line)',
      paddingBottom: 28, paddingTop: 8,
      backdropFilter: 'blur(20px)',
      display: 'flex', zIndex: 100,
    }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <div key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, padding: '6px 8px', cursor: 'pointer',
            color: active ? 'var(--brand)' : 'var(--ink-3)',
          }}>
            <div style={{
              fontSize: 24, lineHeight: 1,
              transform: active ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s var(--ease-spring)',
            }}>{t.icon}</div>
            <span style={{ fontSize: 11, fontWeight: active ? 800 : 600 }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// 向后兼容
function SkillMap({ onStartScenario }) { return <SkillMapTab onStartScenario={onStartScenario}/>; }
function BottomTabs({ tab, setTab }) { return <BottomTabBar tab={tab} setTab={setTab}/>; }

Object.assign(window, { HomeScreen, SkillMap, BottomTabs });
