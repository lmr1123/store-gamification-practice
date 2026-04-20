// 模块G：虚拟角色系统
// 流程：欢迎视频 → 角色选择 → 填昵称 → 电子工牌颁发 → 进入系统

const RANKS = [
  { id: 'intern',   label: '实习生',   stars: 1, color: '#8A92A3', bg: '#F0F1F3', uniform: '⬜ 白色工作服' },
  { id: 'regular',  label: '正式员工', stars: 2, color: '#14B87A', bg: '#E6F9F0', uniform: '🟢 绿边工作服' },
  { id: 'senior',   label: '高级店员', stars: 3, color: '#4E7BFF', bg: '#E8EEFF', uniform: '🔵 蓝标工作服' },
  { id: 'expert',   label: '门店达人', stars: 4, color: '#FF9E44', bg: '#FFF0DC', uniform: '🟠 金边工作服' },
  { id: 'star',     label: '门店之星', stars: 5, color: '#FFCE3C', bg: '#FFFBE6', uniform: '⭐ 黑金工作服' },
];

const BADGES_INIT = [
  { id: 'welcome', label: '欢迎加入', icon: '🌟', earned: true },
];

// 换装预览配置（5 套工服，用渐变 + 边框色模拟）
const UNIFORMS = [
  { label: '白色工作服', border: '#E5E8ED', badge: '#8A92A3', bg: '#F7F8FA', tag: '实习生起始装备' },
  { label: '绿边工作服', border: '#14B87A', badge: '#0A7A50', bg: '#E6F9F0', tag: '⭐⭐ 解锁' },
  { label: '蓝标工作服', border: '#4E7BFF', badge: '#2A55CC', bg: '#E8EEFF', tag: '⭐⭐⭐ 解锁' },
  { label: '金边工作服', border: '#FF9E44', badge: '#C96E1A', bg: '#FFF0DC', tag: '⭐⭐⭐⭐ 解锁' },
  { label: '黑金工作服', border: '#FFCE3C', badge: '#1A1F2C', bg: 'linear-gradient(135deg,#1A1F2C 60%,#3A2E00)', tag: '⭐⭐⭐⭐⭐ 传说' },
];

// ─────────── 主入口（管理首次 vs 已选角色） ───────────
function OnboardingGate({ onDone, savedCharacter }) {
  const [phase, setPhase] = React.useState(
    savedCharacter ? 'done' : 'video'
  );
  const [character, setCharacter] = React.useState(savedCharacter || null);

  React.useEffect(() => {
    if (phase === 'done' && character) {
      onDone(character);
    }
  }, [phase, character]);

  if (phase === 'done') return null;

  return (
    <div style={{ height: '100%', background: '#0F1318', position: 'relative', overflow: 'hidden' }}>
      {phase === 'video'   && <WelcomeVideo   onSkip={() => setPhase('select')} />}
      {phase === 'select'  && <CharacterSelect onSelect={c => { setCharacter(c); setPhase('name'); }} />}
      {phase === 'name'    && <NicknameInput  character={character} onConfirm={c => { setCharacter(c); setPhase('badge'); }} />}
      {phase === 'badge'   && <BadgeReveal    character={character} onEnter={() => onDone(character)} />}
    </div>
  );
}

