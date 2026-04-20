// 屏幕4：AI 数字人实时对练
// 真实 Claude API 对话 + Web Speech API 语音识别 + 动态评分

// ⚙️ 配置：部署 Cloudflare Worker 后改为真实地址
// 本地开发时留空，会使用 demo 模式
const WORKER_URL = '';
// const WORKER_URL = 'https://store-practice-api.你的账号.workers.dev';

const SCENARIO = '收银场景·会员引导';
const KEY_POINTS = [
  { label: '打招呼',   tip: '主动、友好' },
  { label: '询问会员', tip: '扫码时同步问' },
  { label: '立减 5 元', tip: '量化到本单' },
  { label: '优惠券',  tip: '3张 × 5 元' },
  { label: '次日生效', tip: '关键提醒' },
  { label: '免费礼品', tip: '1 星权益' },
];

// Demo 模式：无 Worker URL 时的预设回复
const DEMO_CUSTOMER_REPLIES = [
  { text: '没有，办会员有什么用？', emotion: 'curious' },
  { text: '3 张券啊，那要满多少才能用？', emotion: 'interested' },
  { text: '那行，帮我办一张，微信支付。', emotion: 'happy' },
  { text: '好的好的，谢谢你啊。', emotion: 'happy' },
];

// ──────────────────────────────────────────────
// 解析情绪标签 [EMO:xxx]
// ──────────────────────────────────────────────
function parseEmotion(text) {
  const m = text.match(/\[EMO:(neutral|curious|interested|happy|annoyed)\]/);
  return {
    emotion: m ? m[1] : 'neutral',
    clean: text.replace(/\[EMO:[^\]]+\]/g, '').trim(),
  };
}

// ──────────────────────────────────────────────
// 调用 Worker /api/chat（流式）
// ──────────────────────────────────────────────
async function callChat(apiMessages, onChunk) {
  const resp = await fetch(`${WORKER_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: apiMessages, scenario: SCENARIO, customerName: '王阿姨' }),
  });
  if (!resp.ok) throw new Error(`API ${resp.status}`);

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const delta = json.delta?.text || '';
        if (delta) { full += delta; onChunk(full); }
      } catch {}
    }
  }
  return full;
}

// ──────────────────────────────────────────────
// 调用 Worker /api/score（同步）
// ──────────────────────────────────────────────
async function callScore(conversation) {
  const resp = await fetch(`${WORKER_URL}/api/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation, keyPoints: KEY_POINTS, scenario: SCENARIO }),
  });
  if (!resp.ok) throw new Error(`Score API ${resp.status}`);
  return resp.json();
}

// ──────────────────────────────────────────────
// Web Speech API Hook
// ──────────────────────────────────────────────
function useSpeechRecognition({ onResult, onEnd }) {
  const recRef = React.useRef(null);
  const [supported, setSupported] = React.useState(false);

  React.useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const rec = new SR();
    rec.lang = 'zh-CN';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      onResult(transcript, e.results[e.results.length - 1].isFinal);
    };
    rec.onend = onEnd;
    recRef.current = rec;
  }, []);

  const start = () => { try { recRef.current?.start(); } catch(e) {} };
  const stop  = () => { try { recRef.current?.stop();  } catch(e) {} };
  return { supported, start, stop };
}

