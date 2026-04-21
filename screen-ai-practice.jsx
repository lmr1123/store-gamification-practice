// 屏幕4：AI 数字人实时对练
// 新流程：scenario-init + customer-turn（顾客Agent状态驱动）+ 结构化行为评分

const WORKER_URL = 'http://localhost:8899';
const SCENARIO = '收银场景·会员引导';

const KEY_POINTS = [
  { label: '打招呼', tip: '主动、友好' },
  { label: '询问会员', tip: '扫码时同步问' },
  { label: '立减 5 元', tip: '量化到本单' },
  { label: '优惠券', tip: '3张 × 5 元' },
  { label: '次日生效', tip: '关键提醒' },
  { label: '免费礼品', tip: '1 星权益' },
];

const DEFAULT_CUSTOMER_STATE = {
  trust: 45,
  patience: 72,
  interest: 38,
  budgetSensitivity: 76,
  objectionLevel: 58,
  emotion: 'neutral',
  stage: 'opening',
  turn: 0,
};

const STAGE_LABEL = {
  opening: '开场',
  probing: '探询',
  value: '价值确认',
  objection: '异议处理中',
  closing: '成交推进',
  done: '成交达成',
};

function normalizeCustomerState(s) {
  return {
    ...DEFAULT_CUSTOMER_STATE,
    ...(s || {}),
    trust: Number.isFinite(s?.trust) ? s.trust : DEFAULT_CUSTOMER_STATE.trust,
    patience: Number.isFinite(s?.patience) ? s.patience : DEFAULT_CUSTOMER_STATE.patience,
    interest: Number.isFinite(s?.interest) ? s.interest : DEFAULT_CUSTOMER_STATE.interest,
    budgetSensitivity: Number.isFinite(s?.budgetSensitivity) ? s.budgetSensitivity : DEFAULT_CUSTOMER_STATE.budgetSensitivity,
    objectionLevel: Number.isFinite(s?.objectionLevel) ? s.objectionLevel : DEFAULT_CUSTOMER_STATE.objectionLevel,
  };
}

async function callScenarioInit() {
  const resp = await fetch(`${WORKER_URL}/api/scenario-init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario: SCENARIO, customerName: '王阿姨' }),
  });
  if (!resp.ok) throw new Error(`Init API ${resp.status}`);
  return resp.json();
}

async function callCustomerTurn({ clerkText, customerState, history, customerName = '王阿姨' }) {
  const resp = await fetch(`${WORKER_URL}/api/customer-turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scenario: SCENARIO,
      customerName,
      clerkText,
      customerState,
      history,
    }),
  });
  if (!resp.ok) throw new Error(`Turn API ${resp.status}`);
  return resp.json();
}

