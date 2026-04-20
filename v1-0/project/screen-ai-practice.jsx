// 屏幕4：AI 数字人实时对练（核心差异化模块）
// 支持语音 + 文字输入切换；脚本边界的角色扮演；实时提示要覆盖的关键信息点

function AIPracticeScreen({ onComplete, avatarStyle = 'chibi' }) {
  const [mode, setMode] = React.useState('voice'); // 'voice' | 'text'
  const [messages, setMessages] = React.useState([
    { who: 'sys', text: '🎬 场景：王阿姨把 68 元的商品放在收银台。' },
    { who: 'customer', text: '帮我结一下账。', emotion: 'neutral' },
  ]);
  const [recording, setRecording] = React.useState(false);
  const [text, setText] = React.useState('');
  const [elapsed, setElapsed] = React.useState(0);
  const [coveredPoints, setCoveredPoints] = React.useState([true, false, false, false, false, false]);
  const scrollRef = React.useRef();

  const keyPoints = [
    { label: '打招呼', tip: '主动、友好' },
    { label: '询问会员', tip: '扫码时同步问' },
    { label: '立减 5 元', tip: '量化到本单' },
    { label: '优惠券', tip: '3张 × 5 元' },
    { label: '次日生效', tip: '关键提醒' },
    { label: '免费礼品', tip: '1 星权益' },
  ];

  // 计时器
  React.useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // 预设的店员示例话术（供 demo 展示）
  const cannedClerk = [
    '欢迎光临！一共 68 元。您有会员卡吗？我帮您查下优惠。',
    '没关系，现在办卡这单立减 5 元，等于 63 元就能拿走，还能送 3 张 5 元券。',
    '次日生效，下次满 9.9 减 5 元，一年能省 100 多。而且这个月会员日送花茶礼包。',
  ];
  // AI 顾客的预设回应
  const cannedCustomer = [
    { text: '没有，办会员有什么用？', emotion: 'curious' },
    { text: '3 张券啊，那要满多少才能用？', emotion: 'interested' },
    { text: '那行，帮我办一张吧，微信支付。', emotion: 'happy' },
  ];

  const [turn, setTurn] = React.useState(0);

  const sendClerk = (t) => {
    setMessages(m => [...m, { who: 'clerk', text: t }]);
    // 打钩一个关键点（demo 简化规则）
    setCoveredPoints(cp => {
      const next = [...cp];
      const idx = next.findIndex(x => !x);
      if (idx >= 0) next[idx] = true;
      return next;
    });
    // 触发AI回复
    setTimeout(() => {
      const reply = cannedCustomer[turn];
      if (reply) setMessages(m => [...m, { who: 'customer', text: reply.text, emotion: reply.emotion }]);
      setTurn(t => t + 1);
    }, 900);
    setText('');
  };

  const handleSend = () => {
    if (mode === 'text' && text.trim()) sendClerk(text.trim());
    if (mode === 'voice') {
      // 模拟语音识别 → 自动填入示例话术
      const next = cannedClerk[turn];
      if (next) sendClerk(next);
    }
  };

  const finished = coveredPoints.filter(Boolean).length >= 5;

  return (
    <div style={{ height: '100%', background: 'linear-gradient(180deg, #FFF4D6 0%, var(--bg-2) 30%)', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部：场景信息 + 计时 */}
      <AIPracticeHeader elapsed={elapsed} onClose={onComplete}/>
      {/* 对顾客"脸"的显示条 */}
      <CustomerStatusBar emotion={messages.slice().reverse().find(m=>m.who==='customer')?.emotion || 'neutral'} avatarStyle={avatarStyle}/>
      {/* 关键信息点覆盖清单 */}
      <KeyPointChecklist points={keyPoints} covered={coveredPoints}/>
      {/* 对话区 */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }} className="no-scrollbar">
        {messages.map((m, i) => <MessageBubble key={i} m={m} avatarStyle={avatarStyle}/>)}
      </div>
      {/* 输入栏 */}
      <AIInputBar
        mode={mode} setMode={setMode}
        text={text} setText={setText}
        recording={recording} setRecording={setRecording}
        onSend={handleSend}
        onEnd={onComplete}
        finished={finished}
      />
    </div>
  );
}

function AIPracticeHeader({ elapsed, onClose }) {
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return (
    <div style={{ padding: '54px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: 0, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        {Icon.x(18, '#1A1F2C')}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>AI 对练中</div>
        <div style={{ fontSize: 15, fontWeight: 800 }}>🏪 收银场景 · 会员引导</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', padding: '6px 12px', borderRadius: 999, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5B5B', animation: 'sparkle 1s infinite' }}/>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>{mm}:{ss}</span>
      </div>
    </div>
  );
}

