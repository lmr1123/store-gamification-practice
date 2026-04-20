// 屏幕7：同伴对练（随机匹配 → 角色分配 → 视频/语音对练 → 切换重来）

function PeerMatchScreen({ onComplete, avatarStyle = 'chibi' }) {
  const [phase, setPhase] = React.useState('lobby'); // lobby | matching | role-reveal | practice | swap
  const [role, setRole] = React.useState(null); // 'clerk' | 'customer'
  const [media, setMedia] = React.useState('voice'); // 'voice' | 'video'
  const [round, setRound] = React.useState(1);

  const startMatch = (m) => { setMedia(m); setPhase('matching'); };

  React.useEffect(() => {
    if (phase === 'matching') {
      const t = setTimeout(() => {
        // 随机分角色
        setRole(Math.random() < 0.5 ? 'clerk' : 'customer');
        setPhase('role-reveal');
      }, 2600);
      return () => clearTimeout(t);
    }
    if (phase === 'role-reveal') {
      const t = setTimeout(() => setPhase('practice'), 2800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const finishRound = () => setPhase('swap');
  const swapRoles = () => {
    setRole(r => r === 'clerk' ? 'customer' : 'clerk');
    setRound(r => r + 1);
    setPhase('role-reveal');
  };
  const reMatch = () => { setRole(null); setRound(1); setPhase('matching'); };

  return (
    <div style={{ height: '100%', background: 'var(--bg-2)', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '54px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onComplete} style={{ background: 'rgba(0,0,0,0.06)', border: 0, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{Icon.x(18)}</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>同伴对练</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>👯 真人配对 · 角色扮演</div>
        </div>
        {phase === 'practice' && <div style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: '#FFF4D6', color: '#8A6500' }}>第 {round} 轮</div>}
      </div>

      {phase === 'lobby' && <Lobby onStart={startMatch}/>}
      {phase === 'matching' && <Matching media={media}/>}
      {phase === 'role-reveal' && <RoleReveal role={role}/>}
      {phase === 'practice' && <PracticeStage role={role} media={media} onFinish={finishRound} avatarStyle={avatarStyle}/>}
      {phase === 'swap' && <SwapScreen onSwap={swapRoles} onReMatch={reMatch} onExit={onComplete}/>}
    </div>
  );
}

// ——— 大厅：在线店员列表 + 选择视频/语音 ———
function Lobby({ onStart }) {
  const online = [
    { name: '张璐', store: '大悦城店', avatar: AvatarYoung, streak: 12 },
    { name: '周文博', store: '国贸店', avatar: AvatarWorker, streak: 5 },
    { name: '赵芳', store: '五道口店', avatar: AvatarElder, streak: 8 },
    { name: '刘思琦', store: '望京店', avatar: AvatarPicky, streak: 3 },
  ];
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 40px' }} className="no-scrollbar">
      {/* 玩法说明 */}
      <div style={{ background: 'linear-gradient(135deg, #FF9E44 0%, #FF6FA4 100%)', borderRadius: 18, padding: 14, color: '#fff', marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>🎭 同伴对练怎么玩</div>
        <div style={{ fontSize: 12, opacity: 0.95, marginTop: 6, lineHeight: 1.5 }}>
          系统随机配对 → 随机分你"顾客"或"店员"角色<br/>
          扮演顾客按提示牌演，扮演店员正常练习<br/>
          同伴压力比 AI 更真实，突破"背话术"瓶颈
        </div>
      </div>

      {/* 在线状态 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#14B87A', animation: 'sparkle 1s infinite' }}/>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>当前 23 位店员在线</span>
      </div>

      {/* 在线头像 */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 12, boxShadow: 'var(--shadow-card)', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }} className="no-scrollbar">
          {online.map((p, i) => (
            <div key={i} style={{ flexShrink: 0, textAlign: 'center', width: 60 }}>
              <div style={{ position: 'relative' }}>
                <p.avatar size={56}/>
                <div style={{ position: 'absolute', bottom: 0, right: 4, width: 12, height: 12, borderRadius: '50%', background: '#14B87A', border: '2px solid #fff' }}/>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>{p.name}</div>
              <div style={{ fontSize: 9, color: 'var(--ink-3)' }}>🔥 {p.streak}</div>
            </div>
          ))}
          <div style={{ flexShrink: 0, width: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--ink-3)' }}>+19</div>
        </div>
      </div>

      {/* 场景选择 */}
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>选择对练场景</div>
      <div style={{ background: '#fff', borderRadius: 14, padding: 12, marginBottom: 14, boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: 10, border: '2px solid var(--brand)' }}>
        <div style={{ fontSize: 28 }}>💳</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>收银办卡 · 会员引导</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>5 分钟一轮 · 6 大话术要点</div>
        </div>
        {Icon.check(20, 'var(--brand)')}
      </div>

      {/* 媒体选择 + 匹配按钮 */}
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>选择对练方式</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={() => onStart('voice')} style={mediaCardStyle}>
          <div style={{ fontSize: 32 }}>🎙</div>
          <div style={{ fontSize: 14, fontWeight: 800, marginTop: 6 }}>纯语音</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, textAlign: 'center' }}>看不见对方<br/>更专注话术本身</div>
          <div style={{ marginTop: 8, padding: '4px 10px', background: 'var(--brand)', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 999 }}>推荐新手</div>
        </button>
        <button onClick={() => onStart('video')} style={{ ...mediaCardStyle, borderColor: '#FF9E44' }}>
          <div style={{ fontSize: 32 }}>📹</div>
          <div style={{ fontSize: 14, fontWeight: 800, marginTop: 6 }}>视频对练</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, textAlign: 'center' }}>可以看见对方<br/>真实感更强</div>
          <div style={{ marginTop: 8, padding: '4px 10px', background: '#FF9E44', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 999 }}>挑战升级</div>
        </button>
      </div>
    </div>
  );
}
const mediaCardStyle = {
  appearance: 'none', border: '2px solid var(--brand)', background: '#fff',
  padding: 16, borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  boxShadow: '0 4px 0 rgba(20,184,122,0.25)',
};

// ——— 匹配中（3 个转动头像） ———
function Matching({ media }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div style={{ position: 'relative', width: 180, height: 180 }}>
        {/* 转动的圆环 */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px dashed var(--brand)', animation: 'spin 3s linear infinite' }}/>
        <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', border: '3px dashed #FF9E44', animation: 'spin 2s linear infinite reverse' }}/>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fff', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AvatarXiaomei size={64}/>
          </div>
        </div>
        {/* 周围浮动头像 */}
        {[0,1,2,3].map(i => {
          const A = [AvatarElder, AvatarWorker, AvatarYoung, AvatarPicky][i];
          const angle = (i / 4) * Math.PI * 2;
          return (
            <div key={i} style={{
              position: 'absolute',
              left: `calc(50% + ${Math.cos(angle) * 80}px - 22px)`,
              top: `calc(50% + ${Math.sin(angle) * 80}px - 22px)`,
              animation: `sparkle 1.2s infinite ${i * 0.2}s`,
            }}>
              <A size={44}/>
            </div>
          );
        })}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--brand-ink)' }}>正在为你匹配...</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6 }}>{media === 'video' ? '📹 视频' : '🎙 语音'}模式 · 随机分配角色</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--brand)', animation: `sparkle 1s infinite ${i * 0.2}s` }}/>
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ——— 匹配成功 → 揭晓角色 ———
function RoleReveal({ role }) {
  const isClerk = role === 'clerk';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, animation: 'pop-in 0.6s var(--ease-spring)' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-3)', letterSpacing: 3, textTransform: 'uppercase' }}>匹配成功！你扮演</div>
      <div style={{
        width: 180, height: 180, borderRadius: '50%',
        background: isClerk ? 'linear-gradient(135deg,#14B87A,#0A7A50)' : 'linear-gradient(135deg,#FF9E44,#C94747)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isClerk ? '0 12px 30px rgba(20,184,122,0.4)' : '0 12px 30px rgba(255,158,68,0.4)',
        animation: 'pulse-ring 2s infinite',
      }}>
        <div style={{ background: '#fff', borderRadius: '50%', padding: 8 }}>
          {isClerk ? <AvatarXiaomei size={120}/> : <AvatarElder size={120}/>}
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: isClerk ? 'var(--brand-ink)' : '#C94747' }}>
        {isClerk ? '🛒 店员小美' : '👵 顾客王阿姨'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', maxWidth: 280, textAlign: 'center', lineHeight: 1.5 }}>
        {isClerk ? '按真实情况接待顾客，完成 6 大话术要点' : '按提示牌演出角色个性，适当给店员一些"挑战"'}
      </div>
    </div>
  );
}