async function callScore(conversation) {
  const resp = await fetch(`${WORKER_URL}/api/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation, scenario: SCENARIO }),
  });
  if (!resp.ok) throw new Error(`Score API ${resp.status}`);
  return resp.json();
}

function buildDemoScenarioInit() {
  return {
    scenario: SCENARIO,
    sceneIntro: '王阿姨把68元商品放在收银台，准备结账。',
    customerName: '王阿姨',
    customerProfile: '50岁左右，价格敏感，不喜欢被强推。',
    openingLine: '帮我结一下账，快一点哈。',
    customerState: { ...DEFAULT_CUSTOMER_STATE },
  };
}

function inferDemoEmotion(state) {
  if (state.patience < 30 || state.trust < 30) return 'annoyed';
  if (state.interest > 78 && state.trust > 70) return 'happy';
  if (state.interest > 58) return 'interested';
  if (state.interest > 42) return 'curious';
  return 'neutral';
}

function buildDemoTurn(prevState, clerkText) {
  const state = normalizeCustomerState(prevState);
  const text = String(clerkText || '');
  const next = { ...state, turn: (state.turn || 0) + 1 };
  const delta = { trust: 0, patience: 0, interest: 0, objectionLevel: 0 };
  const notes = [];

  if (/你好|您好|欢迎|光临/.test(text)) {
    delta.trust += 5;
    delta.patience += 4;
    notes.push('开场礼貌');
  }
  if (/会员|积分|办卡/.test(text)) {
    delta.interest += 6;
    notes.push('进入会员议题');
  }
  if (/(立减|减)\s*5|省\s*5|5\s*元|优惠券|3\s*张/.test(text)) {
    delta.interest += 12;
    delta.trust += 4;
    delta.objectionLevel -= 7;
    notes.push('量化收益');
  }
  if (/次日|明天.*生效|有效期|满\d+/.test(text)) {
    delta.trust += 7;
    delta.objectionLevel -= 6;
    notes.push('解释规则');
  }
  if (/必须|赶紧|一定要|立刻/.test(text)) {
    delta.patience -= 12;
    delta.trust -= 10;
    delta.objectionLevel += 10;
    notes.push('强推触发反感');
  }

  next.trust = Math.max(0, Math.min(100, next.trust + delta.trust));
  next.patience = Math.max(0, Math.min(100, next.patience + delta.patience));
  next.interest = Math.max(0, Math.min(100, next.interest + delta.interest));
  next.objectionLevel = Math.max(0, Math.min(100, next.objectionLevel + delta.objectionLevel));
  next.emotion = inferDemoEmotion(next);

  if (next.turn <= 1) next.stage = 'opening';
  else if (next.interest > 65) next.stage = 'value';
  else if (next.objectionLevel > 62) next.stage = 'objection';
  else if (next.interest > 78 && next.trust > 72) next.stage = 'done';
  else next.stage = 'probing';

  let intent = 'ask_detail';
  let reason = '继续了解会员价值';
  let customerReply = '还有别的优惠吗？';
  if (next.stage === 'done') {
    intent = 'ready_join';
    reason = '价值和信任已达成';
    customerReply = '行，那你帮我办吧。';
  } else if (next.patience < 28) {
    intent = 'want_leave';
    reason = '耐心不足';
    customerReply = '我赶时间，先不用了。';
  } else if (next.objectionLevel > 62) {
    intent = 'raise_objection';
    reason = '异议较高';
    customerReply = '办了会不会不划算？';
  } else if (/立减|优惠券/.test(text) && !/次日|生效/.test(text)) {
    intent = 'ask_rule';
    reason = '优惠规则未讲清';
    customerReply = '这券具体怎么用啊？';
  }

  return {
    customerReply,
    emotion: next.emotion,
    customerState: next,
    decisionTrace: {
      intent,
      action: intent === 'ready_join' ? 'accept' : intent === 'want_leave' ? 'reject' : 'question',
      keyConcern: '是否真的省钱',
      reason,
      ruleNotes: notes,
      delta,
    },
  };
}

// ──────────────────────────────────────────────
// Web Speech API Hook
// ──────────────────────────────────────────────
function useSpeechRecognition({ onResult, onEnd }) {
  const recRef = React.useRef(null);
  const onResultRef = React.useRef(onResult);
  const onEndRef = React.useRef(onEnd);
  const [supported, setSupported] = React.useState(false);
  const [speechError, setSpeechError] = React.useState('');

  onResultRef.current = onResult;
  onEndRef.current = onEnd;

  React.useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn('浏览器不支持 Web Speech API，请使用 Chrome');
      return;
    }
    setSupported(true);

    const rec = new SR();
    rec.lang = 'zh-CN';
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join('');
      onResultRef.current(transcript, e.results[e.results.length - 1].isFinal);
    };
    rec.onend = () => onEndRef.current();
    rec.onerror = (e) => {
      const msg = {
        'not-allowed': '麦克风权限被拒，请在浏览器地址栏允许麦克风',
        'service-not-allowed': '浏览器限制，请使用 Chrome 并允许麦克风',
        'no-speech': '未检测到声音，请靠近麦克风重试',
        network: '网络错误，语音识别需要联网',
        aborted: '',
      }[e.error] || `语音错误：${e.error}`;
      if (msg) setSpeechError(msg);
      onEndRef.current();
    };
    recRef.current = rec;
  }, []);

  const start = () => {
    setSpeechError('');
    try {
      recRef.current?.start();
    } catch {}
  };
  const stop = () => {
    try {
      recRef.current?.stop();
    } catch {}
  };
  return { supported, start, stop, speechError };
}

// ──────────────────────────────────────────────
// 主屏幕
// ──────────────────────────────────────────────
function AIPracticeScreen({ onComplete, onBack, avatarStyle = 'chibi' }) {
  const [mode, setMode] = React.useState('voice');
  const [messages, setMessages] = React.useState([{ who: 'sys', text: '⏳ 场景加载中…' }]);
  const [text, setText] = React.useState('');
  const [elapsed, setElapsed] = React.useState(0);
  const [coveredPoints, setCoveredPoints] = React.useState([false, false, false, false, false, false]);
  const [aiTyping, setAiTyping] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [liveText, setLiveText] = React.useState('');
  const [scoring, setScoring] = React.useState(false);
  const [scenarioLoading, setScenarioLoading] = React.useState(true);
  const [customerState, setCustomerState] = React.useState({ ...DEFAULT_CUSTOMER_STATE });
  const [customerMeta, setCustomerMeta] = React.useState({ customerName: '王阿姨', customerProfile: '' });
  const [decisionTrace, setDecisionTrace] = React.useState(null);
  const [demoMode, setDemoMode] = React.useState(false);
  const scrollRef = React.useRef(null);
  const conversationRef = React.useRef([]);
  const customerStateRef = React.useRef({ ...DEFAULT_CUSTOMER_STATE });

  React.useEffect(() => {
    customerStateRef.current = customerState;
  }, [customerState]);

  React.useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, aiTyping, liveText]);

  // 场景初始化
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setScenarioLoading(true);
      try {
        const initData = WORKER_URL ? await callScenarioInit() : buildDemoScenarioInit();
        if (cancelled) return;
        const initState = normalizeCustomerState(initData.customerState);
        const openingLine = initData.openingLine || '帮我结一下账。';
        const sceneIntro = initData.sceneIntro || '王阿姨正在收银台等待结账。';

        setCustomerState(initState);
        setCustomerMeta({
          customerName: initData.customerName || '王阿姨',
          customerProfile: initData.customerProfile || '',
        });
        setMessages([
          { who: 'sys', text: `🎬 场景：${sceneIntro}` },
          { who: 'customer', text: openingLine, emotion: initState.emotion },
        ]);
        setDecisionTrace({
          intent: 'opening',
          reason: '顾客刚进入场景，优先快速结账。',
          keyConcern: '是否值得办会员',
          ruleNotes: ['完成场景初始化'],
          delta: { trust: 0, patience: 0, interest: 0, objectionLevel: 0 },
        });
        conversationRef.current = [{ who: 'customer', text: openingLine }];
        setDemoMode(!WORKER_URL);
      } catch (e) {
        const initData = buildDemoScenarioInit();
        const initState = normalizeCustomerState(initData.customerState);
        setDemoMode(true);
        setCustomerState(initState);
        setCustomerMeta({ customerName: initData.customerName, customerProfile: initData.customerProfile });
        setMessages([
          { who: 'sys', text: '🎬 场景：王阿姨把68元商品放在收银台，准备结账。' },
          { who: 'customer', text: initData.openingLine, emotion: initState.emotion },
        ]);
        conversationRef.current = [{ who: 'customer', text: initData.openingLine }];
      } finally {
        if (!cancelled) setScenarioLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { supported: speechSupported, start: startRec, stop: stopRec, speechError } = useSpeechRecognition({
    onResult: (transcript, isFinal) => {
      setLiveText(transcript);
      if (isFinal) {
        setLiveText('');
        setRecording(false);
        if (transcript.trim()) sendClerk(transcript.trim());
      }
    },
    onEnd: () => setRecording(false),
  });

  function detectPoints(clerkText) {
    const rules = [
      [/欢迎|你好|您好|光临/, 0],
      [/会员|会员卡|会员码|扫码/, 1],
      [/立减|减\s*5|5\s*元.*优惠|省.*5/, 2],
      [/券|3\s*张|优惠券/, 3],
      [/次日|明天.*生效|明日/, 4],
      [/礼品|礼物|免费|花茶/, 5],
    ];
    setCoveredPoints((prev) => {
      const next = [...prev];
      rules.forEach(([re, idx]) => {
        if (re.test(clerkText)) next[idx] = true;
      });
      return next;
    });
  }

  async function sendClerk(clerkText) {
    if (!clerkText.trim() || aiTyping || scoring || scenarioLoading) return;

    setMessages((m) => [...m, { who: 'clerk', text: clerkText }]);
    setText('');
    detectPoints(clerkText);
    conversationRef.current = [...conversationRef.current, { who: 'clerk', text: clerkText }];

    setAiTyping(true);

    try {
      let turnResp;
      if (WORKER_URL && !demoMode) {
        turnResp = await callCustomerTurn({
          clerkText,
          customerState: customerStateRef.current,
          history: conversationRef.current.slice(-8),
          customerName: customerMeta.customerName || '王阿姨',
        });
      } else {
        await new Promise((r) => setTimeout(r, 700));
        turnResp = buildDemoTurn(customerStateRef.current, clerkText);
      }

      const nextState = normalizeCustomerState(turnResp.customerState);
      const emotion = turnResp.emotion || nextState.emotion || 'neutral';
      const customerReply = (turnResp.customerReply || '你再说详细一点。').trim();

      setCustomerState({ ...nextState, emotion });
      setDecisionTrace(turnResp.decisionTrace || null);
      conversationRef.current = [...conversationRef.current, { who: 'customer', text: customerReply }];

      setMessages((m) => [...m, { who: 'customer', text: customerReply, emotion }]);
    } catch (e) {
      const fallback = buildDemoTurn(customerStateRef.current, clerkText);
      const nextState = normalizeCustomerState(fallback.customerState);
      setDemoMode(true);
      setCustomerState(nextState);
      setDecisionTrace(fallback.decisionTrace);
      conversationRef.current = [...conversationRef.current, { who: 'customer', text: fallback.customerReply }];
      setMessages((m) => [...m, { who: 'customer', text: fallback.customerReply, emotion: fallback.emotion }]);
    } finally {
      setAiTyping(false);
    }
  }

  async function handleEnd() {
    if (scoring) return;
    setScoring(true);
    const covered = coveredPoints.filter(Boolean).length;

    let result;
    if ((WORKER_URL || demoMode) && conversationRef.current.filter((m) => m.who === 'clerk').length > 0) {
      try {
        result = await callScore(conversationRef.current);
      } catch {
        result = buildFallbackScore(covered);
      }
    } else {
      result = buildFallbackScore(covered);
    }

    setScoring(false);
    onComplete({ ...result, conversation: conversationRef.current });
  }

  function buildFallbackScore(covered) {
    const base = Math.round(55 + (covered / KEY_POINTS.length) * 38 + Math.random() * 8);
    const score = Math.min(base, 99);
    return {
      score,
      stars: score >= 85 ? 3 : score >= 65 ? 2 : 1,
      covered: KEY_POINTS.slice(0, covered).map((p) => p.label),
      missed: KEY_POINTS.slice(covered).map((p) => p.label),
      feedback_good: '价值表达有进步',
      feedback_improve: '多做异议处理',
      behavior_scores: [
        { dimension: '关系建立', score: Math.max(45, score - 8), evidence: ['开场沟通较顺畅'], advice: '继续保持开场礼貌' },
        { dimension: '需求探询', score: Math.max(40, score - 6), evidence: ['会员意向有探询'], advice: '增加场景问题' },
        { dimension: '价值表达', score: Math.min(98, score + 4), evidence: ['有量化优惠'], advice: '更聚焦本单收益' },
        { dimension: '异议处理', score: Math.max(35, score - 10), evidence: ['规则说明不足'], advice: '优先回应顾虑' },
        { dimension: '成交推进', score: Math.max(38, score - 5), evidence: ['有收口动作'], advice: '结尾更明确' },
      ],
      behavior_summary: {
        strengths: ['价值表达清晰度提升'],
        risks: ['异议处理略弱，可能影响转化'],
        next_actions: ['先问需求再给优惠', '规则解释保持一句话闭环'],
      },
      per_message: [],
    };
  }

  const coveredCount = coveredPoints.filter(Boolean).length;
  const finished = coveredCount >= 4 || customerState.stage === 'done';
  const currentEmotion = customerState.emotion || [...messages].reverse().find((m) => m.who === 'customer')?.emotion || 'neutral';

  return (
    <div style={{ height: '100%', background: 'linear-gradient(180deg, #FFF4D6 0%, var(--bg-2) 30%)', display: 'flex', flexDirection: 'column' }}>
      <AIPracticeHeader elapsed={elapsed} onClose={onBack || onComplete} />
      <div style={{ padding: '4px 16px 0', display: 'grid', gap: 8 }}>
        <DigitalCustomerAvatar
          emotion={currentEmotion}
          avatarStyle={avatarStyle}
          customerName={customerMeta.customerName || '王阿姨'}
          stage={customerState.stage}
        />
        <CustomerStatePanel customerState={customerState} decisionTrace={decisionTrace} />
      </div>
      <KeyPointChecklist points={KEY_POINTS} covered={coveredPoints} />

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }} className="no-scrollbar">
        {messages.map((m, i) => <MessageBubble key={i} m={m} avatarStyle={avatarStyle} />)}

        {liveText && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <div style={{ maxWidth: 260, padding: '10px 14px', borderRadius: '16px 4px 16px 16px', background: 'var(--brand)', opacity: 0.65, color: '#fff', fontSize: 14, fontStyle: 'italic' }}>
              {liveText}…
            </div>
          </div>
        )}

        {aiTyping && !liveText && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8, marginBottom: 10 }}>
            <DigitalCustomerAvatar emotion={currentEmotion} avatarStyle={avatarStyle} compact />
            <div style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: '#fff', boxShadow: 'var(--shadow-card)' }}>
              <TypingDots />
            </div>
          </div>
        )}

        {scoring && (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-3)', fontSize: 13, fontWeight: 600 }}>
            ✨ AI 正在分析你的行为表现，请稍候…
          </div>
        )}
      </div>

      <AIInputBar
        mode={mode}
        setMode={setMode}
        text={text}
        setText={setText}
        recording={recording}
        speechSupported={speechSupported}
        speechError={speechError}
        aiTyping={aiTyping}
        onMicDown={() => {
          if (scenarioLoading) return;
          setRecording(true);
          setLiveText('');
          startRec();
        }}
        onMicUp={() => stopRec()}
        onSend={() => {
          if (text.trim()) sendClerk(text.trim());
        }}
        onEnd={handleEnd}
        finished={finished}
        scoring={scoring}
        disabled={scenarioLoading}
      />
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 16 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--ink-3)',
            animation: 'sparkle 1.2s infinite',
            animationDelay: `${i * 0.25}s`,
          }}
        />
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
        <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>顾客Agent 对练中</div>
        <div style={{ fontSize: 15, fontWeight: 800 }}>🏪 收银场景 · 会员引导</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', padding: '6px 12px', borderRadius: 999, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5B5B', animation: 'sparkle 1s infinite' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>{mm}:{ss}</span>
      </div>
    </div>
  );
}

// 新组件：数字顾客头像（情绪切换）
function DigitalCustomerAvatar({ emotion = 'neutral', avatarStyle, customerName = '王阿姨', stage, compact = false }) {
  const emoConfig = {
    neutral: { emoji: '😐', color: '#7D8597', bg: 'linear-gradient(135deg,#EEF1F6 0%,#E2E7EE 100%)', glow: 'rgba(125,133,151,0.2)' },
    curious: { emoji: '🤔', color: '#4E7BFF', bg: 'linear-gradient(135deg,#EAF0FF 0%,#DCE7FF 100%)', glow: 'rgba(78,123,255,0.25)' },
    interested: { emoji: '😊', color: '#14B87A', bg: 'linear-gradient(135deg,#E8FAF3 0%,#D6F5E9 100%)', glow: 'rgba(20,184,122,0.25)' },
    happy: { emoji: '😄', color: '#09A66D', bg: 'linear-gradient(135deg,#DDF9EC 0%,#CAF4E1 100%)', glow: 'rgba(9,166,109,0.35)' },
    annoyed: { emoji: '😒', color: '#FF6A5F', bg: 'linear-gradient(135deg,#FFF1EF 0%,#FFE4E0 100%)', glow: 'rgba(255,106,95,0.3)' },
  };
  const e = emoConfig[emotion] || emoConfig.neutral;
  const size = compact ? 32 : 60;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 0 : 10 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: e.bg,
          border: `2px solid ${e.color}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: `0 0 0 3px ${e.glow}, 0 6px 14px rgba(0,0,0,0.08)`,
          transition: 'all 0.3s',
          animation: compact ? 'none' : 'float-badge 2.4s ease-in-out infinite',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <AvatarElder size={size - 6} style={avatarStyle} />
        <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#fff', borderRadius: 999, padding: '1px 5px', fontSize: compact ? 12 : 16, boxShadow: 'var(--shadow-card)' }}>
          {e.emoji}
        </div>
      </div>
      {!compact && (
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{customerName}（顾客Agent）</div>
          <div style={{ fontSize: 12, color: e.color, fontWeight: 700 }}>
            情绪：{emotion} · 阶段：{STAGE_LABEL[stage] || '开场'}
          </div>
        </div>
      )}
    </div>
  );
}