// ──────────────────────────────────────────────
// 主屏幕
// ──────────────────────────────────────────────
function AIPracticeScreen({ onComplete, onBack, avatarStyle = 'chibi' }) {
  const [mode, setMode] = React.useState('voice');
  const [messages, setMessages] = React.useState([
    { who: 'sys', text: '🎬 场景：王阿姨把 68 元的商品放在收银台。' },
    { who: 'customer', text: '帮我结一下账。', emotion: 'neutral' },
  ]);
  const [text, setText] = React.useState('');
  const [elapsed, setElapsed] = React.useState(0);
  const [coveredPoints, setCoveredPoints] = React.useState([false, false, false, false, false, false]);
  const [aiTyping, setAiTyping] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [liveText, setLiveText] = React.useState('');
  const [scoring, setScoring] = React.useState(false);
  const [demoTurn, setDemoTurn] = React.useState(0);
  const scrollRef = React.useRef();
  const apiHistoryRef = React.useRef([{ role: 'assistant', content: '帮我结一下账。[EMO:neutral]' }]);
  const conversationRef = React.useRef([{ who: 'customer', text: '帮我结一下账。' }]);

  // 计时器
  React.useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // 自动滚底
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, aiTyping, liveText]);

  // 语音识别
  const { supported: speechSupported, start: startRec, stop: stopRec } = useSpeechRecognition({
    onResult: (transcript, isFinal) => {
      setLiveText(transcript);
      if (isFinal) {
        setLiveText('');
        setRecording(false);
        if (transcript.trim()) sendClerk(transcript.trim());
      }
    },
    onEnd: () => { setRecording(false); },
  });

  // 关键点检测（关键词匹配）
  function detectPoints(clerkText) {
    const rules = [
      [/欢迎|你好|您好|光临/,         0],
      [/会员|会员卡|会员码|扫码/,      1],
      [/立减|减\s*5|5\s*元.*优惠|省.*5/,2],
      [/券|3\s*张|优惠券/,             3],
      [/次日|明天.*生效|明日/,         4],
      [/礼品|礼物|免费|花茶/,          5],
    ];
    setCoveredPoints(prev => {
      const next = [...prev];
      rules.forEach(([re, idx]) => { if (re.test(clerkText)) next[idx] = true; });
      return next;
    });
  }

  // 发送店员消息 → AI 回复
  async function sendClerk(clerkText) {
    if (!clerkText.trim() || aiTyping || scoring) return;

    setMessages(m => [...m, { who: 'clerk', text: clerkText }]);
    setText('');
    detectPoints(clerkText);

    apiHistoryRef.current = [...apiHistoryRef.current, { role: 'user', content: clerkText }];
    conversationRef.current = [...conversationRef.current, { who: 'clerk', text: clerkText }];

    setAiTyping(true);
    let replyRaw = '';

    try {
      if (WORKER_URL) {
        // 真实流式 API
        await callChat(apiHistoryRef.current, (chunk) => {
          const { clean } = parseEmotion(chunk);
          setMessages(m => {
            const hasTyping = m[m.length - 1]?.who === 'ai_typing';
            const base = hasTyping ? m.slice(0, -1) : m;
            return [...base, { who: 'ai_typing', text: clean }];
          });
          replyRaw = chunk;
        });
      } else {
        // Demo 模式
        await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
        const reply = DEMO_CUSTOMER_REPLIES[demoTurn % DEMO_CUSTOMER_REPLIES.length];
        replyRaw = `${reply.text}[EMO:${reply.emotion}]`;
        setDemoTurn(t => t + 1);
      }
    } catch (e) {
      console.error('Chat error:', e);
      replyRaw = '你刚才说什么？[EMO:neutral]';
    }

    const { clean, emotion } = parseEmotion(replyRaw);
    apiHistoryRef.current = [...apiHistoryRef.current, { role: 'assistant', content: replyRaw }];
    conversationRef.current = [...conversationRef.current, { who: 'customer', text: clean }];

    setMessages(m => [...m.filter(x => x.who !== 'ai_typing'), { who: 'customer', text: clean, emotion }]);
    setAiTyping(false);
  }

  // 结束对练 → 评分 → 跳转结果页
  async function handleEnd() {
    if (scoring) return;
    setScoring(true);
    const covered = coveredPoints.filter(Boolean).length;

    let result;
    if (WORKER_URL && conversationRef.current.filter(m => m.who === 'clerk').length > 0) {
      try {
        result = await callScore(conversationRef.current);
      } catch (e) {
        console.error('Score error:', e);
        result = buildFallbackScore(covered);
      }
    } else {
      result = buildFallbackScore(covered);
    }

    setScoring(false);
    onComplete({ ...result, conversation: conversationRef.current });
  }

  function buildFallbackScore(covered) {
    const base = Math.round(50 + (covered / KEY_POINTS.length) * 40 + Math.random() * 10);
    const score = Math.min(base, 99);
    return {
      score,
      stars: score >= 85 ? 3 : score >= 65 ? 2 : 1,
      covered: KEY_POINTS.slice(0, covered).map(p => p.label),
      missed: KEY_POINTS.slice(covered).map(p => p.label),
      feedback_good: '话术基本流畅，引导有条理',
      feedback_improve: '可以更主动地量化收益',
      per_message: [],
    };
  }

  const finished = coveredPoints.filter(Boolean).length >= 4;
  const currentEmotion = [...messages].reverse().find(m => m.who === 'customer')?.emotion || 'neutral';

  return (
    <div style={{ height: '100%', background: 'linear-gradient(180deg, #FFF4D6 0%, var(--bg-2) 30%)', display: 'flex', flexDirection: 'column' }}>
      <AIPracticeHeader elapsed={elapsed} onClose={onBack || onComplete} />
      <CustomerStatusBar emotion={currentEmotion} avatarStyle={avatarStyle} />
      <KeyPointChecklist points={KEY_POINTS} covered={coveredPoints} />

      {/* 对话区 */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }} className="no-scrollbar">
        {messages.map((m, i) => <MessageBubble key={i} m={m} avatarStyle={avatarStyle} />)}

        {/* 语音识别实时预览 */}
        {liveText && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <div style={{ maxWidth: 260, padding: '10px 14px', borderRadius: '16px 4px 16px 16px', background: 'var(--brand)', opacity: 0.65, color: '#fff', fontSize: 14, fontStyle: 'italic' }}>
              {liveText}…
            </div>
          </div>
        )}

        {/* AI 打字中 */}
        {aiTyping && !liveText && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8, marginBottom: 10 }}>
            <AvatarElder size={32} />
            <div style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: '#fff', boxShadow: 'var(--shadow-card)' }}>
              <TypingDots />
            </div>
          </div>
        )}

        {scoring && (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-3)', fontSize: 13, fontWeight: 600 }}>
            ✨ AI 正在分析你的表现，请稍候…
          </div>
        )}
      </div>

      <AIInputBar
        mode={mode} setMode={setMode}
        text={text} setText={setText}
        recording={recording}
        speechSupported={speechSupported}
        aiTyping={aiTyping}
        onMicDown={() => { setRecording(true); setLiveText(''); startRec(); }}
        onMicUp={() => stopRec()}
        onSend={() => { if (text.trim()) sendClerk(text.trim()); }}
        onEnd={handleEnd}
        finished={finished}
        scoring={scoring}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// 打字动画