// ——— 对练舞台（视频/语音 + 提示牌） ———
function PracticeStage({ role, media, onFinish, avatarStyle }) {
  const [seconds, setSeconds] = React.useState(300); // 5 分钟
  const [muted, setMuted] = React.useState(false);
  const [camOn, setCamOn] = React.useState(media === 'video');

  React.useEffect(() => {
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const isClerk = role === 'clerk';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px 12px 16px', gap: 10, minHeight: 0 }}>
      {/* 双人视频/语音窗 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <PeerTile label="我" name="小美" sub={isClerk ? '店员' : '顾客'} role={role} media={media} camOn={camOn} self avatarStyle={avatarStyle}/>
        <PeerTile label="对方" name="张璐" sub={isClerk ? '顾客' : '店员'} role={isClerk ? 'customer' : 'clerk'} media={media} camOn={media === 'video'} avatarStyle={avatarStyle}/>
      </div>

      {/* 计时 + 控制 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', padding: 8, borderRadius: 12, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5B5B', animation: 'sparkle 1s infinite' }}/>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800 }}>{fmt(seconds)}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 4 }}>剩余</span>
        </div>
        <button onClick={() => setMuted(m => !m)} style={ctrlBtn(muted ? 'var(--danger)' : 'var(--bg-3)')}>
          {Icon.mic(16, muted ? '#fff' : 'var(--ink-2)')}
        </button>
        <button onClick={() => setCamOn(c => !c)} disabled={media !== 'video'} style={ctrlBtn(camOn && media === 'video' ? 'var(--brand)' : 'var(--bg-3)', media !== 'video')}>
          📹
        </button>
        <button onClick={onFinish} style={{ ...ctrlBtn('var(--danger)'), paddingLeft: 12, paddingRight: 12, width: 'auto', fontSize: 12, color: '#fff', fontWeight: 800 }}>结束</button>
      </div>

      {/* 提示牌 —— 根据角色显示不同内容 */}
      <div style={{ background: isClerk ? 'var(--brand-soft)' : '#FFF4D6', border: `2px solid ${isClerk ? 'var(--brand)' : '#FFCE3C'}`, borderRadius: 14, padding: 12, flex: 1, overflowY: 'auto' }} className="no-scrollbar">
        <div style={{ fontSize: 11, fontWeight: 800, color: isClerk ? 'var(--brand-ink)' : '#8A6500', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
          🪧 {isClerk ? '店员任务卡' : '顾客提示牌（按这个演）'}
        </div>
        {isClerk ? <ClerkTaskCard/> : <CustomerPromptCard/>}
      </div>
    </div>
  );
}
const ctrlBtn = (bg, disabled) => ({
  appearance: 'none', border: 0, background: bg, borderRadius: 10,
  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
});

function PeerTile({ label, name, sub, role, media, camOn, self, avatarStyle }) {
  const Comp = role === 'clerk' ? AvatarXiaomei : AvatarElder;
  const showVideo = media === 'video' && camOn;
  return (
    <div style={{ position: 'relative', aspectRatio: '1', borderRadius: 14, overflow: 'hidden', background: showVideo ? 'linear-gradient(135deg,#2A313B,#1A1F2C)' : '#fff', boxShadow: 'var(--shadow-card)', border: self ? '2px solid var(--brand)' : '2px solid var(--line)' }}>
      {showVideo ? (
        // 模拟视频画面：渐变 + 浮动光晕 + 大头像
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 30% 30%, ${self ? '#14B87A44' : '#FF9E4444'} 0%, transparent 60%)` }}/>
          <div style={{ transform: 'scale(1.4)' }}><Comp size={90} style={avatarStyle}/></div>
          {self && <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>🔴 LIVE</div>}
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <div style={{ position: 'relative' }}>
            <Comp size={72} style={avatarStyle}/>
            {/* 音量波纹 */}
            <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid var(--brand)', opacity: 0.5, animation: 'pulse-ring 2s infinite' }}/>
          </div>
          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>
            {[6, 10, 14, 8, 12].map((h, i) => <div key={i} style={{ width: 3, height: h, background: 'var(--brand)', borderRadius: 1, animation: `sparkle 0.6s infinite ${i*0.1}s` }}/>)}
          </div>
        </div>
      )}
      {/* 名字标签 */}
      <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '3px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>{label}</span>
        <span style={{ opacity: 0.7 }}>· {name}</span>
      </div>
      {/* 角色 */}
      <div style={{ position: 'absolute', bottom: 6, right: 6, background: role === 'clerk' ? 'var(--brand)' : '#FF9E44', color: '#fff', padding: '3px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800 }}>
        {role === 'clerk' ? '🛒 店员' : '👵 顾客'}
      </div>
    </div>
  );
}

function ClerkTaskCard() {
  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-1)', marginBottom: 10 }}>
        📝 你是店员，顾客把 68 元商品放在收银台。
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-ink)', marginBottom: 4 }}>需要覆盖 6 大要点：</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {['打招呼 + 询问会员', '立减 5 元（量化）', '3 张 5 元优惠券', '次日生效（关键）', '全场 9.9 减 5 元', '免费 1 星礼品'].map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, border: '1.5px solid var(--brand)', background: '#fff' }}/>
            <span>{i+1}. {t}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function CustomerPromptCard() {
  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-1)', marginBottom: 10 }}>
        🎭 你扮演：<b>大妈型</b> · 王阿姨
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#8A6500', marginBottom: 6 }}>人物设定：</div>
      <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink-2)', background: '#fff', padding: 8, borderRadius: 8, marginBottom: 8 }}>
        55 岁，家庭主妇，砍价精明，对"优惠"敏感但怕麻烦。买的是降压药 + 维生素，共 68 元。
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#8A6500', marginBottom: 4 }}>必须说的台词：</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
        <div style={{ background: '#fff', padding: '6px 8px', borderRadius: 6 }}>① 开场："帮我结一下账。"</div>
        <div style={{ background: '#fff', padding: '6px 8px', borderRadius: 6 }}>② 被问会员："没有。"（淡漠）</div>
        <div style={{ background: '#fff', padding: '6px 8px', borderRadius: 6 }}>③ 挑战对方："办了我不常来"</div>
        <div style={{ background: '#fff', padding: '6px 8px', borderRadius: 6 }}>④ 再挑战："要填好多资料吧？"</div>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: '#8A6500', fontStyle: 'italic' }}>💡 挑战越狠，店员长进越快</div>
    </>
  );
}

// ——— 结束后：切换角色 / 重新匹配 / 退出 ———
function SwapScreen({ onSwap, onReMatch, onExit }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24 }}>
      <div style={{ fontSize: 56 }}>🎉</div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>本轮结束！</div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
        同伴已为你打分 <b style={{ color: 'var(--brand)' }}>8.5 / 10</b>，<br/>评语："次日生效说得很到位 👏"
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
        <BigButton onClick={onSwap} style={{ width: '100%' }} icon={<span>🔄</span>}>交换角色再来一轮</BigButton>
        <BigButton variant="secondary" onClick={onReMatch} style={{ width: '100%' }}>重新匹配新伙伴</BigButton>
        <button onClick={onExit} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', fontSize: 13, padding: 8, cursor: 'pointer', fontFamily: 'inherit' }}>结束返回 →</button>
      </div>
    </div>
  );
}

Object.assign(window, { PeerMatchScreen });