// 新组件：顾客状态面板
function CustomerStatePanel({ customerState, decisionTrace }) {
  const state = normalizeCustomerState(customerState);
  const bars = [
    { key: 'trust', label: '信任', value: state.trust, color: '#14B87A' },
    { key: 'patience', label: '耐心', value: state.patience, color: '#4E7BFF' },
    { key: 'interest', label: '兴趣', value: state.interest, color: '#FF9E44' },
    { key: 'objectionLevel', label: '异议', value: state.objectionLevel, color: '#FF6A5F', reverse: true },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '10px 12px', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-2)' }}>🧠 顾客状态</div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>
          第 {state.turn || 0} 轮 · {STAGE_LABEL[state.stage] || '开场'}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        {bars.map((b) => {
          const showValue = b.reverse ? 100 - b.value : b.value;
          return (
            <div key={b.key} style={{ display: 'grid', gridTemplateColumns: '44px 1fr 34px', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{b.label}</span>
              <div style={{ height: 7, borderRadius: 999, background: '#EEF1F6', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, showValue))}%`, background: b.color, borderRadius: 999, transition: 'width 0.35s var(--ease-out)' }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 800, textAlign: 'right' }}>{Math.round(showValue)}</span>
            </div>
          );
        })}
      </div>

      {decisionTrace && (
        <div style={{ marginTop: 8, padding: '7px 9px', borderRadius: 9, background: 'var(--bg-3)', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 700 }}>意图：{decisionTrace.intent || 'ask_detail'}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.35 }}>
            {decisionTrace.reason || '顾客在持续评估会员价值。'}
          </div>
        </div>
      )}
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
          <div
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              background: covered[i] ? 'var(--brand-soft)' : 'var(--bg-3)',
              color: covered[i] ? 'var(--brand-ink)' : 'var(--ink-3)',
              border: `1.5px solid ${covered[i] ? 'var(--brand)' : 'transparent'}`,
              transition: 'all 0.3s',
            }}
          >
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
      {!isClerk && <DigitalCustomerAvatar emotion={m.emotion || 'neutral'} avatarStyle={avatarStyle} compact />}
      <div
        style={{
          maxWidth: 260,
          padding: '10px 14px',
          borderRadius: 16,
          background: isClerk ? 'var(--brand)' : '#fff',
          color: isClerk ? '#fff' : 'var(--ink-1)',
          fontSize: 14,
          lineHeight: 1.4,
          boxShadow: isClerk ? '0 2px 8px rgba(20,184,122,0.25)' : 'var(--shadow-card)',
          borderBottomRightRadius: isClerk ? 4 : 16,
          borderBottomLeftRadius: isClerk ? 16 : 4,
        }}
      >
        {m.text}
      </div>
      {isClerk && <AvatarXiaomei size={32} style={avatarStyle} />}
    </div>
  );
}

function AIInputBar({
  mode,
  setMode,
  text,
  setText,
  recording,
  speechSupported,
  speechError,
  aiTyping,
  onMicDown,
  onMicUp,
  onSend,
  onEnd,
  finished,
  scoring,
  disabled,
}) {
  return (
    <div style={{ padding: '10px 16px 32px', background: 'var(--bg-1)', borderTop: '1px solid var(--line)', borderRadius: '20px 20px 0 0' }}>
      {speechError && (
        <div style={{ marginBottom: 8, padding: '8px 12px', background: '#FFF0F0', borderRadius: 10, fontSize: 12, fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
          🎤 {speechError}
        </div>
      )}
      {finished && !scoring && (
        <div style={{ marginBottom: 10, padding: 10, background: 'var(--brand-soft)', borderRadius: 12, fontSize: 13, fontWeight: 700, color: 'var(--brand-ink)', textAlign: 'center' }}>
          ✨ 对练已进入可成交状态，可结束查看行为报告
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {['voice', 'text'].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            disabled={disabled}
            style={{
              flex: 1,
              appearance: 'none',
              border: 0,
              padding: '8px 10px',
              background: mode === m ? 'var(--brand-soft)' : 'var(--bg-3)',
              color: mode === m ? 'var(--brand-ink)' : 'var(--ink-3)',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {m === 'voice' ? <>{Icon.mic(16)} 语音</> : <>{Icon.keyboard(16)} 文字</>}
          </button>
        ))}
        <button
          onClick={onEnd}
          disabled={scoring || disabled}
          style={{
            appearance: 'none',
            border: 0,
            padding: '8px 14px',
            background: finished ? 'var(--brand)' : 'var(--bg-3)',
            color: finished ? '#fff' : 'var(--ink-3)',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 800,
            cursor: scoring || disabled ? 'wait' : 'pointer',
            opacity: scoring || disabled ? 0.7 : 1,
          }}
        >
          {scoring ? '评分中…' : disabled ? '初始化中…' : '结束 ▸'}
        </button>
      </div>

      {mode === 'voice' ? (
        <button
          onMouseDown={onMicDown}
          onMouseUp={onMicUp}
          onTouchStart={onMicDown}
          onTouchEnd={onMicUp}
          disabled={aiTyping || scoring || disabled}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 14,
            border: 0,
            background: recording ? 'var(--danger)' : aiTyping || disabled ? 'var(--bg-3)' : 'var(--brand)',
            color: aiTyping || disabled ? 'var(--ink-3)' : '#fff',
            fontSize: 15,
            fontWeight: 800,
            cursor: aiTyping || disabled ? 'not-allowed' : 'pointer',
            boxShadow: `0 4px 0 ${recording ? '#C94545' : aiTyping || disabled ? 'transparent' : 'var(--brand-ink)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'background 0.15s',
          }}
        >
          {Icon.mic(22)}
          {recording ? '松开发送…' : aiTyping ? '顾客回复中…' : disabled ? '场景初始化中…' : speechSupported ? '按住说话' : '请切换文字模式'}
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !aiTyping && !disabled && onSend()}
            placeholder={disabled ? '场景初始化中…' : '输入你要对顾客说的话…'}
            disabled={aiTyping || scoring || disabled}
            style={{ flex: 1, padding: '12px 14px', border: '2px solid var(--line)', borderRadius: 14, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: aiTyping || disabled ? 'var(--bg-3)' : '#fff' }}
          />
          <button
            onClick={onSend}
            disabled={aiTyping || !text.trim() || scoring || disabled}
            style={{ padding: 12, borderRadius: 12, border: 0, background: text.trim() && !aiTyping && !disabled ? 'var(--brand)' : 'var(--bg-3)', cursor: 'pointer' }}
          >
            {Icon.chevronR(22, text.trim() && !aiTyping && !disabled ? '#fff' : 'var(--ink-3)')}
          </button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AIPracticeScreen, CustomerStatePanel, DigitalCustomerAvatar });