function CustomerStatusBar({ emotion, avatarStyle }) {
  const emoConfig = {
    neutral: { emoji: '😐', label: '中性', color: 'var(--ink-3)' },
    curious: { emoji: '🤔', label: '有点兴趣', color: '#4E7BFF' },
    interested: { emoji: '😊', label: '心动了', color: 'var(--brand)' },
    happy: { emoji: '😄', label: '很满意', color: 'var(--brand)' },
    annoyed: { emoji: '😒', label: '不耐烦', color: 'var(--danger)' },
  };
  const e = emoConfig[emotion] || emoConfig.neutral;
  return (
    <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative' }}>
        <AvatarElder size={56} style={avatarStyle}/>
        <div style={{ position: 'absolute', bottom: -4, right: -4, background: '#fff', borderRadius: 999, padding: 2, fontSize: 16, boxShadow: 'var(--shadow-card)' }}>{e.emoji}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>王阿姨（AI）</div>
        <div style={{ fontSize: 12, color: e.color, fontWeight: 700 }}>情绪: {e.label}</div>
      </div>
      <button style={{ background: 'var(--bg-3)', border: 0, borderRadius: 10, padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--ink-2)' }}>
        💡 提示
      </button>
    </div>
  );
}

function KeyPointChecklist({ points, covered }) {
  const count = covered.filter(Boolean).length;
  return (
    <div style={{ margin: '4px 16px 8px', padding: 10, background: '#fff', borderRadius: 14, boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-2)', flex: 1 }}>🎯 关键话术要点 {count}/{points.length}</div>
        <ProgressBar value={count/points.length} height={6}/>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {points.map((p, i) => (
          <div key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
            background: covered[i] ? 'var(--brand-soft)' : 'var(--bg-3)',
            color: covered[i] ? 'var(--brand-ink)' : 'var(--ink-3)',
            border: covered[i] ? '1.5px solid var(--brand)' : '1.5px solid transparent',
          }}>
            {covered[i] ? '✓' : '○'} {p.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ m, avatarStyle }) {
  if (m.who === 'sys') {
    return (
      <div style={{ textAlign: 'center', margin: '12px 0', fontSize: 12, color: 'var(--ink-3)' }}>
        <span style={{ background: '#fff', padding: '4px 12px', borderRadius: 999, border: '1px dashed var(--line)' }}>{m.text}</span>
      </div>
    );
  }
  const isClerk = m.who === 'clerk';
  return (
    <div style={{ display: 'flex', justifyContent: isClerk ? 'flex-end' : 'flex-start', marginBottom: 10, gap: 8, animation: 'slide-up 0.3s var(--ease-out)' }}>
      {!isClerk && <AvatarElder size={32} style={avatarStyle}/>}
      <div style={{
        maxWidth: 260, padding: '10px 14px', borderRadius: 16,
        background: isClerk ? 'var(--brand)' : '#fff',
        color: isClerk ? '#fff' : 'var(--ink-1)',
        fontSize: 14, lineHeight: 1.4,
        boxShadow: isClerk ? '0 2px 8px rgba(20,184,122,0.25)' : 'var(--shadow-card)',
        borderBottomRightRadius: isClerk ? 4 : 16,
        borderBottomLeftRadius: isClerk ? 16 : 4,
      }}>{m.text}</div>
      {isClerk && <AvatarXiaomei size={32} style={avatarStyle}/>}
    </div>
  );
}

function AIInputBar({ mode, setMode, text, setText, recording, setRecording, onSend, onEnd, finished }) {
  return (
    <div style={{ padding: '10px 16px 32px', background: 'var(--bg-1)', borderTop: '1px solid var(--line)', borderRadius: '20px 20px 0 0' }}>
      {finished && (
        <div style={{ marginBottom: 10, padding: 10, background: 'var(--brand-soft)', borderRadius: 12, fontSize: 13, fontWeight: 700, color: 'var(--brand-ink)', textAlign: 'center' }}>
          ✨ 覆盖了关键要点，可以结束对练查看回放
        </div>
      )}
      {/* 模式切换 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button onClick={() => setMode('voice')} style={{
          flex: 1, appearance: 'none', border: 0, padding: '8px 10px',
          background: mode === 'voice' ? 'var(--brand-soft)' : 'var(--bg-3)',
          color: mode === 'voice' ? 'var(--brand-ink)' : 'var(--ink-3)',
          borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>{Icon.mic(16)} 语音模式</button>
        <button onClick={() => setMode('text')} style={{
          flex: 1, appearance: 'none', border: 0, padding: '8px 10px',
          background: mode === 'text' ? 'var(--brand-soft)' : 'var(--bg-3)',
          color: mode === 'text' ? 'var(--brand-ink)' : 'var(--ink-3)',
          borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>{Icon.keyboard(16)} 文字模式</button>
        <button onClick={onEnd} style={{
          appearance: 'none', border: 0, padding: '8px 14px',
          background: finished ? 'var(--brand)' : 'var(--bg-3)',
          color: finished ? '#fff' : 'var(--ink-3)',
          borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer',
        }}>结束 ▸</button>
      </div>
      {mode === 'voice' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onMouseDown={() => setRecording(true)} onMouseUp={() => { setRecording(false); onSend(); }}
            style={{
              flex: 1, padding: 14, borderRadius: 14, border: 0,
              background: recording ? 'var(--danger)' : 'var(--brand)',
              color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              boxShadow: `0 4px 0 ${recording ? '#C94545' : 'var(--brand-ink)'}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {Icon.mic(22)} {recording ? '松开发送...' : '按住说话'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSend()}
            placeholder="输入你要对顾客说的话..."
            style={{ flex: 1, padding: '12px 14px', border: '2px solid var(--line)', borderRadius: 14, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
          />
          <button onClick={onSend} style={{ padding: 12, borderRadius: 12, border: 0, background: 'var(--brand)', color: '#fff', cursor: 'pointer' }}>
            {Icon.chevronR(22, '#fff')}
          </button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AIPracticeScreen });