// ─────────── 阶段1：欢迎视频 ───────────
function WelcomeVideo({ onSkip }) {
  const [canSkip, setCanSkip] = React.useState(false);
  const [fading, setFading] = React.useState(false);   // 开始渐黑
  const [progress, setProgress] = React.useState(0);   // 0-1
  const [duration, setDuration] = React.useState(0);
  const vidRef = React.useRef();
  const rafRef = React.useRef();

  React.useEffect(() => {
    const t = setTimeout(() => setCanSkip(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // 用 requestAnimationFrame 驱动进度条，跟视频真实时间走
  const tick = React.useCallback(() => {
    const v = vidRef.current;
    if (!v) return;
    if (v.duration) setProgress(v.currentTime / v.duration);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handleLoadedMetadata = () => {
    setDuration(vidRef.current?.duration || 0);
    rafRef.current = requestAnimationFrame(tick);
  };

  // 视频最后 1 秒开始渐黑，结束后再等 800ms 才跳转
  const handleTimeUpdate = () => {
    const v = vidRef.current;
    if (!v || !v.duration) return;
    if (v.currentTime >= v.duration - 1.2 && !fading) setFading(true);
  };

  const handleEnded = () => {
    cancelAnimationFrame(rafRef.current);
    setProgress(1);
    setTimeout(onSkip, 800);
  };

  const handleSkip = () => {
    cancelAnimationFrame(rafRef.current);
    setFading(true);
    setTimeout(onSkip, 500);
  };

  React.useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <div style={{ height: '100%', position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video
        ref={vidRef}
        src="assets/welcome.mp4"
        autoPlay playsInline
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {/* 渐黑遮罩 */}
      <div style={{
        position: 'absolute', inset: 0, background: '#000',
        opacity: fading ? 1 : 0,
        transition: 'opacity 1s ease',
        pointerEvents: 'none',
      }}/>
      {/* 跳过按钮 */}
      {canSkip && !fading && (
        <button onClick={handleSkip} style={{
          position: 'absolute', top: 56, right: 18,
          background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.3)', color: '#fff',
          padding: '7px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'var(--font-sans)',
          animation: 'slide-up 0.4s var(--ease-out)',
        }}>跳过 →</button>
      )}
      {/* 底部进度条：跟随真实播放进度 */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.15)' }}>
        <div style={{ height: '100%', background: 'var(--brand)', width: `${progress * 100}%`, transition: 'width 0.1s linear' }}/>
      </div>
    </div>
  );
}

// ─────────── 阶段2：角色选择 ───────────
function CharacterSelect({ onSelect }) {
  const [picked, setPicked] = React.useState(null);

  const characters = [
    { id: 'female', name: '小美', gender: 'female', img: 'assets/avatar-female.png', desc: '亲切温柔，顾客信赖度高' },
    { id: 'male',   name: '小强', gender: 'male',   img: 'assets/avatar-male.png',   desc: '专业干练，话术执行力强' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #0A1A12 0%, #0F1F16 100%)' }}>
      {/* 顶部文字 */}
      <div style={{ padding: '60px 24px 0', animation: 'slide-up 0.6s var(--ease-out)' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand)', letterSpacing: 3, textTransform: 'uppercase' }}>Step 1 / 3</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginTop: 8, lineHeight: 1.2 }}>选择你的角色</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>此后所有场景都会使用这个形象</div>
      </div>

      {/* 角色卡 */}
      <div style={{ flex: 1, display: 'flex', gap: 14, padding: '28px 20px 20px', alignItems: 'center' }}>
        {characters.map(c => {
          const isPicked = picked === c.id;
          return (
            <div key={c.id} onClick={() => setPicked(c.id)} style={{
              flex: 1, position: 'relative', borderRadius: 24, overflow: 'hidden', cursor: 'pointer',
              border: `3px solid ${isPicked ? 'var(--brand)' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: isPicked ? '0 0 0 6px rgba(20,184,122,0.25), 0 20px 40px rgba(20,184,122,0.2)' : '0 8px 30px rgba(0,0,0,0.4)',
              transform: isPicked ? 'scale(1.03)' : 'scale(1)',
              transition: 'all 0.3s var(--ease-spring)',
              background: isPicked ? 'rgba(20,184,122,0.08)' : 'rgba(255,255,255,0.04)',
            }}>
              {/* 角色图 */}
              <img src={c.img} alt={c.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}/>
              {/* 底部信息 */}
              <div style={{ padding: '12px 14px 16px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>{c.desc}</div>
              </div>
              {/* 选中勾 */}
              {isPicked && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'pop-in 0.3s var(--ease-spring)',
                }}>
                  {Icon.check(16, '#fff')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 确认按钮 */}
      <div style={{ padding: '0 20px 48px', animation: picked ? 'slide-up 0.4s var(--ease-out)' : 'none' }}>
        <BigButton
          onClick={() => picked && onSelect(characters.find(c => c.id === picked))}
          disabled={!picked}
          style={{ width: '100%' }}
        >
          选好了，继续 →
        </BigButton>
      </div>
    </div>
  );
}

// ─────────── 阶段3：填昵称 ───────────
function NicknameInput({ character, onConfirm }) {
  const [name, setName] = React.useState(character.name);
  const [store, setStore] = React.useState('');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#0A1A12,#0F1F16)', padding: '60px 24px 48px' }}>
      <div style={{ animation: 'slide-up 0.6s var(--ease-out)' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand)', letterSpacing: 3, textTransform: 'uppercase' }}>Step 2 / 3</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginTop: 8 }}>给自己起个名字</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>名字会出现在工牌和排行榜上</div>
      </div>

      {/* 预览头像 */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28, marginBottom: 28 }}>
        <div style={{ position: 'relative', width: 110, height: 110 }}>
          <div style={{ width: 110, height: 110, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--brand)', boxShadow: '0 0 0 6px rgba(20,184,122,0.2)' }}>
            <img src={character.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--brand)', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0A1A12', fontSize: 16 }}>⭐</div>
        </div>
      </div>

      {/* 表单 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginBottom: 6, letterSpacing: 1 }}>昵称</div>
          <input
            value={name} onChange={e => setName(e.target.value)} maxLength={8}
            placeholder="最多 8 个字"
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)',
              color: '#fff', fontSize: 16, fontFamily: 'var(--font-sans)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginBottom: 6, letterSpacing: 1 }}>门店名称</div>
          <input
            value={store} onChange={e => setStore(e.target.value)}
            placeholder="例：朝阳大悦城店"
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)',
              color: '#fff', fontSize: 16, fontFamily: 'var(--font-sans)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <BigButton
        onClick={() => name.trim() && onConfirm({ ...character, nickname: name.trim(), store: store.trim() || '朝阳大悦城店' })}
        disabled={!name.trim()}
        style={{ width: '100%', marginTop: 20 }}
      >
        制作我的工牌 →
      </BigButton>
    </div>
  );
}

// ─────────── 阶段4：电子工牌颁发 ───────────
function BadgeReveal({ character, onEnter }) {
  const [shown, setShown] = React.useState(false);
  const [glowing, setGlowing] = React.useState(false);
  const [readyBtn, setReadyBtn] = React.useState(false);

  React.useEffect(() => {
    const t1 = setTimeout(() => setShown(true), 300);
    const t2 = setTimeout(() => setGlowing(true), 900);
    const t3 = setTimeout(() => setReadyBtn(true), 1800);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'linear-gradient(180deg,#0A1A12,#0F1F16)', gap: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand)', letterSpacing: 3, textTransform: 'uppercase', opacity: shown ? 1 : 0, transition: 'opacity 0.6s' }}>🎉 专属工牌已颁发</div>

      {/* 工牌主体 */}
      <div style={{
        opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(30px) scale(0.9)',
        transition: 'all 0.7s var(--ease-spring)',
      }}>
        <WorkBadge character={character} glowing={glowing}/>
      </div>

      {/* 换装系统预告 */}
      {glowing && (
        <div style={{ animation: 'slide-up 0.5s var(--ease-out)', width: '100%', maxWidth: 340 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }}>升段解锁工服 · 努力练习即可获得</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {UNIFORMS.map((u, i) => (
              <div key={i} style={{
                flex: 1, borderRadius: 10, overflow: 'hidden',
                border: `2px solid ${i === 0 ? u.border : 'rgba(255,255,255,0.1)'}`,
                opacity: i === 0 ? 1 : 0.45,
                background: i === 4 ? '#1A1F2C' : '#fff',
              }}>
                <div style={{ height: 6, background: u.border }}/>
                <div style={{ padding: '4px 0', textAlign: 'center', fontSize: 14 }}>
                  {['⬜','🟢','🔵','🟠','🖤'][i]}
                </div>
                {i === 0 && <div style={{ background: 'var(--brand)', color: '#fff', fontSize: 8, fontWeight: 800, textAlign: 'center', padding: '2px 0' }}>当前</div>}
                {i > 0 && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, textAlign: 'center', padding: '2px 0' }}>{['★★','★★★','★★★★','★★★★★'][i-1]}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {readyBtn && (
        <BigButton onClick={onEnter} style={{ width: '100%', maxWidth: 340, animation: 'pop-in 0.5s var(--ease-spring)' }}>
          开始练习 →
        </BigButton>
      )}
    </div>
  );
}

// ─────────── 电子工牌组件（可复用） ───────────
function WorkBadge({ character, glowing = false, compact = false }) {
  const rank = RANKS[0]; // 新人默认实习生
  const size = compact ? 52 : 90;
  const bgColor = glowing
    ? 'linear-gradient(145deg, #E6F9F0 0%, #fff 60%)'
    : 'linear-gradient(145deg, #fff 0%, #F5F8F6 100%)';

  return (
    <div style={{
      width: compact ? 220 : 300, background: bgColor,
      borderRadius: compact ? 16 : 22,
      boxShadow: glowing
        ? '0 0 0 2px var(--brand), 0 0 30px rgba(20,184,122,0.35), 0 20px 50px rgba(0,0,0,0.3)'
        : '0 8px 30px rgba(0,0,0,0.15)',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* 顶部绿色横条 */}
      <div style={{ height: compact ? 8 : 12, background: 'linear-gradient(90deg, var(--brand) 0%, #0A7A50 100%)' }}/>
      {/* 工牌打孔 + 挂绳 */}
      {!compact && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 28, height: 8, borderRadius: 4, background: '#E5E8ED', border: '1.5px solid #C8CDD6' }}/>
        </div>
      )}

      <div style={{ padding: compact ? '10px 12px 12px' : '12px 20px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
        {/* 头像 */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: size, height: size, borderRadius: compact ? 12 : 18, overflow: 'hidden', border: '2px solid var(--brand)', boxShadow: '0 4px 12px rgba(20,184,122,0.25)' }}>
            <img src={character?.img || 'assets/avatar-female.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          </div>
          {/* 段位徽章 */}
          <div style={{
            position: 'absolute', bottom: -4, right: -4,
            background: rank.color, color: '#fff',
            fontSize: compact ? 8 : 9, fontWeight: 800,
            padding: compact ? '2px 4px' : '2px 5px', borderRadius: 999,
            border: '1.5px solid #fff', whiteSpace: 'nowrap',
          }}>{rank.label}</div>
        </div>

        {/* 文字信息 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: compact ? 16 : 20, fontWeight: 900, color: '#1A1F2C', letterSpacing: -0.3 }}>
            {character?.nickname || character?.name || '小美'}
          </div>
          <div style={{ fontSize: compact ? 10 : 12, color: '#8A92A3', marginTop: 2 }}>
            {character?.store || '朝阳大悦城店'}
          </div>
          <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ width: compact ? 10 : 14, height: compact ? 10 : 14, borderRadius: 3, background: i < rank.stars ? rank.color : '#E5E8ED' }}/>
            ))}
          </div>
          {!compact && (
            <div style={{ marginTop: 8, display: 'flex', gap: 5 }}>
              <div style={{ background: rank.bg, color: rank.color, fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999, border: `1px solid ${rank.color}` }}>🌟 欢迎加入</div>
            </div>
          )}
        </div>
      </div>

      {/* 门店 LOGO 装饰 */}
      {!compact && (
        <div style={{ padding: '0 20px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>+</div>
          <span style={{ fontSize: 11, color: '#8A92A3', fontWeight: 600 }}>门店对练培训系统</span>
          <span style={{ marginLeft: 'auto', fontSize: 9, color: '#C3C8D1', fontFamily: 'var(--font-mono)' }}>#XM-2026</span>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { OnboardingGate, WorkBadge, RANKS });