// ──────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 16 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: 'var(--ink-3)',
          animation: 'sparkle 1.2s infinite', animationDelay: `${i * 0.25}s`,
        }} />
      ))}
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
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5B5B', animation: 'sparkle 1s infinite' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>{mm}:{ss}</span>
      </div>
    </div>
  );
}

function CustomerStatusBar({ emotion, avatarStyle }) {
  const emoConfig = {
    neutral:    { emoji: '😐', label: '中性',    color: 'var(--ink-3)' },
    curious:    { emoji: '🤔', label: '有点兴趣', color: '#4E7BFF' },
    interested: { emoji: '😊', label: '心动了',   color: 'var(--brand)' },
    happy:      { emoji: '😄', label: '很满意',   color: 'var(--brand)' },
    annoyed:    { emoji: '😒', label: '不耐烦',   color: 'var(--danger)' },
  };
  const e = emoConfig[emotion] || emoConfig.neutral;
  return (
    <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative' }}>
        <AvatarElder size={56} style={avatarStyle} />
        <div style={{ position: 'absolute', bottom: -4, right: -4, background: '#fff', borderRadius: 999, padding: 2, fontSize: 16, boxShadow: 'var(--shadow-card)' }}>{e.emoji}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>王阿姨（AI）</div>
        <div style={{ fontSize: 12, color: e.color, fontWeight: 700 }}>情绪：{e.label}</div>
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
        <ProgressBar value={count / points.length} height={6} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {points.map((p, i) => (
          <div key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
            background: covered[i] ? 'var(--brand-soft)' : 'var(--bg-3)',
            color: covered[i] ? 'var(--brand-ink)' : 'var(--ink-3)',
            border: `1.5px solid ${covered[i] ? 'var(--brand)' : 'transparent'}`,
            transition: 'all 0.3s',
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
      {!isClerk && <AvatarElder size={32} style={avatarStyle} />}
      <div style={{
        maxWidth: 260, padding: '10px 14px', borderRadius: 16,
        background: isClerk ? 'var(--brand)' : '#fff',
        color: isClerk ? '#fff' : 'var(--ink-1)',
        fontSize: 14, lineHeight: 1.4,
        boxShadow: isClerk ? '0 2px 8px rgba(20,184,122,0.25)' : 'var(--shadow-card)',
        borderBottomRightRadius: isClerk ? 4 : 16,
        borderBottomLeftRadius: isClerk ? 16 : 4,
      }}>{m.text}</div>
      {isClerk && <AvatarXiaomei size={32} style={avatarStyle} />}
    </div>
  );
}

function AIInputBar({ mode, setMode, text, setText, recording, speechSupported, aiTyping, onMicDown, onMicUp, onSend, onEnd, finished, scoring }) {
  return (
    <div style={{ padding: '10px 16px 32px', background: 'var(--bg-1)', borderTop: '1px solid var(--line)', borderRadius: '20px 20px 0 0' }}>
      {finished && !scoring && (
        <div style={{ marginBottom: 10, padding: 10, background: 'var(--brand-soft)', borderRadius: 12, fontSize: 13, fontWeight: 700, color: 'var(--brand-ink)', textAlign: 'center' }}>
          ✨ 覆盖了关键要点，可以结束对练查看报告
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {['voice', 'text'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, appearance: 'none', border: 0, padding: '8px 10px',
            background: mode === m ? 'var(--brand-soft)' : 'var(--bg-3)',
            color: mode === m ? 'var(--brand-ink)' : 'var(--ink-3)',
            borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            {m === 'voice' ? <>{Icon.mic(16)} 语音</> : <>{Icon.keyboard(16)} 文字</>}
          </button>
        ))}
        <button onClick={onEnd} disabled={scoring} style={{
          appearance: 'none', border: 0, padding: '8px 14px',
          background: finished ? 'var(--brand)' : 'var(--bg-3)',
          color: finished ? '#fff' : 'var(--ink-3)',
          borderRadius: 10, fontSize: 12, fontWeight: 800,
          cursor: scoring ? 'wait' : 'pointer', opacity: scoring ? 0.7 : 1,
        }}>{scoring ? '评分中…' : '结束 ▸'}</button>
      </div>

      {mode === 'voice' ? (
        <button
          onMouseDown={onMicDown} onMouseUp={onMicUp}
          onTouchStart={onMicDown} onTouchEnd={onMicUp}
          disabled={aiTyping || scoring}
          style={{
            width: '100%', padding: 14, borderRadius: 14, border: 0,
            background: recording ? 'var(--danger)' : aiTyping ? 'var(--bg-3)' : 'var(--brand)',
            color: aiTyping ? 'var(--ink-3)' : '#fff',
            fontSize: 15, fontWeight: 800, cursor: aiTyping ? 'not-allowed' : 'pointer',
            boxShadow: `0 4px 0 ${recording ? '#C94545' : aiTyping ? 'transparent' : 'var(--brand-ink)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.15s',
          }}>
          {Icon.mic(22)}
          {recording ? '松开发送…' : aiTyping ? '顾客回复中…' : speechSupported ? '按住说话' : '请切换文字模式'}
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !aiTyping && onSend()}
            placeholder="输入你要对顾客说的话…"
            disabled={aiTyping || scoring}
            style={{ flex: 1, padding: '12px 14px', border: '2px solid var(--line)', borderRadius: 14, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: aiTyping ? 'var(--bg-3)' : '#fff' }}
          />
          <button onClick={onSend} disabled={aiTyping || !text.trim() || scoring}
            style={{ padding: 12, borderRadius: 12, border: 0, background: text.trim() && !aiTyping ? 'var(--brand)' : 'var(--bg-3)', cursor: 'pointer' }}>
            {Icon.chevronR(22, text.trim() && !aiTyping ? '#fff' : 'var(--ink-3)')}
          </button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AIPracticeScreen });
